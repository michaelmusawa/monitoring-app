//monitoring-app/lib/data/migrated/migratedTasks.ts
// Dummy project tasks migrated from ProjectCalendar.tsx
// Enhanced: added category and time-tracking (estimatedHours, actualHoursUsed)
// This mock data is intended for a Gantt-like workplan view showing timeline,
// progress, and time spent (actual vs estimated) per task and category.

export type ProjectTask = {
  id: string;
  title: string;
  category: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  estimatedHours: number; // planned effort
  // If trackers are available we will compute actualHoursUsed from trackers (sum of hours recorded)
  actualHoursUsed: number; // actual time spent so far (initial mock; will be updated from trackers)
  // Progress may be computed from trackers as well (percentage completed across tracker items that reference relatedParameterIds)
  progress: number; // 0-100
  status: "on-schedule" | "behind-schedule" | "completed" | string;
  // Links this workplan task to checklist parameter IDs so trackers' task entries can be correlated.
  // Example: ["1.1","1.2"]
  relatedParameterIds?: string[];
};

export const dummyProjectTasks: ProjectTask[] = [
  {
    id: "task1",
    title: "Site Mobilization",
    category: "Mobilization",
    startDate: "2025-11-01",
    endDate: "2025-11-07",
    estimatedHours: 40,
    actualHoursUsed: 42,
    progress: 100,
    status: "on-schedule",
    relatedParameterIds: ["1.1", "1.2"],
  },
  {
    id: "task2",
    title: "Materials Delivery",
    category: "Logistics",
    startDate: "2025-11-08",
    endDate: "2025-11-14",
    estimatedHours: 16,
    actualHoursUsed: 8,
    progress: 50,
    status: "behind-schedule",
    relatedParameterIds: ["2.1"],
  },
  {
    id: "task3",
    title: "Foundation Excavation",
    category: "Substructure",
    startDate: "2025-11-15",
    endDate: "2025-11-28",
    estimatedHours: 120,
    actualHoursUsed: 72,
    progress: 60,
    status: "behind-schedule",
    relatedParameterIds: ["2.2", "2.3"],
  },
  {
    id: "task4",
    title: "Foundation Pouring",
    category: "Substructure",
    startDate: "2025-11-29",
    endDate: "2025-12-12",
    estimatedHours: 100,
    actualHoursUsed: 20,
    progress: 20,
    status: "on-schedule",
    relatedParameterIds: ["2.3"],
  },
  {
    id: "task5",
    title: "Superstructure Columns",
    category: "Superstructure",
    startDate: "2025-12-13",
    endDate: "2026-01-25",
    estimatedHours: 200,
    actualHoursUsed: 0,
    progress: 0,
    status: "on-schedule",
    relatedParameterIds: ["sup-columns", "sup-walls"],
  },
  {
    id: "task6",
    title: "Roofing & Finishes",
    category: "Finishing",
    startDate: "2026-01-26",
    endDate: "2026-02-28",
    estimatedHours: 150,
    actualHoursUsed: 0,
    progress: 0,
    status: "on-schedule",
    relatedParameterIds: ["fin-plaster", "fin-paint", "fin-fixtures"],
  },
  {
    id: "task7",
    title: "Electrical & Plumbing",
    category: "Services",
    startDate: "2026-02-01",
    endDate: "2026-03-10",
    estimatedHours: 120,
    actualHoursUsed: 0,
    progress: 0,
    status: "on-schedule",
    relatedParameterIds: ["serv-elec", "serv-plumb"],
  },
  {
    id: "task8",
    title: "Final Handover & Testing",
    category: "Handover",
    startDate: "2026-03-11",
    endDate: "2026-03-25",
    estimatedHours: 60,
    actualHoursUsed: 0,
    progress: 0,
    status: "on-schedule",
    relatedParameterIds: ["hand-testing", "hand-snagging", "hand-cleaning"],
  },
];
