"use server";

import { revalidatePath } from "next/cache";
import { safeQuery } from "@/lib/db";
import { DatabaseError } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  sector: string | null;
  status: string;
  image: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalProjects: number;
  activeProjects: number;
  totalUsers: number;
  activeUsers: number;
  totalTemplates: number;
  totalCategories: number;
  pendingReviews: number;
  recentSignups: number; // last 7 days
}

// ─── getAdminStats ────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const [projRows, userRows, templateRows, reviewRows, signupRows] =
      await Promise.all([
        safeQuery<any>(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active
           FROM Project`,
          [],
        ),
        safeQuery<any>(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status != 'archived' THEN 1 ELSE 0 END) AS active
           FROM [User]`,
          [],
        ),
        safeQuery<any>(
          `SELECT
             COUNT(DISTINCT t.id) AS templates,
             COUNT(c.id)          AS categories
           FROM Template t
           LEFT JOIN Category c ON c.templateId = t.id`,
          [],
        ),
        safeQuery<any>(
          `SELECT
             SUM(CASE WHEN status = 'DraftReview'   THEN 1 ELSE 0 END) +
             SUM(CASE WHEN status = 'WeightsReview' THEN 1 ELSE 0 END) AS pending
           FROM Checklist`,
          [],
        ),
        safeQuery<any>(
          `SELECT COUNT(*) AS cnt FROM [User]
           WHERE createdAt >= DATEADD(day, -7, GETDATE())`,
          [],
        ),
      ]);

    const p = projRows.rows[0] ?? {};
    const u = userRows.rows[0] ?? {};
    const t = templateRows.rows[0] ?? {};
    const r = reviewRows.rows[0] ?? {};

    return {
      totalProjects: Number(p.total ?? 0),
      activeProjects: Number(p.active ?? 0),
      totalUsers: Number(u.total ?? 0),
      activeUsers: Number(u.active ?? 0),
      totalTemplates: Number(t.templates ?? 0),
      totalCategories: Number(t.categories ?? 0),
      pendingReviews: Number(r.pending ?? 0),
      recentSignups: Number(signupRows.rows[0]?.cnt ?? 0),
    };
  } catch (error) {
    console.error("getAdminStats error:", error);
    throw new DatabaseError();
  }
}

// ─── fetchFilteredUsers ───────────────────────────────────────────────────────

