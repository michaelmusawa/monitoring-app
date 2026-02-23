import sql from "mssql";
import { NextRequest, NextResponse } from "next/server";
import { pool, poolConnect, safeQuery, DatabaseError } from "@/lib/db"; // adjust path

// -----------------------------------------------------------------------------
// Helper to run a transaction
// -----------------------------------------------------------------------------
async function runTransaction<T>(
  callback: (trx: sql.Transaction) => Promise<T>,
): Promise<T> {
  await poolConnect; // ensure pool is connected
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// -----------------------------------------------------------------------------
// GET /api/admin/checklists
// Returns all templates with categories and tasks.
// -----------------------------------------------------------------------------
export async function GET() {
  try {
    // Fetch templates with their categories and tasks in one go
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

    // Reconstruct nested structure
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

      // If there's a category (row.categoryId not null)
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

    const templates = Array.from(templatesMap.values());
    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/admin/checklists error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// POST /api/admin/checklists
// Replaces all templates with the incoming data.
// Supports both new format ({ templates: [...] }) and legacy format (array of categories).
// -----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- 1. Determine payload format ---
    let templatesData: any[] = [];

    if (body.templates && Array.isArray(body.templates)) {
      // New format: { templates: [...] }
      templatesData = body.templates;
    } else if (body.categories && Array.isArray(body.categories)) {
      // Legacy format: { categories: [...] } – wrap into a single default template
      templatesData = [
        {
          name: "Default Template",
          categories: body.categories,
        },
      ];
    } else if (Array.isArray(body)) {
      // Raw array of templates (e.g., from import)
      templatesData = body;
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Expected { templates: [...] } or { categories: [...] }",
        },
        { status: 400 },
      );
    }

    // --- 2. Validate and normalize each template ---
    const validatedTemplates = templatesData.map((tmpl: any) => {
      const name = tmpl.name?.trim() || "Unnamed Template";
      const categories = Array.isArray(tmpl.categories) ? tmpl.categories : [];

      return {
        name,
        categories: categories.map((cat: any) => ({
          name: cat.name?.trim() || "Unnamed Category",
          tasks: Array.isArray(cat.tasks)
            ? cat.tasks.map((task: any) => ({
                name: task.name?.trim() || "Unnamed Task",
              }))
            : [],
        })),
      };
    });

    // --- 3. Replace all templates inside a transaction ---
    await runTransaction(async (trx) => {
      // Delete all existing templates (cascades to categories and tasks)
      const deleteRequest = new sql.Request(trx);
      await deleteRequest.query("DELETE FROM Template");

      // Insert new templates one by one
      for (const tmpl of validatedTemplates) {
        // Insert template
        const insertTemplateRequest = new sql.Request(trx);
        insertTemplateRequest.input("name", sql.NVarChar, tmpl.name);
        const templateResult = await insertTemplateRequest.query(
          "INSERT INTO Template (name) OUTPUT INSERTED.id VALUES (@name)",
        );
        const templateId = templateResult.recordset[0].id;

        // Insert categories for this template
        for (const cat of tmpl.categories) {
          const insertCategoryRequest = new sql.Request(trx);
          insertCategoryRequest.input("name", sql.NVarChar, cat.name);
          insertCategoryRequest.input("templateId", sql.Int, templateId);
          const categoryResult = await insertCategoryRequest.query(
            "INSERT INTO Category (name, templateId) OUTPUT INSERTED.id VALUES (@name, @templateId)",
          );
          const categoryId = categoryResult.recordset[0].id;

          // Insert tasks for this category
          for (const task of cat.tasks) {
            const insertTaskRequest = new sql.Request(trx);
            insertTaskRequest.input("name", sql.NVarChar, task.name);
            insertTaskRequest.input("categoryId", sql.Int, categoryId);
            await insertTaskRequest.query(
              "INSERT INTO Task (name, categoryId) VALUES (@name, @categoryId)",
            );
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: "Templates updated" });
  } catch (error) {
    console.error("POST /api/admin/checklists error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Failed to save templates" },
      { status: 500 },
    );
  }
}
