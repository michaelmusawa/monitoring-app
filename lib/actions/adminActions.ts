"use server";

import { revalidatePath } from "next/cache";
import { safeQuery } from "@/lib/db";
import { DatabaseError } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  sector: string | null;
  status: string;
  image: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalProjects: number;
  activeProjects: number;
  totalUsers: number;
  activeUsers: number;
  totalTemplates: number;
  totalCategories: number;
  pendingReviews: number;
  recentSignups: number; // last 7 days
}

// ─── getAdminStats ────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const [projRows, userRows, templateRows, reviewRows, signupRows] =
      await Promise.all([
        safeQuery<any>(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active
           FROM Project`,
          [],
        ),
        safeQuery<any>(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status != 'archived' THEN 1 ELSE 0 END) AS active
           FROM [User]`,
          [],
        ),
        safeQuery<any>(
          `SELECT
             COUNT(DISTINCT t.id) AS templates,
             COUNT(c.id)          AS categories
           FROM Template t
           LEFT JOIN Category c ON c.templateId = t.id`,
          [],
        ),
        safeQuery<any>(
          `SELECT
             SUM(CASE WHEN status = 'DraftReview'   THEN 1 ELSE 0 END) +
             SUM(CASE WHEN status = 'WeightsReview' THEN 1 ELSE 0 END) AS pending
           FROM Checklist`,
          [],
        ),
        safeQuery<any>(
          `SELECT COUNT(*) AS cnt FROM [User]
           WHERE createdAt >= DATEADD(day, -7, GETDATE())`,
          [],
        ),
      ]);

    const p = projRows.rows[0] ?? {};
    const u = userRows.rows[0] ?? {};
    const t = templateRows.rows[0] ?? {};
    const r = reviewRows.rows[0] ?? {};

    return {
      totalProjects: Number(p.total ?? 0),
      activeProjects: Number(p.active ?? 0),
      totalUsers: Number(u.total ?? 0),
      activeUsers: Number(u.active ?? 0),
      totalTemplates: Number(t.templates ?? 0),
      totalCategories: Number(t.categories ?? 0),
      pendingReviews: Number(r.pending ?? 0),
      recentSignups: Number(signupRows.rows[0]?.cnt ?? 0),
    };
  } catch (error) {
    console.error("getAdminStats error:", error);
    throw new DatabaseError();
  }
}

// ─── fetchFilteredUsers ───────────────────────────────────────────────────────

