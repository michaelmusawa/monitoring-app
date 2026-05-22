"use server";

import { revalidatePath } from "next/cache";
import { safeQuery } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrganisationalUnit {
  id: string;
  name: string;
  level: string; // free text, e.g. "Sector", "Division", "Unit"
  parentId: string | null;
  code: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: OrganisationalUnit[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

function mapUnit(row: any): OrganisationalUnit {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    parentId: row.parentId ?? null,
    code: row.code ?? null,
    description: row.description ?? null,
    displayOrder: row.displayOrder ?? 0,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

// ─── CRUD operations ──────────────────────────────────────────────────────────

export async function fetchOrganisationalUnits(
  level?: string,
  parentId?: string | null,
  onlyActive = true,
): Promise<OrganisationalUnit[]> {
  let query = `SELECT * FROM OrganisationalUnit WHERE 1=1`;
  const params: any[] = [];
  let idx = 1;

  if (level) {
    query += ` AND level = @p${idx++}`;
    params.push(level);
  }
  if (parentId !== undefined) {
    if (parentId === null) query += ` AND parentId IS NULL`;
    else {
      query += ` AND parentId = @p${idx++}`;
      params.push(parentId);
    }
  }
  if (onlyActive) {
    query += ` AND isActive = 1`;
  }
  query += ` ORDER BY displayOrder ASC, name ASC`;

  const { rows } = await safeQuery<any>(query, params);
  return rows.map(mapUnit);
}

export async function fetchUnitTree(): Promise<OrganisationalUnit[]> {
  const all = await fetchOrganisationalUnits(undefined, undefined, false);
  const map = new Map<string, OrganisationalUnit>();
  const roots: OrganisationalUnit[] = [];

  // First pass: create map
  for (const u of all) map.set(u.id, { ...u, children: [] });

  // Second pass: build tree
  for (const u of map.values()) {
    if (u.parentId && map.has(u.parentId)) {
      map.get(u.parentId)!.children!.push(u);
    } else {
      roots.push(u);
    }
  }
  // sort children by displayOrder
  for (const u of map.values()) {
    if (u.children) u.children.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  roots.sort((a, b) => a.displayOrder - b.displayOrder);
  return roots;
}

export async function createOrganisationalUnit(data: {
  name: string;
  level: string;
  parentId?: string | null;
  code?: string;
  description?: string;
  displayOrder?: number;
}): Promise<OrganisationalUnit> {
  const id = generateSlug(data.name);
  const { rows } = await safeQuery<any>(
    `INSERT INTO OrganisationalUnit (id, name, level, parentId, code, description, displayOrder)
     OUTPUT INSERTED.*
     VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7)`,
    [
      id,
      data.name,
      data.level,
      data.parentId ?? null,
      data.code ?? null,
      data.description ?? null,
      data.displayOrder ?? 0,
    ],
  );
  revalidatePath("/admin/organisation");
  return mapUnit(rows[0]);
}

export async function updateOrganisationalUnit(
  id: string,
  data: Partial<Omit<OrganisationalUnit, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  const fields: [keyof typeof data, string][] = [
    ["name", "name"],
    ["level", "level"],
    ["parentId", "parentId"],
    ["code", "code"],
    ["description", "description"],
    ["displayOrder", "displayOrder"],
    ["isActive", "isActive"],
  ];
  for (const [key, col] of fields) {
    if (data[key] !== undefined) {
      updates.push(`${col} = @p${params.length + 1}`);
      params.push(data[key]);
    }
  }
  if (updates.length === 0) return;
  updates.push("updatedAt = GETDATE()");
  params.push(id);

  await safeQuery(
    `UPDATE OrganisationalUnit SET ${updates.join(", ")} WHERE id = @p${params.length}`,
    params,
  );
  revalidatePath("/admin/organisation");
}

export async function deleteOrganisationalUnit(id: string): Promise<void> {
  // Check if has children – prevent deletion if any (or cascade, but we choose to restrict)
  const { rows } = await safeQuery<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM OrganisationalUnit WHERE parentId = @p1`,
    [id],
  );
  if (rows[0].cnt > 0) {
    throw new Error(
      "Cannot delete unit that has child units. Reassign children first.",
    );
  }
  await safeQuery(`DELETE FROM OrganisationalUnit WHERE id = @p1`, [id]);
  revalidatePath("/admin/organisation");
}

// ─── User assignment ──────────────────────────────────────────────────────────

export async function getUserUnits(
  userId: string,
): Promise<OrganisationalUnit[]> {
  const { rows } = await safeQuery<any>(
    `SELECT ou.* FROM OrganisationalUnit ou
     INNER JOIN UserOrganisationalUnit uou ON uou.unitId = ou.id
     WHERE uou.userId = @p1 AND ou.isActive = 1
     ORDER BY ou.level, ou.name`,
    [userId],
  );
  return rows.map(mapUnit);
}

export async function assignUserToUnit(
  userId: string,
  unitId: string,
): Promise<void> {
  await safeQuery(
    `INSERT INTO UserOrganisationalUnit (userId, unitId) VALUES (@p1, @p2)`,
    [userId, unitId],
  );
  revalidatePath("/admin/users");
}

export async function removeUserFromUnit(
  userId: string,
  unitId: string,
): Promise<void> {
  await safeQuery(
    `DELETE FROM UserOrganisationalUnit WHERE userId = @p1 AND unitId = @p2`,
    [userId, unitId],
  );
  revalidatePath("/admin/users");
}

// ─── Options for dropdowns (e.g., parent selector) ───────────────────────────
export async function fetchUnitsForSelect(
  level?: UnitLevel,
): Promise<{ id: string; name: string; level: string }[]> {
  let query = `SELECT id, name, level FROM OrganisationalUnit WHERE isActive = 1`;
  const params: any[] = [];
  if (level) {
    query += ` AND level = @p1`;
    params.push(level);
  }
  query += ` ORDER BY displayOrder, name`;
  const { rows } = await safeQuery<any>(query, params);
  return rows.map((r) => ({ id: r.id, name: r.name, level: r.level }));
}
