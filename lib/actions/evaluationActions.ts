"use server";

import sql from "mssql";
import { DatabaseError, safeQuery } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { withTransaction } from "./checklistActions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionType =
  | "likert5"
  | "likert5b"
  | "yesno"
  | "multiple"
  | "text"
  | "rating5"
  | "scale10";

export type EvalCategory =
  | "Relevance"
  | "Coherence"
  | "Effectiveness"
  | "Efficiency"
  | "Impact"
  | "Sustainability"
  | "Background";

export interface QuestionOption {
  id: string;
  label: string;
  value: number;
}

export interface EvalQuestion {
  id: string;
  category: EvalCategory;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
  followUp?: string;
  aiGenerated?: boolean;
  order: number;
}

export interface EvalDistributionChannel {
  id: string;
  type: "link" | "qr" | "email" | "sms" | "whatsapp" | "embed";
  label: string;
  value: string;
  active: boolean;
  responses: number;
}

export interface QuestionResponse {
  questionId: string;
  value: number | string | string[];
  textValue?: string;
}

export interface EvalSubmission {
  id: string;
  respondentGroup: string;
  submittedAt: string;
  responses: QuestionResponse[];
  channel: string;
}

export interface EvalConfig {
  id: string;
  projectId: string;
  projectName: string;
  projectSector: string;
  title: string;
  description: string;
  status: "draft" | "active" | "closed";
  questions: EvalQuestion[];
  respondentGroups: any[];
  channels: EvalDistributionChannel[];
  submissions: EvalSubmission[];
  createdAt: string;
  closesAt?: string;
}

// ─── Get evaluation for a project ────────────────────────────────────────────

export async function getEvaluation(
  projectId: string,
): Promise<EvalConfig | null> {
  try {
    const { rows: headerRows } = await safeQuery<any>(
      `SELECT id, projectId, projectName, projectSector, title, description,
              status, questions, channels, respondentGroups, createdAt, closesAt
       FROM Evaluation
       WHERE projectId = @p1`,
      [projectId],
    );

    console.log("headerRows", headerRows);

    if (headerRows.length === 0) return null;
    const h = headerRows[0];

    // Fetch submissions
    const { rows: subRows } = await safeQuery<any>(
      `SELECT es.id, es.respondentGroup, es.submittedAt, es.channel,
              er.questionId, er.numericValue, er.textValue
       FROM EvalSubmission es
       LEFT JOIN EvalResponse er ON er.submissionId = es.id
       WHERE es.evaluationId = @p1
       ORDER BY es.submittedAt DESC, er.id`,
      [h.id],
    );

    // Group responses into submissions
    const submissionMap = new Map<string, EvalSubmission>();
    for (const row of subRows) {
      if (!submissionMap.has(row.id)) {
        submissionMap.set(row.id, {
          id: row.id.toString(),
          respondentGroup: row.respondentGroup,
          submittedAt: row.submittedAt?.toISOString(),
          channel: row.channel,
          responses: [],
        });
      }
      if (row.questionId) {
        submissionMap.get(row.id)!.responses.push({
          questionId: row.questionId,
          value: row.numericValue ?? row.textValue ?? "",
          textValue: row.textValue,
        });
      }
    }

    // Count channel responses
    const channels: EvalDistributionChannel[] = JSON.parse(h.channels ?? "[]");
    const chanCounts: Record<string, number> = {};
    submissionMap.forEach((s) => {
      chanCounts[s.channel] = (chanCounts[s.channel] ?? 0) + 1;
    });
    channels.forEach((ch) => {
      ch.responses = chanCounts[ch.id] ?? 0;
    });

    return {
      id: h.id.toString(),
      projectId: h.projectId,
      projectName: h.projectName,
      projectSector: h.projectSector,
      title: h.title,
      description: h.description,
      status: h.status,
      questions: JSON.parse(h.questions ?? "[]"),
      respondentGroups: JSON.parse(h.respondentGroups ?? "[]"),
      channels,
      submissions: Array.from(submissionMap.values()),
      createdAt: h.createdAt?.toISOString(),
      closesAt: h.closesAt?.toISOString(),
    };
  } catch (error) {
    console.error("getEvaluation error:", error);
    throw new DatabaseError();
  }
}

// ─── Create / upsert evaluation ───────────────────────────────────────────────

