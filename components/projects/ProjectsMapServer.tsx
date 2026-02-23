import { fetchProjectsForMap } from "@/lib/actions/projectActions";
import ProjectsMap from "../dashboard/ProjectsMap";

const ProjectsMapServer = async ({
  query,
  status,
  size,
  userEmail,
}: {
  query: string;
  status: string;
  size: string;
  userEmail: string;
}) => {
  const projects = await fetchProjectsForMap({
    query,
    status,
    size,
    userEmail,
  });

  const mappedProjects = projects.filter((p: any) => p.lat && p.long);

  return (
    <div className="h-[600px] rounded-xl border overflow-hidden">
      <ProjectsMap projects={mappedProjects} />
    </div>
  );
};

export default ProjectsMapServer;
