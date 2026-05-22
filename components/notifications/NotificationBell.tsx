"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNotifications,
  markNotificationAsRead,
} from "@/lib/actions/notificationActions";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    const { notifications: notifs, totalUnread } = await getNotifications(5, 0);
    setNotifications(notifs);
    setUnreadCount(totalUnread);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: number) => {
    await markNotificationAsRead(id);
    loadNotifications();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          <Link
            href="/notifications"
            className="text-xs text-primary"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer border-b last:border-0"
                onClick={() => {
                  if (!n.isRead) handleMarkRead(n.id);
                  if (n.link) window.location.href = n.link;
                  setOpen(false);
                }}
              >
                <div className="flex justify-between w-full">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                {!n.isRead && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
