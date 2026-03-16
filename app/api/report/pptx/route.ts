// app/api/report/pptx/route.ts
// Generates a PowerPoint progress report in the Dishi na County style.
// POST body: { projects: ReportProject[], sections: ReportSection[] }
//
// Slide structure (mirrors the uploaded reference report):
//  1. Title slide
//  2. Summary progress table
//  3. Progress bar chart
//  4. Progress pie chart (Finished vs Unfinished)
//  5. Workforce table
//  6. Workforce bar chart
//  7. Workforce pie chart
//  8. Best Practices slide
//  9. Challenges slide
// 10–N. Per-project "at a glance" slide
// N+1. Thank You / Closing

import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";

// ─── Colours (Nairobi County green/yellow palette) ────────────────────────────
const GREEN = "1A5C2A"; // Dark forest green
const YELLOW = "F5C518"; // Gold/yellow accent
const WHITE = "FFFFFF";
const BLACK = "1A1A1A";
const LGRAY = "F4F4F4";
const MGRAY = "888888";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | null): string {
  return v != null ? `${v.toFixed(2)}%` : "N/A";
}

function makeFooter(slide: any, pres: any) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 5.325,
    w: 10,
    h: 0.3,
    fill: { color: GREEN },
    line: { color: GREEN, width: 0 },
  });
  slide.addText("LET'S MAKE NAIROBI WORK", {
    x: 0,
    y: 5.325,
    w: 10,
    h: 0.3,
    align: "right",
    valign: "middle",
    fontSize: 9,
    bold: true,
    color: YELLOW,
    margin: [0, 0.2, 0, 0],
  });
}

function headerBar(slide: any, pres: any, title: string) {
  // Top green bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.55,
    fill: { color: GREEN },
    line: { color: GREEN, width: 0 },
  });
  slide.addText(title, {
    x: 0.2,
    y: 0,
    w: 9.6,
    h: 0.55,
    fontSize: 18,
    bold: true,
    color: WHITE,
    valign: "middle",
    align: "left",
  });
}

// ─── Slide builders ───────────────────────────────────────────────────────────

function buildTitleSlide(pres: any, reportDate: string, officerName: string) {
  const slide = pres.addSlide();
  slide.background = { color: GREEN };

  // Decorative diagonal shapes
  slide.addShape(pres.shapes.RECTANGLE, {
    x: -0.5,
    y: -0.5,
    w: 3.5,
    h: 7,
    rotate: 15,
    fill: { color: "145220", transparency: 30 },
    line: { color: "145220", width: 0 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5,
    y: -0.5,
    w: 1.2,
    h: 7,
    rotate: 15,
    fill: { color: YELLOW, transparency: 20 },
    line: { color: YELLOW, width: 0 },
  });

  // Title text block
  slide.addText("DISHI NA COUNTY INITIATIVE", {
    x: 2,
    y: 1.5,
    w: 7.5,
    h: 0.8,
    fontSize: 30,
    bold: true,
    color: WHITE,
    align: "center",
  });
  slide.addText("KITCHENS CONSTRUCTION PROGRESS REPORT", {
    x: 2,
    y: 2.4,
    w: 7.5,
    h: 0.6,
    fontSize: 18,
    bold: true,
    color: YELLOW,
    align: "center",
  });
  slide.addText("FROM", {
    x: 2,
    y: 3.15,
    w: 7.5,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: YELLOW,
    align: "center",
  });
  slide.addText("EFFICIENCY MONITORING AND EVALUATION DEPARTMENT", {
    x: 2,
    y: 3.5,
    w: 7.5,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: YELLOW,
    align: "center",
  });
  slide.addText(officerName, {
    x: 2,
    y: 4.0,
    w: 7.5,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: WHITE,
    align: "center",
  });
  slide.addText(reportDate, {
    x: 2,
    y: 4.45,
    w: 7.5,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: YELLOW,
    align: "center",
  });

  // Footer
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 5.325,
    w: 10,
    h: 0.3,
    fill: { color: "0D3D18" },
    line: { color: "0D3D18", width: 0 },
  });
  slide.addText("LET'S MAKE NAIROBI WORK", {
    x: 0,
    y: 5.325,
    w: 9.8,
    h: 0.3,
    align: "right",
    valign: "middle",
    fontSize: 9,
    bold: true,
    color: WHITE,
    margin: 0,
  });
}

