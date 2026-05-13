import { Suspense } from "react";
import {
  Shield,
  ArrowRight,
  MessageSquare,
  Search,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  DollarSign,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Logo from "@/components/customUI/logo";
import { fetchPublicStats } from "@/lib/actions/publicActions"; // create this
import RecentUpdates from "@/components/portal/RecentUpdates";
// create this

export default async function HomePage() {
  // Fetch lightweight statistics – see step below
  const stats = await fetchPublicStats();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Hero section */}
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

      {/* Key stats bar */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Total Projects",
              value: stats.totalProjects,
              icon: Briefcase,
            },
            {
              label: "Completed",
              value: `${stats.completionRate}`,
              icon: CheckCircle2,
            },
            { label: "Ongoing", value: stats.activeProjects, icon: TrendingUp },
            {
              label: "Stalled",
              value: stats.stalledProjects,
              icon: AlertTriangle,
            },
            {
              label: "Terminated",
              value: stats.stalledProjects,
              icon: AlertTriangle,
            },
            {
              label: "Total Budget",
              value: `KES ${(stats.totalBudget / 1e9).toFixed(1)}B`,
              icon: DollarSign,
            },
            {
              label: "Not Started",
              value: stats.notStartedProjects,
              icon: Clock,
            },

            { label: "Sectors", value: stats.subCounties, icon: MapPin },
            { label: "Sub‑counties", value: stats.subCounties, icon: MapPin },
            { label: "Wards", value: stats.subCounties, icon: MapPin },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="border-l-4 border-l-primary shadow-md"
            >
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/5">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Latest updates / activity feed */}
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

      {/* Call‑to‑action block */}
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
