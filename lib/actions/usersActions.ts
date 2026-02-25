"use server";

import { User, UserActionState } from "../types/userTypes";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { DatabaseError, safeQuery } from "../db";
import {
  AddUserSchema,
  ArchiveUserSchema,
  UpdateUserSchema,
} from "../schemas/userSchema";
import { sendMail } from "../utils/nodeMailerUtils";

export async function getUser(email: string): Promise<User | undefined> {
  try {
    const sql = `
      SELECT TOP 1
        u.email,
        u.password,
        u.role,
        u.sector,
        u.createdAt
      FROM [User] u
      WHERE u.email = @p1`;

    const { rows } = await safeQuery<User>(sql, [email]);
    return rows[0];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

/**
 * Fetch the total number of pages of users matching the filters.
 */

export async function fetchUsersPages(
  query: string,
  startDate: string,
  endDate: string,
  showArchived: boolean = false,
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  const likeParam = `%${query}%`;
  const params: Array<string> = [likeParam];

  let countSql = `
    SELECT COUNT(*) AS total
    FROM [User] u
    WHERE (
      u.name   LIKE $1 OR
      u.email  LIKE $1 OR
      u.sector   LIKE $1
    )
  `;

  if (showArchived) {
    countSql += ` AND u.status = 'archived'`;
  } else {
    countSql += ` AND (u.status IS NULL OR u.status = '')`;
  }

  if (startDate && endDate) {
    countSql += ` AND u.createdAt BETWEEN $${params.length + 1} AND $${
      params.length + 2
    }`;
    params.push(startDate, endDate);
  } else if (startDate) {
    countSql += ` AND u.createdAt >= $${params.length + 1}`;
    params.push(startDate);
  } else if (endDate) {
    countSql += ` AND u.createdAt <= $${params.length + 1}`;
    params.push(endDate);
  }

  const countRes = await safeQuery<{ total: number }>(countSql, params);
  const total = parseInt(countRes.rows[0]?.total.toString() || "0", 10);
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/**
 * Compatible pagination using ROW_NUMBER() for older MSSQL
 */
export async function fetchFilteredUsers(
  query: string,
  startDate: string,
  endDate: string,
  currentPage: number,
  showArchived: boolean = false,
): Promise<User[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const likeParam = `%${query}%`;
  const params: Array<string | number> = [likeParam];

  // Correct the SQL syntax here by adding a comma between columns and fixing the LIKE clause
  let sql = `
     WITH UserResults AS (
       SELECT
         u.id,
         u.name,
         u.email,
         u.status,
         u.image,
         u.role,
         u.sector,
         u.createdAt,
         ROW_NUMBER() OVER (ORDER BY u.createdAt ASC) AS RowNum
       FROM [User] u
       WHERE (
         u.name LIKE $1 OR
         u.email LIKE $1 OR
         u.sector LIKE $1
       )
   `;

  if (showArchived) {
    sql += ` AND u.status = 'archived'`;
  } else {
    sql += ` AND (u.status IS NULL OR u.status = '')`;
  }

  if (startDate && endDate) {
    sql += ` AND u.createdAt BETWEEN $${params.length + 1} AND $${
      params.length + 2
    }`;
    params.push(startDate, endDate);
  } else if (startDate) {
    sql += ` AND u.createdAt >= $${params.length + 1}`;
    params.push(startDate);
  } else if (endDate) {
    sql += ` AND u.createdAt <= $${params.length + 1}`;
    params.push(endDate);
  }

  sql += ` )
     SELECT *
     FROM UserResults
     WHERE RowNum BETWEEN $${params.length + 1} AND $${params.length + 2}
     ORDER BY RowNum
   `;

  // Add pagination bounds
  params.push(offset + 1, offset + ITEMS_PER_PAGE);

  const result = await safeQuery<User>(sql, params);
  return result.rows;
}

export async function addUser(
  prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const parsed = AddUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    sector: formData.get("sector"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { name, email, sector, role } = parsed.data;

  try {
    // 1. Check existing
    const existing = await safeQuery<{ id: number }>(
      `SELECT id FROM [User] WHERE email = $1`,
      [email],
    );
    if (existing.rows.length) {
      return {
        errors: { email: [`User with email ${email} already exists.`] },
      };
    }

    // 3. Token + expiry
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1000);

    // 5. Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    const mailResult = await sendMail(resetUrl, email, name);

    if (!mailResult.success) {
      console.error("Email error:", mailResult.message);
      return {
        state_error: mailResult.message,
      };
    }

    // 4. Insert new user (MSSQL syntax)
    const insertRes = await safeQuery<{ id: number }>(
      `INSERT INTO [User]
        (name, email, sector, role, password_reset_token, password_reset_expires)
       OUTPUT INSERTED.id
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, sector, role, token, expires],
    );
    const newUserId = insertRes.rows[0].id;

    revalidatePath("/dashboard");
    return { message: `User #${newUserId} added successfully!` };
  } catch (err) {
    console.error("Error creating user:", err);
    return { state_error: "There was an unexpected error. Please try again." };
  }
}

export async function updateUser(
  prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  // 1. Parse & validate
  const parsed = UpdateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    role: formData.get("role"),
    sector: formData.get("sector"),
  });

  if (!parsed.success) {
    console.error("Validation errors:", parsed.error.flatten().fieldErrors);
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { userId, name, role, sector } = parsed.data;

  try {
    // 4. Build dynamic SET clause
    const sets: string[] = [`name = $2`, `role = $3`, `sector = $4`];
    const params: (number | string | null | undefined)[] = [
      userId,
      name,
      role,
      sector,
    ];

    // 5. Execute update
    await safeQuery(
      `UPDATE [User] SET ${sets.join(", ")} WHERE id = $1`,
      params,
    );

    // 6. Revalidate listing
    revalidatePath("/dashboard");

    return { message: "User updated successfully!" };
  } catch (err) {
    console.error("Error updating user:", err);
    return { state_error: "Unexpected error. Please try again." };
  }
}

export async function verifyPassword(email: string, password: string) {
  try {
    let user;
    try {
      user = await getUser(email);
    } catch (err) {
      if (err instanceof DatabaseError) {
        // Surface this to the UI as errorMessage
        return "Please try again later.";
      }
      throw err;
    }

    // 2) If user not found, or password mismatch, fall through to credentials‑fail
    if (!user) {
      return false;
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return match;
    }
  } catch (error) {
    console.error("Password verification failed:", error);
    return false;
  }
}

// 2) Server action
export async function archiveUser(
  prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  // parse + validate
  const raw = Object.fromEntries(formData.entries());
  const parsed = ArchiveUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      state_error: "Invalid request.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { userId } = parsed.data;
  try {
    // soft-delete: set status to 'archived'
    await safeQuery(`UPDATE [User] SET status = 'archived' WHERE id = $1`, [
      userId,
    ]);

    // revalidate any pages showing users
    revalidatePath("/dashboard");
    return { message: "User archived." };
  } catch (err) {
    console.error("archiveUser error:", err);
    return { state_error: "Could not archive user." };
  }
}

export async function activateUser(
  prevState: UserActionState | undefined,
  formData: FormData,
): Promise<UserActionState> {
  // Parse and validate userId
  const raw = formData.get("userId");
  const userId = raw ? parseInt(raw.toString(), 10) : NaN;

  if (isNaN(userId)) {
    return {
      state_error: "Invalid user identifier.",
      errors: {},
      message: null,
    };
  }

  try {
    const { rows } = await safeQuery(
      `UPDATE [User] SET status = NULL WHERE id = $1`,
      [userId],
    );

    // NOTE: mssql doesn’t return rowCount in this wrapper, so infer success by affected rows
    if (rows.length === 0) {
      return {
        state_error: "User not found or already active.",
        errors: {},
        message: null,
      };
    }

    // Invalidate any cached pages that list users
    revalidatePath("/dashboard");

    return {
      message: "User activated successfully.",
      state_error: null,
      errors: {},
    };
  } catch (err: unknown) {
    console.error("activateUser error:", err);
    return {
      state_error: "Failed to activate user. Please try again later.",
      errors: {},
      message: null,
    };
  }
}
