import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/usersActions";
import { fetchUnitTree } from "@/lib/actions/orgActions";
import OrganisationTree from "@/components/admin/OrganisationTree";
import { AddUnitButton } from "@/components/admin/AddUnitButton";

export default async function AdminOrganisationPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  // if (!session || user?.role !== "system admin") redirect("/");

  const tree = await fetchUnitTree();

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black">Organisational Structure</h1>
            <p className="text-muted-foreground text-sm">
              Manage sectors, sub‑sectors, departments and units
            </p>
          </div>
          <AddUnitButton />
        </div>
        <OrganisationTree initialTree={tree} />
      </div>
    </div>
  );
}
