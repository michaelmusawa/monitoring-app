import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/lib/actions/notificationActions";
import NotificationsClient from "@/components/notifications/NotificationsClient";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { notifications, totalUnread, totalCount } = await getNotifications(
    50,
    0,
  );

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black mb-2">Notifications</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {totalUnread} unread · {totalCount} total
        </p>
        <NotificationsClient initialNotifications={notifications} />
      </div>
    </div>
  );
}
