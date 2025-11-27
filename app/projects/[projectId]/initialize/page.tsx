// File: app/projects/[projectId]/initialize/page.tsx

import { getProjectById } from "@/lib/actions/actions";
import Link from "next/link";

export default async function InitializePage(props: {
  params?: { projectId?: string };
}) {
  const params = await props.params;

  const projectId = params?.projectId || "";
  const project = await getProjectById(projectId);

  if (!project) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Project not found
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Initialize Project</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Project: <span className="font-medium">{project.name}</span>
      </p>

      <form
        action={async (formData: FormData) => {
          "use server";

          // Prototype: log all form entries
          const entries = Object.fromEntries(formData.entries());
          console.log("Initialize form submitted", entries);

          // In a real app, call a server action to save initialization state
          return { ok: true };
        }}
        className="space-y-6"
      >
        {/* Prerequisite Checklist */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Prerequisite Checklist</h2>
          <div className="space-y-2">
            {project.prerequisites.map((prereq) => (
              <div key={prereq} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`prereq_${prereq}`}
                  name={`prereq_${prereq}`}
                  className="checkbox"
                />
                <label htmlFor={`prereq_${prereq}`} className="select-none">
                  {prereq}
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* File Upload */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Upload Documents</h2>
          <p className="text-sm text-muted-foreground mb-1">
            Upload any supporting files for the prerequisites.
          </p>
          <input
            type="file"
            name="files"
            multiple
            className="file-input w-full"
          />
        </section>

        {/* Submit Button */}
        <div className="flex justify-start mt-4">
          {/* <button type="submit" className="btn btn-primary">
            Initialize Project
          </button> */}
          <Link href={"/projects/p1"}>Initialize</Link>
        </div>
      </form>
    </div>
  );
}
