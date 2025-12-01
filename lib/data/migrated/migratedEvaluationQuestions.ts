//monitoring-app/lib/data/migrated/migratedEvaluationQuestions.ts
// Dummy evaluation questions migrated from EvaluationCategory.tsx

export type EvaluationQuestion = {
  q: string;
  responses: {
    yes: number;
    no: number;
  };
};

export const dummyEvaluationQuestions: EvaluationQuestion[] = [
  {
    q: "Was the project relevant to the community’s needs?",
    responses: { yes: 78, no: 22 },
  },
  {
    q: "Did the project align with county development priorities?",
    responses: { yes: 91, no: 9 },
  },
];
