"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import PortfolioStatusReportPDFDocument from "@/components/reports/PortfolioStatusReportPDFDocument";

export default function PortfolioReportButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects/reports/portfolio-status");
      console.log("res", res);
      // if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();

      const doc = <PortfolioStatusReportPDFDocument data={data} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Nairobi-County-Portfolio-Status-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate portfolio report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant="outline"
      className="gap-2"
    >
      <FileText className="w-4 h-4" />
      {loading ? "Generating PDF..." : "Portfolio Status Report"}
    </Button>
  );
}
