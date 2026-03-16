// app/eval/[projectId]/page.tsx
// Public page — no auth required. Respondents reach this via link, QR, WhatsApp, etc.

import { notFound } from "next/navigation";
import { getEvaluation } from "@/lib/actions/evaluationActions";
import EvalSurveyClient from "@/components/evaluation/EvalSurveyClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// Nice page title for browser tab / social share
//

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const config = await getEvaluation(projectId).catch(() => null);
  return {
    title: config?.title ?? "Project Evaluation",
    description: config?.description ?? "Impact evaluation questionnaire",
  };
}

export default async function EvalPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ group?: string; ref?: string }>;
}) {
  const { projectId } = await params;
  const { group, ref } = await searchParams;

  const config = await getEvaluation(projectId).catch(() => null);

  console.log("config", config);

  if (!config) notFound();

  return (
    <EvalSurveyClient
      config={config}
      prefilledGroup={group ?? null}
      channel={ref ?? "link"}
      projectId={projectId}
    />
  );
}
