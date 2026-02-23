import { notFound } from "next/navigation";
import { getProject } from "@/lib/actions/projectActions";
import InitializeClient from "./InitializeClient";

export default async function InitializePage(props: {
  params?: Promise<{ projectId?: string }>;
}) {
  const params = await props.params;
  const projectId = params?.projectId || "";

  const project = await getProject(projectId);

  console.log("Project", project);
  if (!project) notFound();

  const isInitialized = project.status !== "PENDING";

  return <InitializeClient project={project} isInitialized={isInitialized} />;
}
