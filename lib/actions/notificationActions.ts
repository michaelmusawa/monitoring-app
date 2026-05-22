"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { safeQuery } from "@/lib/db";

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
  const session = await auth();
  if (!session?.user?.id)
    return { notifications: [], totalUnread: 0, totalCount: 0 };

  const userId = session.user.id;

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
  const session = await auth();
  if (!session?.user?.id) return;
  await safeQuery(
    `UPDATE Notification SET isRead = 1 WHERE id = @p1 AND userId = @p2`,
    [notificationId, session.user.id],
  );
  revalidatePath("/notifications");
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  await safeQuery(
    `UPDATE Notification SET isRead = 1 WHERE userId = @p1 AND isRead = 0`,
    [session.user.id],
  );
  revalidatePath("/notifications");
}

export async function deleteNotification(notificationId: number) {
  const session = await auth();
  if (!session?.user?.id) return;
  await safeQuery(`DELETE FROM Notification WHERE id = @p1 AND userId = @p2`, [
    notificationId,
    session.user.id,
  ]);
  revalidatePath("/notifications");
}