export async function saveEvaluation(data: EvalConfig): Promise<EvalConfig> {
  try {
    const questionsJson = JSON.stringify(data.questions);
    const channelsJson = JSON.stringify(data.channels);
    const groupsJson = JSON.stringify(data.respondentGroups);

    const existing = await safeQuery<any>(
      "SELECT id FROM Evaluation WHERE projectId = @p1",
      [data.projectId],
    );

    if (existing.rows.length > 0) {
      // Update
      await safeQuery(
        `UPDATE Evaluation
         SET title = @p2, description = @p3, status = @p4,
             questions = @p5, channels = @p6, respondentGroups = @p7,
             updatedAt = GETDATE()
         WHERE projectId = @p1`,
        [
          data.projectId,
          data.title,
          data.description,
          data.status,
          questionsJson,
          channelsJson,
          groupsJson,
        ],
      );
      data.id = existing.rows[0].id.toString();
    } else {
      // Insert
      const { rows } = await safeQuery<any>(
        `INSERT INTO Evaluation
           (projectId, projectName, projectSector, title, description, status,
            questions, channels, respondentGroups, createdAt, updatedAt)
         OUTPUT INSERTED.id
         VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,GETDATE(),GETDATE())`,
        [
          data.projectId,
          data.projectName,
          data.projectSector,
          data.title,
          data.description,
          data.status,
          questionsJson,
          channelsJson,
          groupsJson,
        ],
      );
      data.id = rows[0].id.toString();
    }

    revalidatePath(`/projects/${data.projectId}/evaluation`);
    return data;
  } catch (error) {
    console.error("saveEvaluation error:", error);
    throw new DatabaseError();
  }
}

// ─── Update status only ───────────────────────────────────────────────────────

export async function updateEvaluationStatus(
  projectId: string,
  status: "draft" | "active" | "closed",
): Promise<void> {
  try {
    await safeQuery(
      "UPDATE Evaluation SET status = @p2, updatedAt = GETDATE() WHERE projectId = @p1",
      [projectId, status],
    );
    revalidatePath(`/projects/${projectId}/evaluation`);
  } catch (error) {
    console.error("updateEvaluationStatus error:", error);
    throw new DatabaseError();
  }
}

// ─── Submit a survey response ─────────────────────────────────────────────────

export async function submitEvalResponse(data: {
  evaluationId: string;
  projectId: string;
  respondentGroup: string;
  channel: string;
  responses: QuestionResponse[];
}): Promise<string> {
  return await withTransaction(async (trx) => {
    // Insert submission header
    const subReq = new sql.Request(trx);
    subReq.input("evaluationId", sql.Int, parseInt(data.evaluationId));
    subReq.input("respondentGroup", sql.NVarChar, data.respondentGroup);
    subReq.input("channel", sql.NVarChar, data.channel);
    const subResult = await subReq.query(`
      INSERT INTO EvalSubmission (evaluationId, respondentGroup, channel, submittedAt)
      OUTPUT INSERTED.id
      VALUES (@evaluationId, @respondentGroup, @channel, GETDATE())
    `);
    const submissionId = subResult.recordset[0].id;

    // Insert individual responses
    for (const resp of data.responses) {
      const rReq = new sql.Request(trx);
      rReq.input("submissionId", sql.Int, submissionId);
      rReq.input("questionId", sql.NVarChar, resp.questionId);
      rReq.input(
        "numericValue",
        sql.Float,
        typeof resp.value === "number" ? resp.value : null,
      );
      rReq.input(
        "textValue",
        sql.NVarChar,
        typeof resp.value === "string" ? resp.value : (resp.textValue ?? null),
      );
      await rReq.query(`
        INSERT INTO EvalResponse (submissionId, questionId, numericValue, textValue)
        VALUES (@submissionId, @questionId, @numericValue, @textValue)
      `);
    }

    return submissionId.toString();
  });
}

// ─── Get all submissions for a project (for reports) ─────────────────────────

export async function getEvalSubmissions(
  projectId: string,
): Promise<EvalSubmission[]> {
  try {
    const { rows: headerRows } = await safeQuery<any>(
      "SELECT id FROM Evaluation WHERE projectId = @p1",
      [projectId],
    );
    if (headerRows.length === 0) return [];

    const evalId = headerRows[0].id;
    const { rows } = await safeQuery<any>(
      `SELECT es.id, es.respondentGroup, es.submittedAt, es.channel,
              er.questionId, er.numericValue, er.textValue
       FROM EvalSubmission es
       LEFT JOIN EvalResponse er ON er.submissionId = es.id
       WHERE es.evaluationId = @p1
       ORDER BY es.submittedAt DESC, er.id`,
      [evalId],
    );

    const submissionMap = new Map<string, EvalSubmission>();
    for (const row of rows) {
      if (!submissionMap.has(row.id.toString())) {
        submissionMap.set(row.id.toString(), {
          id: row.id.toString(),
          respondentGroup: row.respondentGroup,
          submittedAt: row.submittedAt?.toISOString(),
          channel: row.channel,
          responses: [],
        });
      }
      if (row.questionId) {
        submissionMap.get(row.id.toString())!.responses.push({
          questionId: row.questionId,
          value: row.numericValue ?? row.textValue ?? "",
          textValue: row.textValue,
        });
      }
    }

    return Array.from(submissionMap.values());
  } catch (error) {
    console.error("getEvalSubmissions error:", error);
    throw new DatabaseError();
  }
}
