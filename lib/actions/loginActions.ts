// app/lib/loginActions.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { randomBytes } from "crypto";

import { DatabaseError, safeQuery } from "../db";
import {
  ForgotPasswordActionState,
  LoginUser,
  ResetPasswordActionState,
  TokenCheckResult,
} from "../types/loginTypes";
import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../schemas/loginSchema";
import { sendMail } from "../utils/nodeMailerUtils";

export async function getUser(email: string): Promise<LoginUser | undefined> {
  try {
    const sql = `
      SELECT TOP 1
        u.email,
        u.password,
        u.role,
        u.status
      FROM [User] u
      WHERE u.email = @p1`;

    const { rows } = await safeQuery<LoginUser>(sql, [email]);
    return rows[0];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

export async function authenticate(_state: unknown, formData: FormData) {
  try {
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    let user;
    try {
      user = await getUser(email);
    } catch (err) {
      if (err instanceof DatabaseError) {
        return (
          err.message ??
          "Our authentication service is temporarily unavailable. Please try again later."
        );
      }
      throw err;
    }

    if (!user) return "Invalid credentials.";

    if (!user.password) {
      return "Your account is not fully set up. Please check your email for the activation link or contact your supervisor.";
    }

    if (user.status === "archived") {
      return "Your account is disabled! Contact admin for activation.";
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!res.error) redirect("/dashboard");
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? "Invalid credentials. Please try again."
        : "Something went wrong.";
    }
    throw error;
  }
}

export async function forgetPassword(
  _prev: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { email } = parsed.data;

  try {
    // Look up user
    const sqlLookup = `SELECT TOP 1 id FROM [User] WHERE email = @p1`;
    const { rows } = await safeQuery<{ id: number }>(sqlLookup, [email]);

    if (rows.length === 0) {
      return {
        message: "If that email is registered, you’ll receive a reset link.",
      };
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1000);

    // Store reset token + expiry
    const sqlStore = `
      UPDATE [User]
      SET password_reset_token = @p1,
          password_reset_expires = @p2
      WHERE id = @p3`;
    await safeQuery(sqlStore, [token, expires, rows[0].id]);

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    await sendMail(resetUrl, email);

    return {
      message: "If that email is registered, you’ll receive a reset link.",
    };
  } catch (err) {
    console.error("Error in forgetPassword:", err);
    return { state_error: "Something went wrong. Please try again later." };
  }
}

export async function checkResetToken(
  token?: string,
): Promise<TokenCheckResult> {
  if (!token) {
    return { valid: false, reason: "no_token" };
  }

  const { rows } = await safeQuery<{
    password_reset_expires: Date | null;
  }>(
    `
    SELECT [password_reset_expires]
    FROM [User]
    WHERE [password_reset_token] = $1
    `,
    [token],
  );

  if (rows.length === 0) {
    return { valid: false, reason: "not_found" };
  }

  const expires = rows[0].password_reset_expires;
  if (!expires || new Date(expires).getTime() < Date.now()) {
    return { valid: false, reason: "expired", expiredAt: expires! };
  }

  return { valid: true, reason: "" };
}

export default async function resetPasswordHandler(
  prevState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  // 1. Parse + validate
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { token, password } = parsed.data;

  // 2. Lookup user by token
  const { rows } = await safeQuery<{
    id: number;
    password_reset_expires: Date;
  }>(
    `
    SELECT [id], [password_reset_expires]
    FROM [User]
    WHERE [password_reset_token] = $1
    `,
    [token],
  );

  const user = rows[0];
  if (!user || new Date(user.password_reset_expires) < new Date()) {
    return {
      state_error: "Invitation link is invalid or has expired.",
    };
  }

  // 3. Hash + save new password, clear token fields
  const hash = await bcrypt.hash(password, 12);

  await safeQuery(
    `
    UPDATE [User]
    SET [password] = $1,
        [password_reset_token] = NULL,
        [password_reset_expires] = NULL
    WHERE [id] = $2
    `,
    [hash, user.id],
  );

  // 4. Optionally revalidate or redirect
  // revalidatePath("/login");

  return {
    message: "Your password has been set! You can now log in.",
  };
}
