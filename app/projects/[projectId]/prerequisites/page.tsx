// File: app/projects/[projectId]/prerequisites/page.tsx

import { getProjectById } from "@/lib/actions/actions";

export default async function PrereqPage(props: {
  params?: Promise<{ projectId?: string }>;
}) {
  const params = await props.params;

  const projectId = params?.projectId || "";
  const project = await getProjectById(projectId);
  if (!project) return <div className="p-6">Project not found</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Upload Prerequisites</h2>
      <p className="text-sm text-muted-foreground">
        Upload files required for project initialization.
      </p>

      <form
        action={async (formData: FormData) => {
          "use server";
          console.log("upload files", formData);
        }}
        className="mt-4"
      >
        <input type="file" name="prereqFiles" multiple />
        <div className="mt-4">
          <button type="submit" className="btn">
            Upload
          </button>
        </div>
      </form>
    </div>
  );
}
