"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { safeQuery } from "@/lib/db";

// Helper to get userId from email
async function getUserIdFromSession(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  // Try to get from session.user.id first
  if (session.user.id) return session.user.id;

  // Otherwise look up by email
  const { rows } = await safeQuery<{ id: string }>(
    `SELECT id FROM [User] WHERE email = @p1`,
    [session.user.email],
  );
  return rows[0]?.id || null;
}

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}) {
  await safeQuery(
    `INSERT INTO Notification (userId, type, title, message, link, metadata)
     VALUES (@p1, @p2, @p3, @p4, @p5, @p6)`,
    [
      data.userId,
      data.type,
      data.title,
      data.message,
      data.link ?? null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ],
  );
}

export async function getNotifications(limit = 20, offset = 0) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    console.warn("No user ID found; returning empty notifications");
    return { notifications: [], totalUnread: 0, totalCount: 0 };
  }

  // Get unread count
  const { rows: unreadRows } = await safeQuery<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM Notification WHERE userId = @p1 AND isRead = 0`,
    [userId],
  );
  const totalUnread = unreadRows[0]?.cnt ?? 0;

  // Get paginated notifications
  const { rows } = await safeQuery<any>(
    `SELECT id, type, title, message, link, isRead, createdAt, metadata
     FROM Notification
     WHERE userId = @p1
     ORDER BY createdAt DESC
     OFFSET @p2 ROWS FETCH NEXT @p3 ROWS ONLY`,
    [userId, offset, limit],
  );

  const { rows: countRows } = await safeQuery<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM Notification WHERE userId = @p1`,
    [userId],
  );
  const totalCount = countRows[0]?.cnt ?? 0;

  return {
    notifications: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      link: r.link,
      isRead: r.isRead,
      createdAt: r.createdAt.toISOString(),
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
    })),
    totalUnread,
    totalCount,
  };
}

export async function markNotificationAsRead(notificationId: number) {
  const userId = await getUserIdFromSession();
  if (!userId) return;
  await safeQuery(
    `UPDATE Notification SET isRead = 1 WHERE id = @p1 AND userId = @p2`,
    [notificationId, userId],
  );
  revalidatePath("/notifications");
}

export async function markAllNotificationsAsRead() {
  const userId = await getUserIdFromSession();
  if (!userId) return;
  await safeQuery(
    `UPDATE Notification SET isRead = 1 WHERE userId = @p1 AND isRead = 0`,
    [userId],
  );
  revalidatePath("/notifications");
}

export async function deleteNotification(notificationId: number) {
  const userId = await getUserIdFromSession();
  if (!userId) return;
  await safeQuery(`DELETE FROM Notification WHERE id = @p1 AND userId = @p2`, [
    notificationId,
    userId,
  ]);
  revalidatePath("/notifications");
}
