import { Suspense } from "react";
import {
  Shield,
  ArrowRight,
  MessageSquare,
  Search,
  TrendingUp,
  Briefcase,
  DollarSign,
  MapPin,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/customUI/logo";
import { fetchPublicStats } from "@/lib/actions/publicActions";
import RecentUpdates from "@/components/portal/RecentUpdates";
import DeliverySummaryCharts from "@/components/portal/DeliverySummaryCharts";

function formatBudget(n: number) {
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

export default async function HomePage() {
  const stats = await fetchPublicStats();

  const statusData = [
    { name: "Completed", value: stats.completedProjects, color: "#10b981" },
    { name: "Ongoing", value: stats.ongoingProjects, color: "#3b82f6" },
    { name: "Not Started", value: stats.notStartedProjects, color: "#f59e0b" },
    { name: "Stalled", value: stats.stalledProjects, color: "#ef4444" },
    { name: "Terminated", value: stats.terminatedProjects, color: "#6b7280" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Hero section (unchanged) */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/5 rounded-full px-3 py-1 mb-3">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">
              Nairobi City County
            </span>
          </div>
          <div className="flex justify-center mb-2">
            <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
              <Logo />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Track Your County Projects
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real‑time information on development projects across Nairobi. See
            where your tax money goes and share your feedback directly with
            project teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/portal/projects">
                <Search className="w-4 h-4" />
                Explore Projects
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/portal/feedback">
                <MessageSquare className="w-4 h-4" />
                Share Feedback
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key stats grid – now 6 cards on large screens, responsive */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Projects"
            value={stats.totalProjects}
            icon={Briefcase}
          />
          <StatCard
            label="Total Budget"
            value={formatBudget(stats.totalBudget)}
            icon={DollarSign}
          />
          <StatCard
            label="Active Sub‑counties"
            value={stats.subCounties}
            icon={Shield}
          />
          <StatCard
            label="Sectors"
            value={stats.totalSectors}
            icon={Building2}
          />
          <StatCard label="Wards" value={stats.totalWards} icon={MapPin} />
          <StatCard
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* Delivery Summary (charts) */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <DeliverySummaryCharts
          statusData={statusData}
          totalProjects={stats.totalProjects}
        />
      </section>

      {/* Latest updates */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Latest Updates</h2>
          <Link
            href="/portal/projects"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Suspense
          fallback={<p className="text-muted-foreground">Loading updates…</p>}
        >
          <RecentUpdates />
        </Suspense>
      </section>

      {/* CTA block */}
      <section className="bg-primary/5 border-t border-border/50 py-12">
        <div className="max-w-2xl mx-auto text-center px-4 space-y-4">
          <h2 className="text-2xl font-bold">Your Voice Matters</h2>
          <p className="text-muted-foreground">
            Have you noticed a project delay, poor workmanship, or excellent
            progress? Tell us directly – every comment is publicly visible and
            helps improve delivery.
          </p>
          <Button asChild variant="default" size="lg" className="gap-2">
            <Link href="/portal/feedback">
              <MessageSquare className="w-4 h-4" />
              Share Community Feedback
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// Simplified StatCard (removed trend for now)
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-primary/5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}
