"use server";

import { auth } from "@/auth";
import { ProfileActionState, UpdateProfileSchema } from "../types/profileTypes";
import { DatabaseError, safeQuery } from "../db";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getUser } from "./usersActions";

export async function updateProfile(
  prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  // 1) Validate inputs
  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    image: formData.get("image") as File | null,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      state_error: "Please fix the errors below.",
    };
  }

  const { name, image, password } = parsed.data;

  // 2) Identify user
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return { state_error: "Not authenticated." };
  }

  // 3) Load existing image URL from the DB
  const { rows } = await safeQuery<{ image: string | null }>(
    `SELECT image FROM [Users_me] WHERE email = $1`,
    [email],
  );

  const oldImage = rows[0]?.image;

  // 4) Handle avatar upload, if any
  let imageUrl = oldImage;
  if (image && image.size > 0) {
    const uploadDir = path.join(process.cwd(), "public", "images", "uploads");

    // delete old file if it’s in our uploads folder
    if (oldImage && oldImage.startsWith("/images/uploads/")) {
      const oldFile = path.join(process.cwd(), "public", oldImage);
      try {
        await fs.unlink(oldFile);
      } catch {
        /* ignore missing file */
      }
    }

    await fs.mkdir(uploadDir, { recursive: true });

    // write the new file
    const buf = Buffer.from(await image.arrayBuffer());
    const fileName = `${Date.now()}-${image.name.replace(/\s+/g, "_")}`;
    const dest = path.join(uploadDir, fileName);
    await fs.writeFile(dest, buf);

    // public URL path
    imageUrl = `/images/uploads/${fileName}`;
  }

  // 5) Build SQL
  const setClauses: string[] = [];
  const params: (string | null)[] = [email]; // $1

  // name
  setClauses.push(`name = $${params.length + 1}`);
  params.push(name);

  // avatar
  if (imageUrl !== null) {
    setClauses.push(`image = $${params.length + 1}`);
    params.push(imageUrl);
  }

  // password
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    setClauses.push(`password = $${params.length + 1}`);
    params.push(hash);
  }

  // 6) Execute
  try {
    const sql = `
      UPDATE [Users_me]
         SET ${setClauses.join(", ")}
       WHERE email = $1
    `;
    await safeQuery(sql, params);

    // 7) Revalidate and respond
    revalidatePath("/profile");
    return { message: "Profile updated successfully!" };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { state_error: "Something went wrong. Please try again." };
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