export async function fetchFilteredUsers({
  query = "",
  startDate = "",
  endDate = "",
  currentPage = 1,
  showArchived = false,
}: {
  query?: string;
  startDate?: string;
  endDate?: string;
  currentPage?: number;
  showArchived?: boolean;
}): Promise<AdminUser[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (query) {
      params.push(`%${query}%`);
      conditions.push(
        `(name LIKE @p${params.length} OR email LIKE @p${params.length})`,
      );
    }
    if (startDate) {
      params.push(new Date(startDate));
      conditions.push(`createdAt >= @p${params.length}`);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      params.push(end);
      conditions.push(`createdAt <= @p${params.length}`);
    }
    if (!showArchived) {
      conditions.push(`(status IS NULL OR status != 'archived')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(offset, ITEMS_PER_PAGE);

    const { rows } = await safeQuery<any>(
      `SELECT id, name, email, role, status, image, createdAt
       FROM [User]
       ${where}
       ORDER BY createdAt DESC
       OFFSET @p${params.length - 1} ROWS FETCH NEXT @p${params.length} ROWS ONLY`,
      params,
    );

    return rows.map(mapUser);
  } catch (error) {
    console.error("fetchFilteredUsers error:", error);
    return [];
  }
}

// ─── fetchUsersPages ──────────────────────────────────────────────────────────

export async function fetchUsersPages(
  query = "",
  startDate = "",
  endDate = "",
  showArchived = false,
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (query) {
      params.push(`%${query}%`);
      conditions.push(
        `(name LIKE @p${params.length} OR email LIKE @p${params.length})`,
      );
    }
    if (startDate) {
      params.push(new Date(startDate));
      conditions.push(`createdAt >= @p${params.length}`);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      params.push(end);
      conditions.push(`createdAt <= @p${params.length}`);
    }
    if (!showArchived) {
      conditions.push(`(status IS NULL OR status != 'archived')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await safeQuery<{ count: number }>(
      `SELECT COUNT(*) AS count FROM [User] ${where}`,
      params,
    );
    return Math.ceil((rows[0]?.count || 0) / ITEMS_PER_PAGE);
  } catch {
    return 0;
  }
}

// ─── createUser ───────────────────────────────────────────────────────────────
// Now accepts roleIds instead of a single role string.
export async function createUser(data: {
  name: string;
  email: string;
  roleIds: number[]; // new: array of role IDs
  sector?: string;
}): Promise<AdminUser> {
  const role = "user";
  try {
    // Insert user without setting the deprecated 'role' column (set to NULL)
    const { rows } = await safeQuery<any>(
      `INSERT INTO [User] (name, email, role, sector, status, createdAt)
       OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role,
              INSERTED.sector, INSERTED.status, INSERTED.image, INSERTED.createdAt
       VALUES (@p1, @p2, NULL, @p3, 'active', GETDATE())`,
      [data.name, data.email, role, data.sector ?? null],
    );
    const newUser = mapUser(rows[0]);

    console.log("user role");

    // Assign roles to the new user
    if (data.roleIds.length > 0) {
      await assignRolesToUser(newUser.id, data.roleIds);
    }

    revalidatePath("/admin");
    return newUser;
  } catch (error) {
    console.error("createUser error:", error);
    throw new DatabaseError();
  }
}

// ─── updateUser ───────────────────────────────────────────────────────────────
// Now can accept roleIds (optional) and updates UserRoles accordingly.
export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    sector?: string;
    roleIds?: number[]; // optional: if provided, replaces existing role assignments
  },
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    params.push(data.name);
    updates.push(`name   = @p${params.length}`);
  }
  if (data.email !== undefined) {
    params.push(data.email);
    updates.push(`email  = @p${params.length}`);
  }
  if (data.sector !== undefined) {
    params.push(data.sector);
    updates.push(`sector = @p${params.length}`);
  }

  if (updates.length > 0) {
    params.push(id);
    await safeQuery(
      `UPDATE [User] SET ${updates.join(", ")} WHERE id = @p${params.length}`,
      params,
    );
  }

  // Update roles if provided
  if (data.roleIds !== undefined) {
    await assignRolesToUser(id, data.roleIds);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

// ─── archiveUser ──────────────────────────────────────────────────────────────

export async function archiveUser(id: string): Promise<void> {
  await safeQuery(`UPDATE [User] SET status = 'archived' WHERE id = @p1`, [id]);
  revalidatePath("/admin/users");
}

// ─── activateUser ─────────────────────────────────────────────────────────────

export async function activateUser(id: string): Promise<void> {
  await safeQuery(`UPDATE [User] SET status = 'active' WHERE id = @p1`, [id]);
  revalidatePath("/admin/users");
}

// ─── deleteUser ───────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<void> {
  await safeQuery(`DELETE FROM [User] WHERE id = @p1`, [id]);
  revalidatePath("/admin/users");
}

// ─── getRecentActivity ────────────────────────────────────────────────────────

export interface AdminActivity {
  id: string;
  type:
    | "user_created"
    | "project_created"
    | "checklist_approved"
    | "tracker_submitted";
  label: string;
  detail: string;
  date: string;
}

