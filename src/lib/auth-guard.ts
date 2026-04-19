import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export type AppRole = "admin" | "librarian" | "reader";

interface SessionUser {
  id?: string;
  email?: string | null;
  role?: AppRole;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireRole(roles: AppRole[]): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getCurrentUser();
  if (!user || !user.role || !roles.includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { user };
}

export const requireAdmin = () => requireRole(["admin"]);
export const requireStaff = () => requireRole(["admin", "librarian"]);
