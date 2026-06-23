// components/reports/PortfolioStatusReportPDFDocument.tsx
"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// ─── Fonts (same as AttendancePDF) ─────────────────────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZg.ttf",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZg.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZg.ttf",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "Poppins",
  fonts: [
    {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/Poppins/Poppins-Regular.ttf`,
      fontWeight: 400,
    },
    {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/Poppins/Poppins-Medium.ttf`,
      fontWeight: 500,
    },
    {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/Poppins/Poppins-SemiBold.ttf`,
      fontWeight: 600,
    },
    {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/Poppins/Poppins-Bold.ttf`,
      fontWeight: 700,
    },
    {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/Poppins/Poppins-ExtraBold.ttf`,
      fontWeight: 800,
    },
  ],
});

// ─── Colors ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#00431F",
  secondary: "#000000",
  border: "#CCCCCC",
  headerBg: "#F0F0F0",
  textMuted: "#595959",
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Inter",
    fontSize: 9,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "15%",
    fontSize: 60,
    color: "rgba(0, 67, 31, 0.05)",
    fontWeight: 700,
    transform: "rotate(-45deg)",
    textAlign: "center",
    width: "70%",
  },
  header: {
    marginBottom: 15,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 10,
  },
  countyName: {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  website: {
    fontSize: 8,
    color: COLORS.primary,
    marginBottom: 4,
  },
  departmentName: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: 800,
    color: COLORS.primary,
    textTransform: "uppercase",
    marginTop: 8,
    textAlign: "center",
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.secondary,
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 8,
    alignSelf: "center",
  },
  dateHeader: {
    position: "absolute",
    top: 10,
    right: 30,
    fontSize: 8,
    color: COLORS.secondary,
  },
  mosaicPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 180,
    height: 170,
  },
  sectionTitle: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 2,
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 6,
    textAlign: "justify",
  },
  // Scorecard stat boxes
  scorecardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  scorecardBox: {
    width: "20%",
    alignItems: "center",
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  scorecardNumber: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.primary,
  },
  scorecardLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  // Tables
  table: {
    width: "100%",
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
  },
  headerCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: 700,
    color: "#FFFFFF",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 20,
    alignItems: "center",
  },
  cell: {
    padding: 3,
    fontSize: 8,
    color: COLORS.secondary,
    textAlign: "center",
  },
  // Stalled risk register
  riskRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 18,
  },
  riskCell: {
    padding: 2,
    fontSize: 8,
    color: COLORS.secondary,
  },
  // Footer
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerTagline: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontFamily: "Poppins",
    fontWeight: 400,
    color: COLORS.primary,
  },
  footerTextBold: {
    fontFamily: "Poppins",
    fontWeight: 800,
    color: COLORS.primary,
  },
  footerBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  footerBarText: {
    color: "#FFFFFF",
    fontSize: 7,
    textAlign: "center",
    fontFamily: "Poppins",
    fontWeight: 500,
  },
  pageNumber: {
    position: "absolute",
    bottom: 25,
    right: 30,
    fontSize: 8,
    color: COLORS.textMuted,
  },
});

// ─── Helper: horizontal stat boxes ────────────────────────────────────────
function StatBox({
  number,
  label,
}: {
  number: number | string;
  label: string;
}) {
  return (
    <View style={styles.scorecardBox}>
      <Text style={styles.scorecardNumber}>{number}</Text>
      <Text style={styles.scorecardLabel}>{label}</Text>
    </View>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
interface Props {
  data: {
    overall: {
      total: number;
      hardTotal: number;
      softTotal: number;
      completed: number;
      ongoing: number;
      stalled: number;
      terminated: number;
    };
    sectors: {
      sector: string;
      total: number;
      hardTotal: number;
      softTotal: number;
      completed: number;
      ongoing: number;
      stalled: number;
      terminated: number;
      completionRate: string;
    }[];
    stalledProjects: {
      id: string;
      name: string;
      type: string;
      sector: string;
      status: string;
      budget: number;
    }[];
    generatedAt: string;
  };
}

export default function PortfolioStatusReportPDFDocument({ data }: Props) {
  const { overall, sectors, stalledProjects } = data;
  const sectorsWithProjects = sectors.filter((s) => s.total > 0);
  sectorsWithProjects.sort((a, b) => b.total - a.total);

  // Hard sectors only, sorted by completion rate
  const hardSectors = sectorsWithProjects
    .filter((s) => s.hardTotal > 0)
    .sort((a, b) => Number(b.completionRate) - Number(a.completionRate));

  // Soft sectors only
  const softSectors = sectorsWithProjects
    .filter((s) => s.softTotal > 0)
    .sort((a, b) => Number(b.completionRate) - Number(a.completionRate));

  // Stalled summary per sector
  const stalledBySector = new Map<string, number>();
  stalledProjects.forEach((p) => {
    stalledBySector.set(p.sector, (stalledBySector.get(p.sector) || 0) + 1);
  });

  // Column widths for the main sector table (slightly different from earlier)
  const colWidths = {
    sector: "18%",
    total: "8%",
    completed: "8%",
    ongoing: "8%",
    stalled: "8%",
    terminated: "8%",
    hard: "7%",
    soft: "7%",
    completion: "9%",
  };

  const headers = [
    { key: "sector", label: "Sector", align: "left" },
    { key: "total", label: "Total", align: "center" },
    { key: "completed", label: "Completed", align: "center" },
    { key: "ongoing", label: "Ongoing", align: "center" },
    { key: "stalled", label: "Stalled", align: "center" },
    { key: "terminated", label: "Term.", align: "center" },
    { key: "hard", label: "Hard", align: "center" },
    { key: "soft", label: "Soft", align: "center" },
    { key: "completion", label: "% Comp", align: "center" },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Watermark + Mosaic + Date */}
        <Text style={styles.watermark} fixed>
          LET&apos;S MAKE NAIROBI WORK
        </Text>
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/mosaic.png`}
          style={styles.mosaicPlaceholder}
        />
        <View style={styles.dateHeader}>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* County Header */}
        <View style={styles.header}>
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/county.png`}
            style={styles.logo}
          />
          <Text style={styles.countyName}>NAIROBI CITY COUNTY</Text>
          <Text style={styles.website}>www.nairobi.go.ke</Text>
          <Text style={styles.departmentName}>MONITORING AND EVALUATION</Text>
          <Text style={styles.reportTitle}>
            STATUS REPORT FOR COMPLETE, STALLED AND ONGOING PROJECTS
          </Text>
        </View>

        {/* 1. Introduction */}
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Nairobi City County is managing {overall.total} projects across
          multiple sectors. Of these, {overall.completed} have been completed (
          {((overall.completed / overall.total) * 100).toFixed(0)}%),
          {overall.ongoing} are ongoing (
          {((overall.ongoing / overall.total) * 100).toFixed(0)}%),
          {overall.stalled} remain stalled (
          {((overall.stalled / overall.total) * 100).toFixed(0)}%) and
          {overall.terminated} (
          {((overall.terminated / overall.total) * 100).toFixed(0)}%) are
          terminated.
        </Text>
        <Text style={styles.paragraph}>
          Hard projects account for {overall.hardTotal} (
          {((overall.hardTotal / overall.total) * 100).toFixed(0)}%) of the
          portfolio, while soft projects account for {overall.softTotal} (
          {((overall.softTotal / overall.total) * 100).toFixed(0)}%). Hard
          projects are performing at a{" "}
          {(
            ((overall.completed -
              softSectors.reduce((s, sec) => s + sec.completed, 0)) /
              Math.max(overall.hardTotal, 1)) *
            100
          ).toFixed(1)}
          % completion rate.
        </Text>
        <Text style={styles.paragraph}>
          Immediate attention is required on stalled projects, particularly in
          Disaster Management, Health, Business and Hustler Opportunities, and
          sectors where every soft project is stalled.
        </Text>

        {/* 2. Portfolio Scorecard */}
        <Text style={styles.sectionTitle}>2. Portfolio Scorecard</Text>
        <View style={styles.scorecardContainer}>
          <StatBox number={overall.total} label="Total Projects\nHard + Soft" />
          <StatBox
            number={overall.completed}
            label={`Completed\n${((overall.completed / overall.total) * 100).toFixed(0)}%`}
          />
          <StatBox
            number={overall.ongoing}
            label={`Ongoing\n${((overall.ongoing / overall.total) * 100).toFixed(0)}%`}
          />
          <StatBox
            number={overall.stalled}
            label={`Stalled\n${((overall.stalled / overall.total) * 100).toFixed(0)}%`}
          />
          <StatBox
            number={overall.terminated}
            label={`Terminated\n${((overall.terminated / overall.total) * 100).toFixed(0)}%`}
          />
        </View>

        {/* Hard vs Soft comparison */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text
              style={[styles.headerCell, { width: "20%", textAlign: "left" }]}
            >
              Category
            </Text>
            <Text style={[styles.headerCell, { width: "16%" }]}>Total</Text>
            <Text style={[styles.headerCell, { width: "16%" }]}>Completed</Text>
            <Text style={[styles.headerCell, { width: "16%" }]}>Ongoing</Text>
            <Text style={[styles.headerCell, { width: "16%" }]}>Stalled</Text>
            <Text style={[styles.headerCell, { width: "16%" }]}>
              Terminated
            </Text>
          </View>
          <View style={styles.row}>
            <Text
              style={[
                styles.cell,
                { width: "20%", textAlign: "left", fontWeight: 700 },
              ]}
            >
              Hard Projects
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.hardTotal}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.completed -
                softSectors.reduce((s, sec) => s + sec.completed, 0)}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.ongoing -
                softSectors.reduce((s, sec) => s + sec.ongoing, 0)}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.stalled -
                softSectors.reduce((s, sec) => s + sec.stalled, 0)}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.terminated}
            </Text>
          </View>
          <View style={styles.row}>
            <Text
              style={[
                styles.cell,
                { width: "20%", textAlign: "left", fontWeight: 700 },
              ]}
            >
              Soft Projects
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.softTotal}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {softSectors.reduce((s, sec) => s + sec.completed, 0)}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {softSectors.reduce((s, sec) => s + sec.ongoing, 0)}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {softSectors.reduce((s, sec) => s + sec.stalled, 0)}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>-</Text>
          </View>
          <View style={[styles.row, { backgroundColor: "#F0F0F0" }]}>
            <Text
              style={[
                styles.cell,
                { width: "20%", textAlign: "left", fontWeight: 700 },
              ]}
            >
              COMBINED TOTAL
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>{overall.total}</Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.completed}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.ongoing}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.stalled}
            </Text>
            <Text style={[styles.cell, { width: "16%" }]}>
              {overall.terminated}
            </Text>
          </View>
        </View>

        {/* 3. Hard Projects */}
        <Text style={styles.sectionTitle}>
          3. Hard Projects (Infrastructure and Construction)
        </Text>
        <View style={styles.scorecardContainer}>
          <StatBox number={overall.hardTotal} label="Hard Projects" />
          <StatBox
            number={
              overall.completed -
              softSectors.reduce((s, sec) => s + sec.completed, 0)
            }
            label="Completed"
          />
          <StatBox
            number={
              overall.ongoing -
              softSectors.reduce((s, sec) => s + sec.ongoing, 0)
            }
            label="Ongoing"
          />
          <StatBox
            number={
              overall.stalled -
              softSectors.reduce((s, sec) => s + sec.stalled, 0)
            }
            label="Stalled"
          />
          <StatBox number={overall.terminated} label="Terminated" />
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {headers.map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.headerCell,
                  {
                    width: (Object.values(colWidths) as string[])[i],
                    textAlign: h.align as any,
                  },
                ]}
              >
                {h.label}
              </Text>
            ))}
          </View>
          {hardSectors.map((sector, idx) => (
            <View
              key={idx}
              style={[
                styles.row,
                idx % 2 === 0 ? { backgroundColor: "#F8F8F8" } : {},
              ]}
            >
              <Text
                style={[
                  styles.cell,
                  { width: colWidths.sector, textAlign: "left" },
                ]}
              >
                {sector.sector}
              </Text>
              <Text style={[styles.cell, { width: colWidths.total }]}>
                {sector.total}
              </Text>
              <Text style={[styles.cell, { width: colWidths.completed }]}>
                {sector.completed}
              </Text>
              <Text style={[styles.cell, { width: colWidths.ongoing }]}>
                {sector.ongoing}
              </Text>
              <Text style={[styles.cell, { width: colWidths.stalled }]}>
                {sector.stalled}
              </Text>
              <Text style={[styles.cell, { width: colWidths.terminated }]}>
                {sector.terminated}
              </Text>
              <Text style={[styles.cell, { width: colWidths.hard }]}>
                {sector.hardTotal}
              </Text>
              <Text style={[styles.cell, { width: colWidths.soft }]}>
                {sector.softTotal}
              </Text>
              <Text style={[styles.cell, { width: colWidths.completion }]}>
                {sector.completionRate}%
              </Text>
            </View>
          ))}
        </View>

        {/* 4. Soft Projects */}
        {softSectors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              4. Soft Projects (Policy, Planning and Systems)
            </Text>
            <View style={styles.scorecardContainer}>
              <StatBox number={overall.softTotal} label="Soft Projects" />
              <StatBox
                number={softSectors.reduce((s, sec) => s + sec.completed, 0)}
                label="Completed"
              />
              <StatBox
                number={softSectors.reduce((s, sec) => s + sec.ongoing, 0)}
                label="Ongoing"
              />
              <StatBox
                number={softSectors.reduce((s, sec) => s + sec.stalled, 0)}
                label="Stalled"
              />
              <StatBox number={0} label="Terminated" />
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                {headers.map((h, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.headerCell,
                      {
                        width: (Object.values(colWidths) as string[])[i],
                        textAlign: h.align as any,
                      },
                    ]}
                  >
                    {h.label}
                  </Text>
                ))}
              </View>
              {softSectors.map((sector, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.row,
                    idx % 2 === 0 ? { backgroundColor: "#F8F8F8" } : {},
                  ]}
                >
                  <Text
                    style={[
                      styles.cell,
                      { width: colWidths.sector, textAlign: "left" },
                    ]}
                  >
                    {sector.sector}
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.total }]}>
                    {sector.total}
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.completed }]}>
                    {sector.completed}
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.ongoing }]}>
                    {sector.ongoing}
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.stalled }]}>
                    {sector.stalled}
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.terminated }]}>
                    -
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.hard }]}>
                    -
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.soft }]}>
                    {sector.softTotal}
                  </Text>
                  <Text style={[styles.cell, { width: colWidths.completion }]}>
                    {sector.completionRate}%
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 5. Stalled Projects Risk Register */}
        {stalledProjects.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              5. Stalled Projects Risk Register
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text
                  style={[
                    styles.headerCell,
                    { width: "6%", textAlign: "center" },
                  ]}
                >
                  #
                </Text>
                <Text
                  style={[
                    styles.headerCell,
                    { width: "30%", textAlign: "left" },
                  ]}
                >
                  Project Name
                </Text>
                <Text
                  style={[
                    styles.headerCell,
                    { width: "20%", textAlign: "left" },
                  ]}
                >
                  Sector
                </Text>
                <Text
                  style={[
                    styles.headerCell,
                    { width: "12%", textAlign: "center" },
                  ]}
                >
                  Type
                </Text>
                <Text
                  style={[
                    styles.headerCell,
                    { width: "32%", textAlign: "left" },
                  ]}
                >
                  Primary Cause / Note
                </Text>
              </View>
              {stalledProjects.map((proj, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.riskRow,
                    idx % 2 === 0 ? { backgroundColor: "#F8F8F8" } : {},
                  ]}
                >
                  <Text style={[styles.cell, { width: "6%" }]}>{idx + 1}</Text>
                  <Text
                    style={[styles.cell, { width: "30%", textAlign: "left" }]}
                  >
                    {proj.name}
                  </Text>
                  <Text
                    style={[styles.cell, { width: "20%", textAlign: "left" }]}
                  >
                    {proj.sector}
                  </Text>
                  <Text style={[styles.cell, { width: "12%" }]}>
                    {proj.type}
                  </Text>
                  <Text
                    style={[styles.cell, { width: "32%", textAlign: "left" }]}
                  >
                    —
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footerContainer} fixed>
          <View style={styles.footerTagline}>
            <Text style={styles.footerText}>LET’S MAKE </Text>
            <Text style={styles.footerTextBold}>NAIROBI</Text>
            <Text style={styles.footerText}> WORK</Text>
          </View>
          <View style={styles.footerBar}>
            <Text style={styles.footerBarText}>
              TELEPHONE: +254 725 624 489; +254 738 041 292 | EMAIL:
              INFO@NAIROBI.GO.KE | CITY HALL, CITY HALL WAY, P.O. BOX 30075
              00100, NAIROBI, KENYA
            </Text>
          </View>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
