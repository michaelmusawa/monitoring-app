export interface EvaluationQuestion {
  id: string;
  projectId: string;
  category: string;
  question: string;
  description?: string;
  responses: {
    yes: number;
    no: number;
    neutral: number;
  };
  charts?: {
    type: "bar" | "pie" | "line";
    data: Record<string, any>;
  };
}

export interface EvaluationCategorySummary {
  category: string;
  completion: number;
  totalQuestions: number;
  averageScore: number;
  lastUpdated: string;
}

export interface EvaluationStats {
  label: string;
  value: string;
  color: string;
  icon: string;
}

// Static evaluation questions for each project and category
export const evaluationQuestions: EvaluationQuestion[] = [
  // Project 5 - County Web Portal
  {
    id: "eval-5-1",
    projectId: "proj-5",
    category: "relevance",
    question: "Was the web portal relevant to the community's needs?",
    description:
      "Assessing if the portal addresses actual community requirements",
    responses: { yes: 85, no: 10, neutral: 5 },
    charts: {
      type: "pie",
      data: { labels: ["Yes", "No", "Neutral"], values: [85, 10, 5] },
    },
  },
  {
    id: "eval-5-2",
    projectId: "proj-5",
    category: "relevance",
    question: "Did the project align with county digital transformation goals?",
    responses: { yes: 90, no: 5, neutral: 5 },
    charts: {
      type: "bar",
      data: { labels: ["Yes", "No", "Neutral"], values: [90, 5, 5] },
    },
  },
  {
    id: "eval-5-3",
    projectId: "proj-5",
    category: "coherence",
    question: "Was the web portal consistent with existing county systems?",
    responses: { yes: 75, no: 15, neutral: 10 },
    charts: {
      type: "pie",
      data: { labels: ["Yes", "No", "Neutral"], values: [75, 15, 10] },
    },
  },
  {
    id: "eval-5-4",
    projectId: "proj-5",
    category: "effectiveness",
    question: "How effective was the portal in service delivery?",
    responses: { yes: 80, no: 12, neutral: 8 },
    charts: {
      type: "bar",
      data: { labels: ["Yes", "No", "Neutral"], values: [80, 12, 8] },
    },
  },
  {
    id: "eval-5-5",
    projectId: "proj-5",
    category: "efficiency",
    question: "Did the portal improve operational efficiency?",
    responses: { yes: 88, no: 7, neutral: 5 },
  },
  {
    id: "eval-5-6",
    projectId: "proj-5",
    category: "impact",
    question: "What was the community impact of the portal?",
    responses: { yes: 82, no: 10, neutral: 8 },
  },
  {
    id: "eval-5-7",
    projectId: "proj-5",
    category: "sustainability",
    question: "Is the portal solution sustainable long-term?",
    responses: { yes: 70, no: 20, neutral: 10 },
  },

  // Project 2 - ICRMS
  {
    id: "eval-2-1",
    projectId: "proj-2",
    category: "relevance",
    question: "Was ICRMS relevant for revenue management?",
    responses: { yes: 92, no: 4, neutral: 4 },
  },
  {
    id: "eval-2-2",
    projectId: "proj-2",
    category: "effectiveness",
    question: "How effective was ICRMS in automating revenue processes?",
    responses: { yes: 87, no: 8, neutral: 5 },
  },

  // Project 3 - Email System
  {
    id: "eval-3-1",
    projectId: "proj-3",
    category: "effectiveness",
    question: "Was the email system effective for staff communication?",
    responses: { yes: 65, no: 25, neutral: 10 },
  },

  // Project Dandora Stadium
  {
    id: "eval-dandora-1",
    projectId: "proj-dandora-stadium",
    category: "relevance",
    question: "Is the stadium relevant to community sports needs?",
    responses: { yes: 95, no: 3, neutral: 2 },
  },
];

// Category summaries for each project
export const evaluationCategorySummaries: EvaluationCategorySummary[] = [
  {
    category: "relevance",
    completion: 100,
    totalQuestions: 4,
    averageScore: 4.5,
    lastUpdated: "2025-02-15",
  },
  {
    category: "coherence",
    completion: 85,
    totalQuestions: 3,
    averageScore: 4.2,
    lastUpdated: "2025-02-14",
  },
  {
    category: "effectiveness",
    completion: 92,
    totalQuestions: 5,
    averageScore: 4.3,
    lastUpdated: "2025-02-16",
  },
  {
    category: "efficiency",
    completion: 78,
    totalQuestions: 4,
    averageScore: 4.0,
    lastUpdated: "2025-02-13",
  },
  {
    category: "impact",
    completion: 88,
    totalQuestions: 4,
    averageScore: 4.4,
    lastUpdated: "2025-02-17",
  },
  {
    category: "sustainability",
    completion: 75,
    totalQuestions: 3,
    averageScore: 3.8,
    lastUpdated: "2025-02-12",
  },
];

// Helper functions
export function getEvaluationQuestions(
  projectId: string,
  category?: string,
): EvaluationQuestion[] {
  let questions = evaluationQuestions.filter((q) => q.projectId === projectId);

  if (category) {
    questions = questions.filter((q) => q.category === category);
  }

  return questions;
}

export function getEvaluationStats(projectId: string): EvaluationStats[] {
  const questions = getEvaluationQuestions(projectId);
  const totalQuestions = questions.length;
  const avgScore =
    questions.length > 0
      ? (
          questions.reduce((sum, q) => sum + (q.responses.yes / 100) * 5, 0) /
          questions.length
        ).toFixed(1)
      : "0.0";

  return [
    {
      label: "Total Questions",
      value: totalQuestions.toString(),
      color: "text-blue-500",
      icon: "ClipboardListIcon",
    },
    {
      label: "Responses",
      value: "100%",
      color: "text-green-500",
      icon: "BarChart3Icon",
    },
    {
      label: "Completion",
      value: "85%",
      color: "text-purple-500",
      icon: "PieChartIcon",
    },
    {
      label: "Avg. Score",
      value: `${avgScore}/5.0`,
      color: "text-orange-500",
      icon: "GaugeIcon",
    },
    {
      label: "Categories",
      value: "6",
      color: "text-cyan-500",
      icon: "FileTextIcon",
    },
    {
      label: "Reports",
      value: "24",
      color: "text-red-500",
      icon: "ListChecksIcon",
    },
  ];
}

export function getCompletedStages(projectId: string): string[] {
  // For demo, return all stages for active projects, fewer for pending
  const projectSpecific = {
    "proj-5": ["relevance", "coherence", "effectiveness", "efficiency"], // Web Portal
    "proj-2": ["relevance", "effectiveness"], // ICRMS
    "proj-3": ["effectiveness"], // Email System
    "proj-dandora-stadium": ["relevance"], // Dandora Stadium
  };

  return projectSpecific[projectId as keyof typeof projectSpecific] || [];
}
