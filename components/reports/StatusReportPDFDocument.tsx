// components/reports/StatusReportPDFDocument.tsx
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

// ─── Styles (mirrored from AttendancePDF + report sections) ─────────────────
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Inter",
    fontSize: 10,
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
    fontSize: 9,
    color: COLORS.primary,
    marginBottom: 6,
  },
  departmentName: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: 800,
    color: COLORS.primary,
    textTransform: "uppercase",
    marginTop: 10,
    textAlign: "center",
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.secondary,
    marginTop: 15,
    marginBottom: 8,
    textAlign: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    alignSelf: "center",
  },
  dateHeader: {
    position: "absolute",
    top: 10,
    right: 30,
    fontSize: 10,
    color: COLORS.secondary,
  },
  mosaicPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 212,
    height: 196,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  metaCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.primary,
  },
  metaItem: {
    width: "32%",
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: 500,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.secondary,
  },
  sectionTitle: {
    fontFamily: "Poppins",
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.primary,
    marginTop: 15,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 2,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: "justify",
  },
  bulletList: {
    marginLeft: 10,
    marginBottom: 8,
  },
  bulletItem: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 4,
    flexDirection: "row",
  },
  bulletDot: {
    width: 10,
    fontWeight: 700,
    color: COLORS.primary,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerTagline: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 6,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  footerBarText: {
    color: "#FFFFFF",
    fontSize: 8,
    textAlign: "center",
    fontFamily: "Poppins",
    fontWeight: 500,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 8,
    color: COLORS.textMuted,
  },
});

// ─── Helper: render a list of strings as bullet points ─────────────────────
function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={[styles.paragraph, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
interface Props {
  reportTitle: string;
  reportContent: any; // the ReportContent object from the draft
  departmentName?: string;
}

export default function StatusReportPDFDocument({
  reportTitle,
  reportContent,
  departmentName = "DEPARTMENT OF MONITORING AND EVALUATION",
}: Props) {
  const content = reportContent;

  // Scope rendering
  const scopeView = content.projectScope?.length > 0 && (
    <View>
      <Text style={styles.sectionTitle}>Project Scope</Text>
      {content.projectScope.map((cat: any, idx: number) => (
        <View key={idx} style={{ marginBottom: 8 }}>
          <Text style={[styles.paragraph, { fontWeight: 700 }]}>
            {cat.category}
          </Text>
          {cat.items?.map((item: any, i2: number) => (
            <View key={i2} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.paragraph}>
                {item.label}: {item.percent}%
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark} fixed>
          LET&apos;S MAKE NAIROBI WORK
        </Text>

        {/* Mosaic */}
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/mosaic.png`}
          style={styles.mosaicPlaceholder}
        />

        {/* Date */}
        <View style={styles.dateHeader}>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/county.png`}
            style={styles.logo}
          />
          <Text style={styles.countyName}>NAIROBI CITY COUNTY</Text>
          <Text style={styles.website}>www.nairobi.go.ke</Text>
          <Text style={styles.departmentName}>{departmentName}</Text>
          <Text style={styles.reportTitle}>{reportTitle}</Text>
        </View>

        {/* Meta card */}
        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{content.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tracking Date</Text>
            <Text style={styles.metaValue}>{content.trackingDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Overall Completion</Text>
            <Text style={styles.metaValue}>
              {content.overallPercent?.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Funding Source</Text>
            <Text style={styles.metaValue}>{content.fundingSource}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Employer</Text>
            <Text style={styles.metaValue}>{content.employer}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Employer Rep</Text>
            <Text style={styles.metaValue}>{content.employerRep || "—"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Project Manager</Text>
            <Text style={styles.metaValue}>
              {content.projectManager || "—"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fiscal Year</Text>
            <Text style={styles.metaValue}>{content.fiscalYear || "—"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Contract Sum</Text>
            <Text style={styles.metaValue}>{content.contractSum || "—"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Commencement</Text>
            <Text style={styles.metaValue}>
              {content.commencementDate || "—"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Planned Completion</Text>
            <Text style={styles.metaValue}>
              {content.plannedCompletion || "—"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Contract Duration</Text>
            <Text style={styles.metaValue}>
              {content.contractDuration || "—"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Cost to Completion</Text>
            <Text style={styles.metaValue}>
              {content.costToCompletion || "—"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Workforce on Site</Text>
            <Text style={styles.metaValue}>
              {content.workforceCount ?? 0}
              {content.workforceNote ? ` (${content.workforceNote})` : ""}
            </Text>
          </View>
        </View>

        {/* Project Overview */}
        {content.projectOverview && (
          <>
            <Text style={styles.sectionTitle}>Project Overview</Text>
            <Text style={styles.paragraph}>{content.projectOverview}</Text>
          </>
        )}

        {/* Scope */}
        {scopeView}

        {/* Summary of Completed Works */}
        {content.summaryOfCompleted?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Summary of Completed Works</Text>
            <BulletList items={content.summaryOfCompleted} />
          </>
        )}

        {/* Ongoing Works */}
        {content.ongoingWorks && (
          <>
            <Text style={styles.sectionTitle}>Ongoing Works</Text>
            <Text style={styles.paragraph}>{content.ongoingWorks}</Text>
          </>
        )}

        {/* Pending Works */}
        {content.pendingWorks && (
          <>
            <Text style={styles.sectionTitle}>Pending Works</Text>
            <Text style={styles.paragraph}>{content.pendingWorks}</Text>
          </>
        )}

        {/* Key Findings */}
        {content.keyFindings?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Key Findings</Text>
            <BulletList items={content.keyFindings} />
          </>
        )}

        {/* Challenges */}
        {content.challenges?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Challenges</Text>
            <BulletList items={content.challenges} />
          </>
        )}

        {/* Recommendations */}
        {content.recommendations?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <BulletList items={content.recommendations} />
          </>
        )}

        {/* Best Practices */}
        {content.bestPractices?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Best Practices</Text>
            <BulletList items={content.bestPractices} />
          </>
        )}

        {/* Lessons Learnt */}
        {content.lessonsLearnt?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Lessons Learnt</Text>
            <BulletList items={content.lessonsLearnt} />
          </>
        )}

        {/* Footer (fixed) */}
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

        {/* Page number */}
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
