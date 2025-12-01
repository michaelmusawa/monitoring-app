import type { NextApiRequest, NextApiResponse } from "next";
import {
  getChecklistForProject,
  getStandardParams,
  saveChecklist,
} from "@/lib/actions/actions";

/**
 * GET  /api/projects/[projectId]/checklist
 *   -> returns { checklist, standardParams }
 *
 * POST /api/projects/[projectId]/checklist
 *   -> accepts a checklist payload in the request body and forwards to saveChecklist
 *      (this is a lightweight proxy for the prototype save action)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { projectId } = req.query;

  if (!projectId || Array.isArray(projectId)) {
    return res.status(400).json({ error: "Invalid projectId" });
  }

  try {
    if (req.method === "GET") {
      const checklist = await getChecklistForProject(projectId);
      const standardParams = await getStandardParams();

      return res.status(200).json({ checklist, standardParams });
    }

    if (req.method === "POST") {
      // Expect the client to send a checklist payload in the body
      const payload = req.body;

      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid payload" });
      }

      const result = await saveChecklist(projectId, payload);
      return res.status(200).json({ ok: true, result });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error("API /projects/[projectId]/checklist error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err?.message || null });
  }
}