function buildProgressTable(pres: any, projects: any[]) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  headerBar(slide, pres, "SUMMARY OVERALL PROGRESS TABLE");

  const headers = ["S/NO", "Kitchen", "Progress", "Variance"];
  const rows = projects.map((p, i) => [
    String(i + 1),
    p.name,
    pct(p.latestTrackerPercent),
    p.weeklyVariance != null ? `${p.weeklyVariance.toFixed(2)}%` : "N/A",
  ]);

  const finished = projects.filter(
    (p) => (p.latestTrackerPercent ?? 0) >= 100,
  ).length;
  const finishedPct = (finished / Math.max(projects.length, 1)) * 100;
  const unfinishedPct = 100 - finishedPct;

  // Summary rows
  rows.push(["", "Finished", `${finishedPct.toFixed(2)}%`, ""]);
  rows.push(["", "Unfinished", `${unfinishedPct.toFixed(2)}%`, ""]);

  const tableData = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, color: BLACK, fill: { color: YELLOW } },
    })),
    ...rows.map((row, ri) =>
      row.map((cell, ci) => {
        const isTotal = ri >= rows.length - 2;
        return {
          text: cell,
          options: {
            fill: { color: isTotal ? YELLOW : ri % 2 === 0 ? LGRAY : WHITE },
            bold: isTotal,
            align: ci === 0 ? "center" : "left",
          },
        };
      }),
    ),
  ];

  slide.addTable(tableData, {
    x: 0.5,
    y: 0.7,
    w: 9,
    colW: [0.6, 3.5, 2.2, 2.2],
    fontSize: 11,
    border: { pt: 0.5, color: "CCCCCC" },
  });

  makeFooter(slide, pres);
}

function buildProgressBarChart(pres: any, projects: any[]) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  headerBar(slide, pres, "SUMMARY OVERALL PROGRESS BAR GRAPH");

  slide.addText("% DONE per KITCHEN", {
    x: 0.5,
    y: 0.65,
    w: 9,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: BLACK,
    align: "center",
  });

  slide.addChart(
    pres.charts.BAR,
    [
      {
        name: "Progress",
        labels: projects.map((p) => p.name),
        values: projects.map((p) => p.latestTrackerPercent ?? 0),
      },
    ],
    {
      x: 0.4,
      y: 0.95,
      w: 9.2,
      h: 4.1,
      barDir: "col",
      chartColors: projects.map((p) => {
        const v = p.latestTrackerPercent ?? 0;
        return v >= 80
          ? "10B981"
          : v >= 60
            ? "3B82F6"
            : v >= 40
              ? "F59E0B"
              : "EF4444";
      }),
      chartArea: { fill: { color: WHITE }, roundedCorners: false },
      catAxisLabelColor: "555555",
      valAxisLabelColor: "555555",
      valGridLine: { color: "E5E7EB", size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelColor: "1A1A1A",
      dataLabelFontSize: 9,
      valAxisMinVal: 0,
      valAxisMaxVal: 100,
      showLegend: false,
    },
  );

  makeFooter(slide, pres);
}

function buildProgressPie(pres: any, projects: any[]) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  headerBar(slide, pres, "SUMMARY OVERALL PROGRESS PIE-CHART");

  const finished = projects.filter(
    (p) => (p.latestTrackerPercent ?? 0) >= 100,
  ).length;
  const finishedPct = Math.round(
    (finished / Math.max(projects.length, 1)) * 100,
  );
  const unfinishedPct = 100 - finishedPct;

  // Derive "finished" as avg >= 60% following the source report convention
  const avgProgress =
    projects.reduce((s, p) => s + (p.latestTrackerPercent ?? 0), 0) /
    Math.max(projects.length, 1);
  const doneRounded = Math.round(avgProgress);
  const notDone = 100 - doneRounded;

  slide.addChart(
    pres.charts.PIE,
    [
      {
        name: "Status",
        labels: ["Finished", "Unfinished"],
        values: [doneRounded, notDone],
      },
    ],
    {
      x: 1.5,
      y: 0.7,
      w: 7,
      h: 4.5,
      chartColors: ["4472C4", "ED7D31"],
      showPercent: true,
      dataLabelFontSize: 18,
      dataLabelFontBold: true,
      dataLabelColor: WHITE,
      legendPos: "r",
      showLegend: true,
      legendFontSize: 14,
      chartArea: { fill: { color: LGRAY } },
    },
  );

  makeFooter(slide, pres);
}

