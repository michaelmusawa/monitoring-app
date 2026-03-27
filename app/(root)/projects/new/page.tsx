// app/(root)/projects/new/page.tsx
import { auth } from "@/auth";
import CreateProjectClient from "@/components/projects/createProjectClient";
import { getUser } from "@/lib/actions/usersActions";

export default async function NewProjectPage(props: {
  searchParams?: Promise<{
    categoryId?: string;
    categoryName?: string;
    sector?: string;
  }>;
}) {
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userRole = user?.sector === "me" ? "me" : "sector";

  if (userRole !== "sector") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          You do not have permission to create a project.
        </h1>
      </div>
    );
  }
  const searchParams = await props.searchParams;

  return (
    <CreateProjectClient
      categoryId={searchParams?.categoryId}
      categoryName={searchParams?.categoryName}
      defaultSector={searchParams?.sector}
    />
  );
}
