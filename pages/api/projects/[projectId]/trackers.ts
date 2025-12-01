import type { NextApiRequest, NextApiResponse } from "next";
import {
  getTrackers,
  saveTracker,
} from "@/lib/actions/actions";
import type { Tracker } from "@/lib/types/types";

/**
 * API: /api/projects/[projectId]/trackers
 *
 * Methods:
 *  - GET  -> returns { trackers: Tracker[] }
 *  - POST -> accepts a tracker payload in the request body and forwards to saveTracker
 *
 * Notes:
 *  - This is a small prototype endpoint that proxies to the in-memory action helpers.
 *  - The POST handler performs light validation only; production code should validate thoroughly.
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
      const trackers: Tracker[] = await getTrackers(String(projectId));
      return res.status(200).json({ trackers });
    }

    if (req.method === "POST") {
      // Expect JSON body like: { title?, submittedBy?, submittedAt?, overallPercent?, items: [...] }
      const payload = req.body;

      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid payload" });
      }

      // Basic validation: ensure items is an array
      if (!Array.isArray(payload.items)) {
        return res.status(400).json({ error: "Payload must include an 'items' array" });
      }

      // Attach projectId to payload if missing
      const toSave = {
        ...payload,
        projectId: String(projectId),
      };

      const result = await saveTracker(String(projectId), toSave);
      return res.status(200).json({ ok: true, result });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error("API /projects/[projectId]/trackers error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err?.message ?? null });
  }
}
