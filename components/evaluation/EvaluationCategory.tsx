"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileDown, FileText } from "lucide-react";

import { getEvaluationQuestions } from "@/lib/actions/migrated/getEvaluationQuestions";
import { useEffect, useState } from "react";

export default function EvaluationCategory({ projectId, category }) {
  const readable = category.charAt(0).toUpperCase() + category.slice(1);

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    async function fetchQuestions() {
      const data = await getEvaluationQuestions();
      setQuestions(data);
    }
    fetchQuestions();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{readable} Evaluation</CardTitle>
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
          <Card key={idx}>
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

              {/* Placeholder chart (use shadcn chart if available) */}
              <div className="h-32 mt-4 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
                <BarChart3 className="size-6 text-zinc-400" />
                <span className="ml-2 text-xs text-zinc-500">
                  Chart goes here
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* EXPORT SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex justify-between items-center">
            Category Report
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="size-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline">
                <FileText className="size-4 mr-1" />
                CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
