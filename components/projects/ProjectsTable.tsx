import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchFilteredProjects } from "@/lib/actions/projectActions";

const PAGE_SIZE = 10; // used only for offset calculation

const ProjectsTable = async ({
  query,
  startDate,
  endDate,
  status,
  size,
  currentPage,
  userEmail,
}: {
  query: string;
  startDate: string;
  endDate: string;
  status: string;
  size: string;
  currentPage: number;
  userEmail: string;
}) => {
  const projects = await fetchFilteredProjects({
    query,
    startDate,
    endDate,
    status,
    size,
    currentPage,
    userEmail,
  });

  const offset = (currentPage - 1) * PAGE_SIZE;

  console.log("Project id", projects[0].id);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">
              Sector
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">
              Progress
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {projects.map((project: any, i) => (
            <tr
              key={project.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td className="px-6 py-4 text-sm font-medium">
                {offset + i + 1}
              </td>

              <td className="px-6 py-4">
                <div className="font-medium">{project.name}</div>
              </td>

              <td className="px-6 py-4">
                <Badge variant="outline">{project.sector ?? "—"}</Badge>
              </td>

              <td className="px-6 py-4">
                <Badge>{project.status}</Badge>
              </td>

              <td className="px-6 py-4 capitalize">{project.size ?? "—"}</td>

              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${project.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {project.progress ?? 0}%
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 text-right">
                {project.status === "PENDING" ? (
                  <Button size="sm" variant="default" asChild>
                    <a href={`/projects/${project.id}/initialize`}>Initiate</a>
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/projects/${project.id}`}>View</a>
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsTable;
