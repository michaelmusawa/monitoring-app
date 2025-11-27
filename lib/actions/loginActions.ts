// app/lib/loginActions.ts
"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

type User = {
  email: string;
  password: string;
};

export async function getUser(email: string): Promise<User | undefined> {
  if (!email) return undefined;
  if (email === "admin@gmail.com") {
    const user = { email: "admin@gmail.com", password: "Admin@1234" };
    return user;
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
      if (err) {
        return "Our authentication service is temporarily unavailable. Please try again later.";
      }
      throw err;
    }

    if (!user) return "Invalid credentials.";

    if (!user.password) {
      return "Your account is not fully set up. Please check your email for the activation link or contact your supervisor.";
    }

    // const match = await bcrypt.compare(password, user.password);
    const match = password === user.password;
    if (!match) return "Invalid credentials.";

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!res.error) redirect("/dashboard");
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? "Invalid credentials."
        : "Something went wrong.";
    }
    throw error;
  }
}
