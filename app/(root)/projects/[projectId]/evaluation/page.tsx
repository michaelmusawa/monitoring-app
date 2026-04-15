// app/projects/[projectId]/evaluation/page.tsx

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProject } from "@/lib/actions/projectActions";
import { getTrackerSubmissions } from "@/lib/actions/trackerActions";
import { getEvaluation } from "@/lib/actions/evaluationActions";
import { getUser } from "@/lib/actions/usersActions";
import ProjectEvaluation from "@/components/evaluation/ProjectEvaluation";

export default async function EvaluationPage(props: {
  params?: Promise<{ projectId?: string }>;
}) {
  const params = await props.params;
  const projectId = params?.projectId || "";
  const session = await auth();
  const userEmail = session?.user?.email ?? "";

  const [project, submissions, evalConfig, user] = await Promise.all([
    getProject(projectId),
    getTrackerSubmissions(projectId),
    getEvaluation(projectId),
    getUser(userEmail),
  ]);

  if (!project) notFound();

  const userRole =
    user?.sector === "Monitoring And Evaluation"
      ? "me"
      : user?.sector !== "Monitoring And Evaluation"
        ? "sector"
        : "viewer";

  // Project is "complete" when the latest tracker has all items at 100%
  const latestSubmission =
    submissions.length > 0
      ? submissions.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        )[0]
      : null;

  const isComplete =
    latestSubmission !== null &&
    latestSubmission.items.length > 0 &&
    latestSubmission.items.every((it) => it.percentComplete >= 100);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 pt-8">
        <ProjectEvaluation
          projectId={project.id}
          projectName={project.name}
          projectSector={project.sector ?? "General"}
          isComplete={isComplete}
          userRole={userRole}
          initialConfig={evalConfig}
        />
      </div>
    </div>
  );
}