export async function fetchFilteredUsers({
  query = "",
  startDate = "",
  endDate = "",
  currentPage = 1,
  showArchived = false,
}: {
  query?: string;
  startDate?: string;
  endDate?: string;
  currentPage?: number;
  showArchived?: boolean;
}): Promise<AdminUser[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (query) {
      params.push(`%${query}%`);
      conditions.push(
        `(name LIKE @p${params.length} OR email LIKE @p${params.length})`,
      );
    }
    if (startDate) {
      params.push(new Date(startDate));
      conditions.push(`createdAt >= @p${params.length}`);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      params.push(end);
      conditions.push(`createdAt <= @p${params.length}`);
    }
    if (!showArchived) {
      conditions.push(`(status IS NULL OR status != 'archived')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(offset, ITEMS_PER_PAGE);

    const { rows } = await safeQuery<any>(
      `SELECT id, name, email, role, sector, status, image, createdAt
       FROM [User]
       ${where}
       ORDER BY createdAt DESC
       OFFSET @p${params.length - 1} ROWS FETCH NEXT @p${params.length} ROWS ONLY`,
      params,
    );

    return rows.map(mapUser);
  } catch (error) {
    console.error("fetchFilteredUsers error:", error);
    return [];
  }
}

// ─── fetchUsersPages ──────────────────────────────────────────────────────────

export async function fetchUsersPages(
  query = "",
  startDate = "",
  endDate = "",
  showArchived = false,
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (query) {
      params.push(`%${query}%`);
      conditions.push(
        `(name LIKE @p${params.length} OR email LIKE @p${params.length})`,
      );
    }
    if (startDate) {
      params.push(new Date(startDate));
      conditions.push(`createdAt >= @p${params.length}`);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      params.push(end);
      conditions.push(`createdAt <= @p${params.length}`);
    }
    if (!showArchived) {
      conditions.push(`(status IS NULL OR status != 'archived')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await safeQuery<{ count: number }>(
      `SELECT COUNT(*) AS count FROM [User] ${where}`,
      params,
    );
    return Math.ceil((rows[0]?.count || 0) / ITEMS_PER_PAGE);
  } catch {
    return 0;
  }
}

// ─── createUser ───────────────────────────────────────────────────────────────

export async function createUser(data: {
  name: string;
  email: string;
  role: string;
  sector?: string;
}): Promise<AdminUser> {
  try {
    const { rows } = await safeQuery<any>(
      `INSERT INTO [User] (name, email, role, sector, status, createdAt)
       OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role,
              INSERTED.sector, INSERTED.status, INSERTED.image, INSERTED.createdAt
       VALUES (@p1, @p2, @p3, @p4, 'active', GETDATE())`,
      [data.name, data.email, data.role, data.sector ?? null],
    );
    revalidatePath("/admin");
    return mapUser(rows[0]);
  } catch (error) {
    console.error("createUser error:", error);
    throw new DatabaseError();
  }
}

// ─── updateUser ───────────────────────────────────────────────────────────────

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; role?: string; sector?: string },
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    params.push(data.name);
    updates.push(`name   = @p${params.length}`);
  }
  if (data.email !== undefined) {
    params.push(data.email);
    updates.push(`email  = @p${params.length}`);
  }
  if (data.role !== undefined) {
    params.push(data.role);
    updates.push(`role   = @p${params.length}`);
  }
  if (data.sector !== undefined) {
    params.push(data.sector);
    updates.push(`sector = @p${params.length}`);
  }

  if (updates.length === 0) return;
  params.push(id);

  await safeQuery(
    `UPDATE [User] SET ${updates.join(", ")} WHERE id = @p${params.length}`,
    params,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

// ─── archiveUser ──────────────────────────────────────────────────────────────

export async function archiveUser(id: string): Promise<void> {
  await safeQuery(`UPDATE [User] SET status = 'archived' WHERE id = @p1`, [id]);
  revalidatePath("/admin/users");
}

// ─── activateUser ─────────────────────────────────────────────────────────────

export async function activateUser(id: string): Promise<void> {
  await safeQuery(`UPDATE [User] SET status = 'active' WHERE id = @p1`, [id]);
  revalidatePath("/admin/users");
}

// ─── deleteUser ───────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<void> {
  await safeQuery(`DELETE FROM [User] WHERE id = @p1`, [id]);
  revalidatePath("/admin/users");
}

// ─── getRecentActivity ────────────────────────────────────────────────────────

export interface AdminActivity {
  id: string;
  type:
    | "user_created"
    | "project_created"
    | "checklist_approved"
    | "tracker_submitted";
  label: string;
  detail: string;
  date: string;
}

export async function getRecentActivity(): Promise<AdminActivity[]> {
  try {
    const { rows } = await safeQuery<any>(
      `SELECT TOP 15 * FROM (
        SELECT
          CAST(id AS NVARCHAR) AS id,
          'user_created' AS type,
          name AS label,
          CONCAT('New user registered · ', ISNULL(role,'—')) AS detail,
          createdAt AS eventDate
        FROM [User] WHERE createdAt IS NOT NULL
        UNION ALL
        SELECT
          CAST(id AS NVARCHAR),
          'project_created',
          name,
          CONCAT('Project created · ', ISNULL(sector,'—')),
          createdAt
        FROM Project WHERE createdAt IS NOT NULL
        UNION ALL
        SELECT
          CAST(ts.id AS NVARCHAR),
          'tracker_submitted',
          p.name,
          CONCAT('Tracker submitted · ', CAST(CAST(ts.overallPercent AS INT) AS NVARCHAR), '% overall'),
          ts.submittedAt
        FROM TrackerSubmission ts
        INNER JOIN Project p ON p.id = ts.projectId
      ) feed
      ORDER BY eventDate DESC`,
      [],
    );

    return rows.map((r: any) => ({
      id: r.id?.toString(),
      type: r.type,
      label: r.label,
      detail: r.detail,
      date: r.eventDate?.toISOString?.() ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapUser(row: any): AdminUser {
  return {
    id: row.id?.toString(),
    name: row.name ?? null,
    email: row.email,
    role: row.role ?? null,
    sector: row.sector ?? null,
    status: row.status ?? "active",
    image: row.image ?? null,
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}
