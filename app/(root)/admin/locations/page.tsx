import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/usersActions";
import { fetchLocationTree } from "@/lib/actions/locationActions";
import LocationTree from "@/components/admin/LocationTree";

export default async function AdminLocationsPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  if (!session || user?.role !== "system admin") redirect("/");

  const tree = await fetchLocationTree();

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black">Location Hierarchy</h1>
            <p className="text-muted-foreground text-sm">
              Manage regions, counties, sub‑counties, wards, villages, etc.
            </p>
          </div>
        </div>
        <LocationTree initialTree={tree} />
      </div>
    </div>
  );
}
