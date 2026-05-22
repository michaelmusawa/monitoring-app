import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { getUser } from "./lib/actions/loginActions";
import bcrypt from "bcryptjs";
import { logAuthEvent } from "./lib/actions/auditActions";

interface User {
  id: string;
  email: string;
  password: string;
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      async authorize(credentials) {
        const rawEmail =
          typeof credentials?.email === "string"
            ? credentials.email
            : undefined;

        const parsedCredentials = z
          .object({
            email: z.email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          await logAuthEvent({
            event: "login_failure",
            userEmail: rawEmail,
            errorMessage: "Invalid credential format",
          });

          return null;
        }

        const { email, password } = parsedCredentials.data;

        const user = (await getUser(email)) as User;

        if (!user) {
          await logAuthEvent({
            event: "login_failure",
            userEmail: email,
            errorMessage: "User not found",
          });

          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) {
          await logAuthEvent({
            event: "login_failure",
            userEmail: email,
            userId: user.id,
            errorMessage: "Invalid password",
          });

          return null;
        }

        await logAuthEvent({
          event: "login_success",
          userEmail: user.email,
          userId: user.id,
        });

        return user;
      },
    }),
  ],
});
