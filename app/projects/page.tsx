import { auth } from "@/auth";
import ProjectsPage from "@/components/projects/ProjectsPage";

const Page = async () => {
  const session = await auth();
  const userEmail = session?.user?.name || "";
  return (
    <div>
      <ProjectsPage userEmail={userEmail} />
    </div>
  );
};

export default Page;
