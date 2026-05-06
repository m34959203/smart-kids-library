/**
 * Журнал критических админ-действий → таблица audit_log.
 * Вызывать в /api/admin/* после успешного PATCH/PUT/POST/DELETE.
 * Никогда не бросает — провал записи не должен валить основной запрос.
 */
import { query } from "./db";

export interface AuditActor {
  id?: number | string | null;
  email?: string | null;
  role?: string | null;
}

export interface AuditEntry {
  action: string;
  target_type?: string;
  target_id?: string | number;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(
  request: Request,
  actor: AuditActor | null,
  entry: AuditEntry,
): Promise<void> {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;
    const actorId = actor?.id != null ? Number(actor.id) : null;
    await query(
      `INSERT INTO audit_log
       (actor_id, actor_email, actor_role, action, target_type, target_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        Number.isFinite(actorId) ? actorId : null,
        actor?.email ?? null,
        actor?.role ?? null,
        entry.action,
        entry.target_type ?? null,
        entry.target_id != null ? String(entry.target_id) : null,
        ip,
        userAgent,
        JSON.stringify(entry.metadata ?? {}),
      ],
    );
  } catch (err) {
    console.warn("[audit] write failed:", err);
  }
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  if (name.length <= 2) return `${name[0] ?? ""}*@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}