function buildWorkforceTable(pres: any, projects: any[]) {
  const workforceProjects = projects.filter((p) => p.workforce);
  if (workforceProjects.length === 0) return;

  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  headerBar(slide, pres, "SUMMARY AVERAGE WORKFORCE TABLE");

  const headers = ["", "Female", "Men", "PDWs", "Total"];
  const rows = workforceProjects.map((p) => [
    p.name,
    String(p.workforce.female),
    String(p.workforce.male),
    String(p.workforce.pwd),
    String(p.workforce.total),
  ]);

  const totals = workforceProjects.reduce(
    (acc, p) => ({
      female: acc.female + (p.workforce?.female ?? 0),
      men: acc.male + (p.workforce?.male ?? 0),
      pwd: acc.pwd + (p.workforce?.pwd ?? 0),
      total: acc.total + (p.workforce?.total ?? 0),
    }),
    { female: 0, male: 0, pwd: 0, total: 0 },
  );
  rows.push([
    "Totals",
    String(totals.female),
    String(totals.male),
    String(totals.pwd),
    String(totals.total),
  ]);

  const tableData = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, fill: { color: WHITE }, color: BLACK },
    })),
    ...rows.map((row, ri) =>
      row.map((cell, ci) => ({
        text: cell,
        options: {
          fill: { color: ri === rows.length - 1 ? WHITE : WHITE },
          bold: ri === rows.length - 1 || ci === 0,
          color: ri === rows.length - 1 ? "1A5C2A" : BLACK,
          align: ci === 0 ? "left" : "center",
        },
      })),
    ),
  ];

  slide.addTable(tableData, {
    x: 0.5,
    y: 0.7,
    w: 9,
    colW: [2.5, 1.6, 1.6, 1.6, 1.7],
    fontSize: 11,
    border: { pt: 0.5, color: "CCCCCC" },
  });

  makeFooter(slide, pres);
}

function buildWorkforceBarChart(pres: any, projects: any[]) {
  const wp = projects.filter((p) => p.workforce);
  if (wp.length === 0) return;

  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  headerBar(slide, pres, "SUMMARY AVERAGE WORKFORCE BAR GRAPHS");

  slide.addChart(
    pres.charts.BAR,
    [
      {
        name: "Female",
        labels: wp.map((p) => p.name),
        values: wp.map((p) => p.workforce.female),
      },
      {
        name: "Male",
        labels: wp.map((p) => p.name),
        values: wp.map((p) => p.workforce.male),
      },
      {
        name: "PWDs",
        labels: wp.map((p) => p.name),
        values: wp.map((p) => p.workforce.pwd),
      },
    ],
    {
      x: 0.4,
      y: 0.65,
      w: 9.2,
      h: 4.5,
      barDir: "col",
      barGrouping: "clustered",
      chartColors: ["4472C4", "ED7D31", "A5A5A5"],
      chartArea: { fill: { color: WHITE } },
      catAxisLabelColor: "555555",
      valAxisLabelColor: "555555",
      valGridLine: { color: "E5E7EB", size: 0.5 },
      catGridLine: { style: "none" },
      showLegend: true,
      legendPos: "b",
      legendFontSize: 10,
    },
  );

  makeFooter(slide, pres);
}

