// app/lib/loginActions.ts
"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

type User = {
  email: string;
  password: string;
  role?: "Admin" | "Sector" | "M&E Officer" | "Management";
};

export async function getUser(email: string): Promise<User | undefined> {
  if (!email) return undefined;

  // Hardcoded users for demo / manual auth
  const users: User[] = [
    { email: "admin@gmail.com", password: "Admin@1234", role: "Admin" },
    { email: "sector@gmail.com", password: "Sector@1234", role: "Sector" },
    { email: "meofficer@gmail.com", password: "MEO@1234", role: "M&E Officer" },
    {
      email: "management@gmail.com",
      password: "Management@1234",
      role: "Management",
    },
  ];

  return users.find((u) => u.email === email);
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
