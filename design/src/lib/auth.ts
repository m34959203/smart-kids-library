import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getOne } from "./db";
import { ensureBootstrapAdmin } from "./seed";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  name: string;
  age_group: string | null;
  avatar_url: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await ensureBootstrapAdmin();
          const user = await getOne<UserRow>(
            "SELECT * FROM users WHERE email = $1",
            [credentials.email]
          );

          if (!user) return null;
          if (user.password_hash !== hashPassword(credentials.password)) return null;

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role,
            ageGroup: user.age_group,
            image: user.avatar_url,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as Record<string, unknown>).role;
        token.ageGroup = (user as unknown as Record<string, unknown>).ageGroup;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.sub;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).ageGroup = token.ageGroup;
      }
      return session;
    },
  },
  pages: {
    signIn: "/ru/profile",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
