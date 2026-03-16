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
  const searchParams = await props.searchParams;

  return (
    <CreateProjectClient
      categoryId={searchParams?.categoryId}
      categoryName={searchParams?.categoryName}
      defaultSector={searchParams?.sector}
    />
  );
}
