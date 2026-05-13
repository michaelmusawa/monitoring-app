import { notFound } from "next/navigation";
import {
  fetchPublicProjectDetail,
  fetchPublicComments,
} from "@/lib/actions/publicActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Building,
  Clock,
} from "lucide-react";
import CommentSection from "@/components/portal/CommentSection";
import StaticLocationMap from "@/components/maps/StaticLocationMap";

function fmtCurrency(n: number | null) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  return `KES ${n.toLocaleString()}`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await fetchPublicProjectDetail(projectId);
  if (!project) notFound();

  const comments = await fetchPublicComments(projectId);

  const infoCards = [
    {
      label: "Sector",
      value: project.sector || "Not specified",
      icon: Building,
    },
    {
      label: "Status",
      value: project.status === "ACTIVE" ? "Active" : "Pending",
      icon: Clock,
    },
    { label: "Budget", value: fmtCurrency(project.budget), icon: DollarSign },
    { label: "Progress", value: `${project.progress}%`, icon: TrendingUp },
    {
      label: "Location",
      value: `${project.ward || "N/A"}, ${project.subCounty || "N/A"}`,
      icon: MapPin,
    },
    {
      label: "Created",
      value: new Date(project.createdAt).toLocaleDateString(),
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Back link */}
        <a
          href="/portal"
          className="text-sm text-primary hover:underline inline-block"
        >
          &larr; Back to Portal
        </a>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.description || "No description provided."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoCards.map((card) => (
            <Card key={card.label} className="border-border/50 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <card.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="font-semibold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contract & Funding */}
        {(project.fundingSource ||
          project.contractSum ||
          project.commencementDate) && (
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Contract & Funding</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {project.fundingSource && (
                <div>
                  <span className="font-semibold">Funding Source:</span>{" "}
                  {project.fundingSource}
                </div>
              )}
              {project.contractSum && (
                <div>
                  <span className="font-semibold">Contract Sum:</span>{" "}
                  {project.contractSum}
                </div>
              )}
              {project.contractDuration && (
                <div>
                  <span className="font-semibold">Duration:</span>{" "}
                  {project.contractDuration}
                </div>
              )}
              {project.commencementDate && (
                <div>
                  <span className="font-semibold">Start Date:</span>{" "}
                  {new Date(project.commencementDate).toLocaleDateString()}
                </div>
              )}
              {project.plannedCompletion && (
                <div>
                  <span className="font-semibold">Planned Completion:</span>{" "}
                  {new Date(project.plannedCompletion).toLocaleDateString()}
                </div>
              )}
              {project.employer && (
                <div>
                  <span className="font-semibold">Employer:</span>{" "}
                  {project.employer}
                </div>
              )}
              {project.projectManager && (
                <div>
                  <span className="font-semibold">Project Manager:</span>{" "}
                  {project.projectManager}
                </div>
              )}
              {project.fiscalYear && (
                <div>
                  <span className="font-semibold">Fiscal Year:</span>{" "}
                  {project.fiscalYear}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Map */}
        {project.location?.lat && project.location.long && (
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Project Location</CardTitle>
            </CardHeader>
            <CardContent>
              <StaticLocationMap
                lat={project.location.lat}
                lng={project.location.long}
                label={`${project.ward || ""}, ${project.subCounty || ""}`}
              />
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <CommentSection projectId={project.id} initialComments={comments} />
      </div>
    </div>
  );
}
