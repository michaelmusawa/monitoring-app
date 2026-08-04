// lib/actions/templateActions.ts
"use server";

import { safeQuery } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAllTemplates() {
  try {
    const query = `
      SELECT
        t.id AS templateId,
        t.name AS templateName,
        c.id AS categoryId,
        c.name AS categoryName,
        tk.id AS taskId,
        tk.name AS taskName
      FROM Template t
      LEFT JOIN Category c ON c.templateId = t.id
      LEFT JOIN Task tk ON tk.categoryId = c.id
      ORDER BY t.id, c.id, tk.id
    `;

    const { rows } = await safeQuery<any>(query, []);
    const templatesMap = new Map<number, any>();

    for (const row of rows) {
      const templateId = row.templateId;
      if (!templatesMap.has(templateId)) {
        templatesMap.set(templateId, {
          id: String(templateId),
          name: row.templateName,
          categories: [],
        });
      }
      const template = templatesMap.get(templateId);

      if (row.categoryId) {
        let category = template.categories.find(
          (c: any) => c.id === String(row.categoryId),
        );
        if (!category) {
          category = {
            id: String(row.categoryId),
            name: row.categoryName,
            tasks: [],
          };
          template.categories.push(category);
        }
        if (row.taskId) {
          category.tasks.push({
            id: String(row.taskId),
            name: row.taskName,
          });
        }
      }
    }

    return Array.from(templatesMap.values());
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return [];
  }
}
