import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileDown, FileText } from "lucide-react";

import { getEvaluationQuestions } from "@/lib/actions/migrated/getEvaluationQuestions";
import type { EvaluationQuestion } from "@/lib/data/migrated/migratedEvaluationQuestions";

type Props = {
  projectId: string;
  category: string;
};

/**
 * Server component: EvaluationCategory
 *
 * Fetches evaluation questions on the server using a migrated server action,
 * adds explicit typing and renders the category with summary cards and export
 * actions.
 *
 * Converted from a client component to a server component so data is fetched
 * server-side and type errors (implicit any) are removed.
 */
export default async function EvaluationCategory({
  projectId,
  category,
}: Props) {
  const readable =
    category && category.length > 0
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : "Evaluation";

  // Fetch questions from the server action and type explicitly
  const questions: EvaluationQuestion[] = await getEvaluationQuestions();

  // Optionally in future: filter questions by category or projectId
  // For now, render the returned questions as-is
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {readable} Evaluation —{" "}
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Project {projectId}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            View responses, graphs, and analysis for the {readable} category.
          </p>
        </CardContent>
      </Card>

      {/* QUESTIONS AND RESPONSES */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={`${idx}-${q.q}`}>
            <CardHeader>
              <CardTitle className="text-sm">{q.q}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <p>
                  Yes: <strong>{q.responses.yes}%</strong>
                </p>
                <p>
                  No: <strong>{q.responses.no}%</strong>
                </p>
              </div>

              {/* Placeholder chart (keeps UI consistent with previous component) */}
              <div className="h-32 mt-4 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
                <BarChart3 className="size-6 text-zinc-400" />
                <span className="ml-2 text-xs text-zinc-500">
                  Chart placeholder
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* EXPORT / REPORT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex justify-between items-center">
            Category Report
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/projects/${projectId}/evaluation/report?category=${encodeURIComponent(category)}`}
                >
                  <FileDown className="size-4 mr-1" />
                  PDF
                </Link>
              </Button>

              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/projects/${projectId}/evaluation/report?category=${encodeURIComponent(category)}&format=csv`}
                >
                  <FileText className="size-4 mr-1" />
                  CSV
                </Link>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
