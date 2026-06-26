"use server";

import { revalidatePath } from "next/cache";
import { safeQuery } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LocationUnit {
  id: string;
  name: string;
  level: string;
  parentId: string | null;
  code: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  lat: number | null;
  long: number | null;
  createdAt: string;
  updatedAt: string;
  children?: LocationUnit[];
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

function mapUnit(row: any): LocationUnit {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    parentId: row.parentId ?? null,
    code: row.code ?? null,
    description: row.description ?? null,
    displayOrder: row.displayOrder ?? 0,
    isActive: row.isActive ?? true,
    lat: row.lat ?? null, // ✅ added
    long: row.long ?? null, // ✅ added
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

// ─── CRUD operations ──────────────────────────────────────────────────────────

export async function fetchLocationUnits(
  level?: string,
  parentId?: string | null,
  onlyActive = true,
): Promise<LocationUnit[]> {
  let query = `SELECT * FROM LocationUnit WHERE 1=1`;
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

export async function fetchLocationTree(): Promise<LocationUnit[]> {
  const all = await fetchLocationUnits(undefined, undefined, false);
  const map = new Map<string, LocationUnit>();
  const roots: LocationUnit[] = [];

  for (const u of all) map.set(u.id, { ...u, children: [] });
  for (const u of map.values()) {
    if (u.parentId && map.has(u.parentId)) {
      map.get(u.parentId)!.children!.push(u);
    } else {
      roots.push(u);
    }
  }
  for (const u of map.values()) {
    if (u.children) u.children.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  roots.sort((a, b) => a.displayOrder - b.displayOrder);
  return roots;
}

export async function createLocationUnit(data: {
  name: string;
  level: string;
  parentId?: string | null;
  code?: string;
  description?: string;
  displayOrder?: number;
  lat?: number | null; // new
  long?: number | null; // new
}): Promise<LocationUnit> {
  const id = generateSlug(data.name);
  const { rows } = await safeQuery<any>(
    `INSERT INTO LocationUnit (id, name, level, parentId, code, description, displayOrder, lat, long)
     OUTPUT INSERTED.*
     VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)`,
    [
      id,
      data.name,
      data.level,
      data.parentId ?? null,
      data.code ?? null,
      data.description ?? null,
      data.displayOrder ?? 0,
      data.lat ?? null,
      data.long ?? null,
    ],
  );
  revalidatePath("/admin/locations");
  return mapUnit(rows[0]);
}

export async function updateLocationUnit(
  id: string,
  data: Partial<Omit<LocationUnit, "id" | "createdAt" | "updatedAt">>,
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
    ["lat", "lat"], // new
    ["long", "long"], // new
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
    `UPDATE LocationUnit SET ${updates.join(", ")} WHERE id = @p${params.length}`,
    params,
  );
  revalidatePath("/admin/locations");
}

export async function deleteLocationUnit(id: string): Promise<void> {
  const { rows } = await safeQuery<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM LocationUnit WHERE parentId = @p1`,
    [id],
  );
  if (rows[0].cnt > 0) {
    throw new Error(
      "Cannot delete a location that has child locations. Reassign children first.",
    );
  }
  await safeQuery(`DELETE FROM LocationUnit WHERE id = @p1`, [id]);
  revalidatePath("/admin/locations");
}

// ─── For dropdown selectors ──────────────────────────────────────────────────
export async function fetchLocationUnitsForSelect(): Promise<
  { id: string; name: string; level: string }[]
> {
  const { rows } = await safeQuery<any>(
    `SELECT id, name, level FROM LocationUnit WHERE isActive = 1 ORDER BY displayOrder, name`,
  );
  return rows.map((r) => ({ id: r.id, name: r.name, level: r.level }));
}

export async function fetchLocationUnitById(
  id: string,
): Promise<LocationUnit | null> {
  const { rows } = await safeQuery<any>(
    `SELECT id, name, level, parentId, code, description, displayOrder, isActive, lat, long, createdAt, updatedAt
     FROM LocationUnit WHERE id = @p1`,
    [id],
  );
  return rows.length ? mapUnit(rows[0]) : null;
}

export async function fetchLocationTreeFlattened(): Promise<
  { value: string; label: string }[]
> {
  const tree = await fetchLocationTree();
  const result: { value: string; label: string }[] = [];

  function flatten(nodes: LocationUnit[], depth: number) {
    const prefix = "  ".repeat(depth);
    for (const node of nodes) {
      result.push({
        value: node.id,
        label: `${prefix}${node.name} (${node.level})`,
      });
      if (node.children) flatten(node.children, depth + 1);
    }
  }

  flatten(tree, 0);
  return result;
}
