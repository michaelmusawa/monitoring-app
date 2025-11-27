// app/portal/page.tsx
import PortalClient from "@/components/portal/PortalPage";
import { getProjects, getPublicComments } from "@/lib/actions/actions"; // adjust path if different

export const metadata = { title: "Public Projects Portal" };

export default async function PortalPage() {
  // Server-side fetch of projects & public comments (small dataset)
  const projects = await getProjects();
  const comments = await getPublicComments(""); // all comments; you can filter server-side later

  return (
    <div className="max-w-7xl mx-auto p-6 pt-20 lg:pt-6">
      <h1 className="text-2xl font-semibold mb-2">Public Projects Portal</h1>
      <p className="text-sm text-muted-foreground mb-6">
        View county infrastructure projects, leave public feedback, and see
        trackers & updates.
      </p>

      {/* Portal client receives the projects as props */}
      <PortalClient projects={projects} publicComments={comments} />
    </div>
  );
}
