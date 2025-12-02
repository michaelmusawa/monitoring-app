import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileDown,
  FileText,
  PieChart,
  TrendingUp,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";

import { getEvaluationQuestions } from "@/lib/data/evaluationData";
import type { EvaluationQuestion } from "@/lib/data/evaluationData";

type Props = {
  projectId: string;
  category: string;
};

export default function EvaluationCategory({ projectId, category }: Props) {
  const readable = category.charAt(0).toUpperCase() + category.slice(1);

  // Get questions from static data
  const questions = getEvaluationQuestions(projectId, category);

  if (questions.length === 0) {
    return (
      <div className="space-y-6">
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
            <div className="text-center py-8">
              <BarChart3 className="size-12 mx-auto text-zinc-400 mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400">
                No evaluation data available for {readable} category in this
                project.
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Evaluation data is collected after project completion.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate category summary
  const totalQuestions = questions.length;
  const avgYes =
    questions.reduce((sum, q) => sum + q.responses.yes, 0) / totalQuestions;
  const avgNo =
    questions.reduce((sum, q) => sum + q.responses.no, 0) / totalQuestions;
  const avgNeutral =
    questions.reduce((sum, q) => sum + q.responses.neutral, 0) / totalQuestions;

  return (
    <div className="space-y-6">
      {/* CATEGORY SUMMARY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>
              {readable} Evaluation —{" "}
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Project {projectId}
              </span>
            </span>
            <div className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
              {totalQuestions} questions • Avg. Yes: {avgYes.toFixed(1)}%
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-300">
                  Positive
                </span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-700 dark:text-green-400">
                {avgYes.toFixed(1)}%
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="size-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-800 dark:text-red-300">
                  Negative
                </span>
              </div>
              <div className="text-2xl font-bold mt-2 text-red-700 dark:text-red-400">
                {avgNo.toFixed(1)}%
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <MinusCircle className="size-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-800 dark:text-yellow-300">
                  Neutral
                </span>
              </div>
              <div className="text-2xl font-bold mt-2 text-yellow-700 dark:text-yellow-400">
                {avgNeutral.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUESTIONS AND RESPONSES */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base flex items-start justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    #{idx + 1}
                  </span>
                  {q.question}
                </span>
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  ID: {q.id}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Responses
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        Yes
                      </span>
                      <span className="font-bold">{q.responses.yes}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600 dark:text-red-400">No</span>
                      <span className="font-bold">{q.responses.no}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600 dark:text-yellow-400">
                        Neutral
                      </span>
                      <span className="font-bold">{q.responses.neutral}%</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Visualization
                  </p>
                  <div className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg flex flex-col justify-center p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="size-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          Response Distribution
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {q.charts?.type === "pie" ? "Pie Chart" : "Bar Chart"}
                      </span>
                    </div>

                    {/* Simple chart visualization */}
                    <div className="flex items-end h-12 gap-1 mt-2">
                      <div
                        className="flex-1 bg-green-500 rounded-t-sm transition-all hover:opacity-90"
                        style={{ height: `${q.responses.yes}%` }}
                        title={`Yes: ${q.responses.yes}%`}
                      />
                      <div
                        className="flex-1 bg-red-500 rounded-t-sm transition-all hover:opacity-90"
                        style={{ height: `${q.responses.no}%` }}
                        title={`No: ${q.responses.no}%`}
                      />
                      <div
                        className="flex-1 bg-yellow-500 rounded-t-sm transition-all hover:opacity-90"
                        style={{ height: `${q.responses.neutral}%` }}
                        title={`Neutral: ${q.responses.neutral}%`}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>Yes</span>
                      <span>No</span>
                      <span>Neutral</span>
                    </div>
                  </div>
                </div>
              </div>

              {q.description && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {q.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* EXPORT / REPORT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex justify-between items-center">
            Category Report & Analytics
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/projects/${projectId}/evaluation/report?category=${encodeURIComponent(category)}`}
                >
                  <FileDown className="size-4 mr-1" />
                  PDF Export
                </Link>
              </Button>

              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/projects/${projectId}/evaluation/report?category=${encodeURIComponent(category)}&format=csv`}
                >
                  <FileText className="size-4 mr-1" />
                  Raw Data (CSV)
                </Link>
              </Button>

              <Button asChild size="sm" variant="default">
                <Link
                  href={`/projects/${projectId}/evaluation/report?category=${encodeURIComponent(category)}&analysis=full`}
                >
                  <TrendingUp className="size-4 mr-1" />
                  Full Analysis
                </Link>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
            <p>
              This category contains {totalQuestions} evaluation questions with
              an average positive response rate of {avgYes.toFixed(1)}%.
            </p>
            <p className="text-xs">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
