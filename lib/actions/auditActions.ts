"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { safeQuery } from "@/lib/db";

/**
 * Log an action to the audit trail.
 * Call this after any mutation (create, update, delete, status change).
 */
export async function logAudit(data: {
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  actorEmail?: string | null; // 👈 added
}) {
  try {
    const session = await auth();
    // Use provided actorEmail, fallback to session email
    const userEmail = data.actorEmail ?? session?.user?.email ?? "unknown";
    const userId = session?.user?.id ?? "anonymous"; // still use session userId if available

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const ua = headersList.get("user-agent") || "unknown";

    await safeQuery(
      `INSERT INTO AuditLog (userId, userEmail, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent)
        VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)`,
      [
        userId,
        userEmail,
        data.action,
        data.entityType,
        data.entityId ?? null,
        data.oldValues ? JSON.stringify(data.oldValues) : null,
        data.newValues ? JSON.stringify(data.newValues) : null,
        ip,
        ua,
      ],
    );
  } catch (error) {
    console.error("Audit log failed:", error);
    // Never throw – audit logging should not disrupt the main operation
  }
}

/**
 * Fetch paginated audit logs (admin only).
 */
export async function fetchAuditLogs(filters?: {
  page?: number;
  entityType?: string;
  action?: string;
  userId?: string;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (filters?.entityType) {
    conditions.push(`entityType = @p${idx++}`);
    params.push(filters.entityType);
  }
  if (filters?.action) {
    conditions.push(`action = @p${idx++}`);
    params.push(filters.action);
  }
  if (filters?.userId) {
    conditions.push(`userId = @p${idx++}`);
    params.push(filters.userId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total
  const { rows: countRows } = await safeQuery<{ total: number }>(
    `SELECT COUNT(*) AS total FROM AuditLog ${where}`,
    params,
  );
  const total = countRows[0]?.total || 0;

  // Guard: if no records, return empty result
  if (total === 0) {
    return { logs: [], totalPages: 0 };
  }

  // Fetch page – ensure limit > 0
  const safeLimit = Math.max(1, limit);
  params.push(offset, safeLimit);

  const { rows } = await safeQuery<any>(
    `SELECT * FROM AuditLog ${where}
      ORDER BY createdAt DESC
      OFFSET @p${params.length - 1} ROWS FETCH NEXT @p${params.length} ROWS ONLY`,
    params,
  );

  return {
    logs: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      oldValues: r.oldValues ? JSON.parse(r.oldValues) : null,
      newValues: r.newValues ? JSON.parse(r.newValues) : null,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
    })),
    totalPages: Math.ceil(total / safeLimit),
  };
}

export async function logAuthEvent(data: {
  event: "login_success" | "login_failure" | "logout" | "session_expired";
  userEmail?: string;
  userId?: string;
  errorMessage?: string;
}) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const ua = headersList.get("user-agent") || "unknown";

    await safeQuery(
      `INSERT INTO AuditLog (userId, userEmail, action, entityType, oldValues, newValues, ipAddress, userAgent)
       VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8)`,
      [
        data.userId || "anonymous",
        data.userEmail || "unknown",
        data.event,
        "Auth",
        data.errorMessage ? JSON.stringify({ error: data.errorMessage }) : null,
        data.event === "login_success"
          ? JSON.stringify({ success: true })
          : null,
        ip,
        ua,
      ],
    );
  } catch (error) {
    console.error("Auth audit log failed:", error);
  }
}
