// app/projects/page.tsx
import { auth } from "@/auth";
import { projects as dummyProjects } from "@/lib/data/data";
import ProjectsPage from "@/components/projects/ProjectsPage";

const Page = async () => {
  const session = await auth();
  const userEmail = session?.user?.email || "";

  console.log("user email", userEmail);

  let projects;
  if (userEmail && userEmail === "sector@gmail.com") {
    projects = dummyProjects.filter((p) => p.sector === "IDE");
  } else {
    projects = dummyProjects;
  }

  // Pass dummy data as props
  return <ProjectsPage userEmail={userEmail} initialProjects={projects} />;
};

export default Page;
