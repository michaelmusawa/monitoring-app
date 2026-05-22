"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, Trash2, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/actions/notificationActions";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  type: string;
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkRead = async (id: number) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    toast.success("Marked as read");
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const handleClick = (notif: Notification) => {
    if (!notif.isRead) handleMarkRead(notif.id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <div className="space-y-4">
      {notifications.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                !notif.isRead
                  ? "border-l-4 border-l-primary bg-primary/5"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
              onClick={() => handleClick(notif)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{notif.title}</h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                <div
                  className="flex gap-1 ml-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(notif.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
