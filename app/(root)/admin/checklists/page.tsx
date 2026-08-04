import { auth } from "@/auth";
import AdminChecklistsClient from "@/components/checklistTemplate/AdminChecklistsClient";
import { getUser } from "@/lib/actions/usersActions";
import { getUserPermissions } from "@/lib/actions/adminActions";
import { redirect } from "next/navigation";
import { getAllTemplates } from "@/lib/actions/templateActions";

export default async function AdminChecklistsPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  const permissions = await getUserPermissions(user?.id ?? "");

  // Permissions
  const hasFullAccess = permissions.some((p) =>
    ["template:manage_all"].includes(p),
  );
  const hasViewAccess = permissions.some((p) =>
    [
      "checklist:view",
      "checklist:edit",
      "checklist:manage",
      "admin:full",
      "template:manage_all",
      "checklist:view_all",
    ].includes(p),
  );
  const hasEditAccess = permissions.some((p) =>
    [
      "checklist:edit",
      "checklist:manage",
      "admin:full",
      "template:manage_all",
    ].includes(p),
  );

  console.log(hasFullAccess);

  if (!hasViewAccess) {
    redirect("/");
  }

  // Fetch all templates directly using a server action
  const allTemplates = await getAllTemplates();

  // Full access sees everything
  if (hasFullAccess) {
    return (
      <AdminChecklistsClient
        initialTemplates={allTemplates}
        userRole={user?.role ?? ""}
        userSector={user?.sector ?? ""}
        canEdit={hasEditAccess}
        isSystemAdmin={true} // or we could rename this prop, but for now keep it
      />
    );
  }

  // Sector‑level access – filter to template matching user's sector
  const sector = user?.sector ?? "";
  const sectorTemplate = Array.isArray(allTemplates)
    ? allTemplates.find((t: any) => t.name === sector)
    : null;

  const initialTemplates = sectorTemplate ? [sectorTemplate] : [];

  return (
    <AdminChecklistsClient
      initialTemplates={initialTemplates}
      userRole={user?.role ?? ""}
      userSector={sector}
      canEdit={hasEditAccess}
      isSystemAdmin={false}
    />
  );
}
