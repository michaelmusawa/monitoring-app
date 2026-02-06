// app/(root)/projects/page.tsx

import { auth } from "@/auth";
import { projects as dummyProjects, checklists } from "@/lib/data/data";
import ProjectsPage from "@/components/projects/ProjectsPage";

const Page = async () => {
  const session = await auth();
  const userEmail = session?.user?.email || "";

  let projects;
  if (userEmail && userEmail === "ide@gmail.com") {
    projects = dummyProjects.filter((p) => p.sector === "IDE");
  } else if (userEmail && userEmail === "mw@gmail.com") {
    projects = dummyProjects.filter((p) => p.sector === "Mobility & Works");
  } else {
    projects = dummyProjects;
  }

  // Pass dummy data as props
  return (
    <ProjectsPage
      userEmail={userEmail}
      initialProjects={projects}
      initialChecklists={checklists}
    />
  );
};

export default Page;