function buildTextSlide(pres: any, title: string, content: string) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };
  headerBar(slide, pres, title);

  // Split on double-newline for paragraphs or bullet points
  const lines = content.split("\n").filter(Boolean);
  const bullets = lines.map((line, i) => ({
    text: line.trim(),
    options: {
      bullet: i > 0,
      breakLine: i < lines.length - 1,
      paraSpaceAfter: 6,
    },
  }));

  slide.addText(bullets.length > 0 ? bullets : [{ text: content }], {
    x: 0.5,
    y: 0.75,
    w: 9,
    h: 4.4,
    fontSize: 13,
    color: BLACK,
    valign: "top",
    lineSpacingMultiple: 1.3,
  });

  makeFooter(slide, pres);
}

function buildProjectSlide(pres: any, project: any) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  // Header with project name
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.55,
    fill: { color: GREEN },
    line: { color: GREEN, width: 0 },
  });
  slide.addText(`${project.name.toUpperCase()} KITCHEN AT A GLANCE`, {
    x: 0.2,
    y: 0,
    w: 9.6,
    h: 0.55,
    fontSize: 17,
    bold: true,
    color: WHITE,
    valign: "middle",
  });

  // Progress bar visual
  const prog = project.latestTrackerPercent ?? 0;
  const barW = 8.5;
  const fillW = (prog / 100) * barW;
  const barColor =
    prog >= 80
      ? "10B981"
      : prog >= 50
        ? "3B82F6"
        : prog >= 20
          ? "F59E0B"
          : "D1D5DB";

  slide.addText("Overall Progress", {
    x: 0.5,
    y: 0.75,
    w: 3,
    h: 0.25,
    fontSize: 10,
    color: MGRAY,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5,
    y: 1.05,
    w: barW,
    h: 0.18,
    fill: { color: "E5E7EB" },
    line: { color: "E5E7EB", width: 0 },
  });
  if (fillW > 0) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5,
      y: 1.05,
      w: fillW,
      h: 0.18,
      fill: { color: barColor },
      line: { color: barColor, width: 0 },
    });
  }
  slide.addText(`${prog.toFixed(1)}%`, {
    x: barW + 0.6,
    y: 0.97,
    w: 0.9,
    h: 0.3,
    fontSize: 13,
    bold: true,
    color: barColor,
  });

  // Stats grid
  const stats = [
    { label: "Tracker Submissions", value: String(project.trackerCount ?? 0) },
    { label: "Stalled Items", value: String(project.stalledCount ?? 0) },
    { label: "Sector", value: project.sector ?? "—" },
    { label: "Location", value: project.location ?? "—" },
    { label: "Checklist Status", value: project.checklistStatus ?? "—" },
    {
      label: "Weekly Variance",
      value:
        project.weeklyVariance != null
          ? `+${project.weeklyVariance.toFixed(2)}%`
          : "—",
    },
  ];

  stats.forEach((stat, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.1;
    const y = 1.4 + row * 0.85;
    slide.addShape(pres.shapes.RECTANGLE, {
      x,
      y,
      w: 2.9,
      h: 0.72,
      fill: { color: LGRAY },
      line: { color: "E5E7EB", width: 1 },
    });
    slide.addText(stat.label, {
      x: x + 0.1,
      y: y + 0.04,
      w: 2.7,
      h: 0.24,
      fontSize: 8,
      color: MGRAY,
      bold: false,
    });
    slide.addText(stat.value, {
      x: x + 0.1,
      y: y + 0.3,
      w: 2.7,
      h: 0.32,
      fontSize: 12,
      bold: true,
      color: BLACK,
    });
  });

  // Best practice & challenge
  const textY = 3.15;
  if (project.bestPractice) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5,
      y: textY,
      w: 4.3,
      h: 1.95,
      fill: { color: "F0FDF4" },
      line: { color: "86EFAC", width: 1 },
    });
    slide.addText("✓ Best Practice", {
      x: 0.65,
      y: textY + 0.1,
      w: 4.0,
      h: 0.26,
      fontSize: 10,
      bold: true,
      color: "15803D",
    });
    slide.addText(project.bestPractice, {
      x: 0.65,
      y: textY + 0.38,
      w: 4.0,
      h: 1.45,
      fontSize: 10,
      color: "166534",
      valign: "top",
    });
  }
  if (project.challenge) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.2,
      y: textY,
      w: 4.3,
      h: 1.95,
      fill: { color: "FFF7ED" },
      line: { color: "FCD34D", width: 1 },
    });
    slide.addText("⚠ Challenge", {
      x: 5.35,
      y: textY + 0.1,
      w: 4.0,
      h: 0.26,
      fontSize: 10,
      bold: true,
      color: "B45309",
    });
    slide.addText(project.challenge, {
      x: 5.35,
      y: textY + 0.38,
      w: 4.0,
      h: 1.45,
      fontSize: 10,
      color: "92400E",
      valign: "top",
    });
  }

  makeFooter(slide, pres);
}

