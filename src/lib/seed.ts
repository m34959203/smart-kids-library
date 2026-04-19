import crypto from "crypto";
import { getOne, query } from "./db";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

let seeded = false;

/**
 * Idempotent seed for the bootstrap admin account.
 * Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD from env and creates the user
 * only if the users table is empty. Safe to call on every app boot.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  if (seeded) return;

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    seeded = true;
    return;
  }
  if (password.length < 10) {
    console.warn("[seed] SEED_ADMIN_PASSWORD must be ≥ 10 chars; skipping admin seed");
    seeded = true;
    return;
  }

  try {
    const existing = await getOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
    if (existing && parseInt(existing.count, 10) > 0) {
      seeded = true;
      return;
    }
    await query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, 'admin', 'Administrator')
       ON CONFLICT (email) DO NOTHING`,
      [email, hashPassword(password)]
    );
    console.log(`[seed] Bootstrap admin created: ${email}`);
  } catch (e) {
    console.error("[seed] Failed to seed bootstrap admin:", e);
  } finally {
    seeded = true;
  }
}
