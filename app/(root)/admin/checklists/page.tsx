import { auth } from "@/auth";
import AdminChecklistsClient from "@/components/checklistTemplate/AdminChecklistsClient";
import { getUser } from "@/lib/actions/usersActions";
import { redirect } from "next/navigation";

export default async function AdminChecklistsPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");

  const role = user?.role || "";
  const sector = user?.sector || "";

  // const hasAccess = (role: string) => ["system admin", "admin"].includes(role);

  // if (!user || !hasAccess(role)) {
  //   redirect("/");
  // }

  // Fetch all templates from the API (server‑side)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/admin/checklists`, {
    cache: "no-store",
  });
  const allTemplates = res.ok ? await res.json() : [];

  // System admin sees everything
  if (role === "system admin") {
    return (
      <AdminChecklistsClient
        initialTemplates={allTemplates}
        userRole={role}
        userSector={sector}
        canEdit={true}
        isSystemAdmin={true}
      />
    );
  }

  // Admin (sector‑based) – filter to template whose name matches sector
  const sectorTemplate = Array.isArray(allTemplates)
    ? allTemplates.find((t: any) => t.name === sector)
    : null;

  const initialTemplates = sectorTemplate ? [sectorTemplate] : [];

  return (
    <AdminChecklistsClient
      initialTemplates={initialTemplates}
      userRole={role}
      userSector={sector}
      canEdit={true}
      isSystemAdmin={false}
    />
  );
}