function buildClosingSlide(pres: any) {
  const slide = pres.addSlide();
  slide.background = { color: GREEN };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: -0.5,
    y: -0.5,
    w: 3.5,
    h: 7,
    rotate: 15,
    fill: { color: "145220", transparency: 30 },
    line: { color: "145220", width: 0 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5,
    y: -0.5,
    w: 1.2,
    h: 7,
    rotate: 15,
    fill: { color: YELLOW, transparency: 20 },
    line: { color: YELLOW, width: 0 },
  });

  slide.addText("Thank You!", {
    x: 1.5,
    y: 1.8,
    w: 7,
    h: 1.8,
    fontSize: 60,
    bold: true,
    color: YELLOW,
    align: "center",
    valign: "middle",
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 5.325,
    w: 10,
    h: 0.3,
    fill: { color: "0D3D18" },
    line: { color: "0D3D18", width: 0 },
  });
  slide.addText("LET'S MAKE NAIROBI WORK", {
    x: 0,
    y: 5.325,
    w: 9.8,
    h: 0.3,
    align: "right",
    valign: "middle",
    fontSize: 9,
    bold: true,
    color: WHITE,
    margin: 0,
  });
}

// ─── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { projects, sections } = await req.json();

    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_16x9";
    pres.author = "Efficiency Monitoring and Evaluation Department";
    pres.title = "Dishi na County Kitchens Construction Progress Report";

    const reportDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();

    const officerName = "Efficiency Monitoring and Evaluation Department";

    // 1. Title slide
    buildTitleSlide(pres, reportDate, officerName);

    // 2. Summary progress table
    buildProgressTable(pres, projects);

    // 3. Progress bar chart
    buildProgressBarChart(pres, projects);

    // 4. Progress pie chart
    buildProgressPie(pres, projects);

    // 5. Workforce table (if data available)
    buildWorkforceTable(pres, projects);

    // 6. Workforce bar chart
    buildWorkforceBarChart(pres, projects);

    // 7. Best practices (from sections)
    const bpSection = sections.find((s: any) => s.id === "best_practices");
    if (bpSection?.content)
      buildTextSlide(
        pres,
        "BEST PRACTICES SAMPLED FROM SITES",
        bpSection.content,
      );

    // 8. Challenges
    const challengeSection = sections.find((s: any) => s.id === "challenges");
    if (challengeSection?.content)
      buildTextSlide(pres, "SPECIFIC CHALLENGES", challengeSection.content);

    // 9. Executive summary & observations
    const execSection = sections.find((s: any) => s.id === "executive");
    if (execSection?.content)
      buildTextSlide(pres, "EXECUTIVE SUMMARY", execSection.content);

    const obsSection = sections.find((s: any) => s.id === "observations");
    if (obsSection?.content)
      buildTextSlide(pres, "OVERALL OBSERVATIONS", obsSection.content);

    const recsSection = sections.find((s: any) => s.id === "recommendations");
    if (recsSection?.content)
      buildTextSlide(pres, "RECOMMENDATIONS & CONCLUSION", recsSection.content);

    // 10+. Per-project slides
    for (const project of projects) {
      buildProjectSlide(pres, project);
    }

    // Closing
    buildClosingSlide(pres);

    // Export to buffer
    const buffer = (await pres.write({ outputType: "nodebuffer" })) as Buffer;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Dishi_na_County_Progress_Report.pptx"`,
      },
    });
  } catch (err: any) {
    console.error("PPTX generation error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