export async function getRecentActivity(): Promise<AdminActivity[]> {
  try {
    const { rows } = await safeQuery<any>(
      `SELECT TOP 15 * FROM (
        SELECT
          CAST(id AS NVARCHAR) AS id,
          'user_created' AS type,
          name AS label,
          CONCAT('New user registered · ', ISNULL(role,'—')) AS detail,
          createdAt AS eventDate
        FROM [User] WHERE createdAt IS NOT NULL
        UNION ALL
        SELECT
          CAST(p.id AS NVARCHAR),
          'project_created',
          p.name,
          CONCAT('Project created · ', ISNULL(ou.name, '—')) AS detail,
          p.createdAt
        FROM Project p
        LEFT JOIN OrganisationalUnit ou ON p.orgUnitId = ou.id
        WHERE p.createdAt IS NOT NULL
        UNION ALL
        SELECT
          CAST(ts.id AS NVARCHAR),
          'tracker_submitted',
          p.name,
          CONCAT('Tracker submitted · ', CAST(CAST(ts.overallPercent AS INT) AS NVARCHAR), '% overall'),
          ts.submittedAt
        FROM TrackerSubmission ts
        INNER JOIN Project p ON p.id = ts.projectId
      ) feed
      ORDER BY eventDate DESC`,
      [],
    );

    return rows.map((r: any) => ({
      id: r.id?.toString(),
      type: r.type,
      label: r.label,
      detail: r.detail,
      date: r.eventDate?.toISOString?.() ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapUser(row: any): AdminUser {
  return {
    id: row.id?.toString(),
    name: row.name ?? null,
    email: row.email,
    role: row.role ?? null,
    sector: row.sector ?? null,
    status: row.status ?? "active",
    image: row.image ?? null,
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

// … existing code …

// ─── Fetch monthly tracker activity (for public dashboard) ─────────────
export async function fetchMonthlyTrackerActivity(filters?: {
  sector?: string;
  subCounty?: string;
  ward?: string;
  fiscalYear?: string;
}): Promise<{ month: string; submissions: number }[]> {
  let query = `
    SELECT FORMAT(ts.submittedAt, 'MMM yy') AS month, COUNT(*) AS submissions
    FROM TrackerSubmission ts
    INNER JOIN Project p ON p.id = ts.projectId
    WHERE 1=1
  `;
  const params: any[] = [];
  let idx = 1;

  if (filters?.sector && filters.sector !== "ALL") {
    query += ` AND p.sector = @p${idx++}`;
    params.push(filters.sector);
  }
  if (filters?.subCounty) {
    query += ` AND p.subCounty = @p${idx++}`;
    params.push(filters.subCounty);
  }
  if (filters?.ward) {
    query += ` AND p.ward = @p${idx++}`;
    params.push(filters.ward);
  }
  if (filters?.fiscalYear) {
    query += ` AND p.fiscalYear = @p${idx++}`;
    params.push(filters.fiscalYear);
  }

  query += ` AND ts.submittedAt >= DATEADD(month, -12, GETDATE())
    GROUP BY FORMAT(ts.submittedAt, 'MMM yy'), YEAR(ts.submittedAt), MONTH(ts.submittedAt)
    ORDER BY YEAR(ts.submittedAt) ASC, MONTH(ts.submittedAt) ASC`;

  const { rows } = await safeQuery<any>(query, params);
  return rows.map((r: any) => ({
    month: r.month,
    submissions: Number(r.submissions),
  }));
}

// ========== ROLE MANAGEMENT ==========

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissionIds?: number[];
}

export async function fetchAllRoles(): Promise<Role[]> {
  const { rows } = await safeQuery<Role>(
    `SELECT id, name, description FROM Role ORDER BY name`,
  );
  return rows;
}

export async function fetchRoleWithPermissions(
  roleId: number,
): Promise<Role & { permissionIds: number[] }> {
  const roleRes = await safeQuery<any>(
    `SELECT id, name, description FROM Role WHERE id = @p1`,
    [roleId],
  );
  if (roleRes.rows.length === 0) throw new Error("Role not found");
  const role = roleRes.rows[0];
  const permRes = await safeQuery<{ permissionId: number }>(
    `SELECT permissionId FROM RolePermission WHERE roleId = @p1`,
    [roleId],
  );
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissionIds: permRes.rows.map((r) => r.permissionId),
  };
}

export async function createRole(data: {
  name: string;
  description?: string;
}): Promise<Role> {
  const { rows } = await safeQuery<any>(
    `INSERT INTO Role (name, description) OUTPUT INSERTED.id, INSERTED.name, INSERTED.description VALUES (@p1, @p2)`,
    [data.name, data.description ?? null],
  );
  revalidatePath("/admin/roles");
  return {
    id: rows[0].id,
    name: rows[0].name,
    description: rows[0].description,
  };
}

export async function updateRole(
  roleId: number,
  data: { name: string; description?: string },
): Promise<void> {
  await safeQuery(
    `UPDATE Role SET name = @p1, description = @p2 WHERE id = @p3`,
    [data.name, data.description ?? null, roleId],
  );
  revalidatePath("/admin/roles");
}

export async function deleteRole(roleId: number): Promise<void> {
  await safeQuery(`DELETE FROM Role WHERE id = @p1`, [roleId]);
  revalidatePath("/admin/roles");
}

export async function assignPermissionsToRole(
  roleId: number,
  permissionIds: number[],
): Promise<void> {
  // Begin transaction (simplified – use proper transaction in production)
  await safeQuery(`DELETE FROM RolePermission WHERE roleId = @p1`, [roleId]);
  for (const pid of permissionIds) {
    await safeQuery(
      `INSERT INTO RolePermission (roleId, permissionId) VALUES (@p1, @p2)`,
      [roleId, pid],
    );
  }
  revalidatePath("/admin/roles");
}

// ========== PERMISSION MANAGEMENT ==========

export interface Permission {
  id: number;
  code: string;
  description: string | null;
}

export async function fetchAllPermissions(): Promise<Permission[]> {
  const { rows } = await safeQuery<Permission>(
    `SELECT id, code, description FROM Permission ORDER BY code`,
  );
  return rows;
}

export async function createPermission(data: {
  code: string;
  description?: string;
}): Promise<Permission> {
  const { rows } = await safeQuery<any>(
    `INSERT INTO Permission (code, description) OUTPUT INSERTED.id, INSERTED.code, INSERTED.description VALUES (@p1, @p2)`,
    [data.code, data.description ?? null],
  );
  revalidatePath("/admin/permissions");
  return {
    id: rows[0].id,
    code: rows[0].code,
    description: rows[0].description,
  };
}

export async function updatePermission(
  permId: number,
  data: { code: string; description?: string },
): Promise<void> {
  await safeQuery(
    `UPDATE Permission SET code = @p1, description = @p2 WHERE id = @p3`,
    [data.code, data.description ?? null, permId],
  );
  revalidatePath("/admin/permissions");
}

export async function deletePermission(permId: number): Promise<void> {
  await safeQuery(`DELETE FROM Permission WHERE id = @p1`, [permId]);
  revalidatePath("/admin/permissions");
}

// ========== USER ROLE ASSIGNMENT ==========

export async function getUserRoles(userId: string): Promise<Role[]> {
  const { rows } = await safeQuery<any>(
    `SELECT r.id, r.name, r.description
     FROM UserRoles ur
     JOIN Role r ON r.id = ur.roleId
     WHERE ur.userId = @p1 AND (ur.expiresAt IS NULL OR ur.expiresAt > GETUTCDATE())`,
    [userId],
  );
  return rows;
}

export async function assignRolesToUser(
  userId: string,
  roleIds: number[],
): Promise<void> {
  // Remove existing assignments (simple replace strategy)
  await safeQuery(`DELETE FROM UserRoles WHERE userId = @p1`, [userId]);
  for (const rid of roleIds) {
    await safeQuery(
      `INSERT INTO UserRoles (userId, roleId, assignedAt) VALUES (@p1, @p2, GETUTCDATE())`,
      [userId, rid],
    );
  }
  revalidatePath("/admin/users");
}

// Helper: get aggregated permissions for a user (for middleware)
export async function getUserPermissions(userId: string): Promise<string[]> {
  const { rows } = await safeQuery<{ code: string }>(
    `SELECT DISTINCT p.code
     FROM UserRoles ur
     JOIN RolePermission rp ON rp.roleId = ur.roleId
     JOIN Permission p ON p.id = rp.permissionId
     WHERE ur.userId = @p1 AND (ur.expiresAt IS NULL OR ur.expiresAt > GETUTCDATE())`,
    [userId],
  );
  return rows.map((r) => r.code);
}

export async function fetchAllRolesForSelect(): Promise<Role[]> {
  const { rows } = await safeQuery<Role>(
    `SELECT id, name FROM Role ORDER BY name`,
  );
  return rows;
}
