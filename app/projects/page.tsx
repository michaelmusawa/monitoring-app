// app/projects/page.tsx
import { auth } from "@/auth";
import { projects as dummyProjects } from "@/lib/data/data";
import ProjectsPage from "@/components/projects/ProjectsPage";

const Page = async () => {
  const session = await auth();
  const userEmail = session?.user?.name || "";

  // Pass dummy data as props
  return <ProjectsPage userEmail={userEmail} initialProjects={dummyProjects} />;
};

export default Page;
