"use client";

import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import type { NotificationOut } from "@/lib/api";
import { timeAgo } from "@/lib/api";
import { useEffect, useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  friend_request: "님이 친구 요청을 보냈어요",
  like: "님이 회원님의 글을 좋아해요",
  comment: "님이 댓글을 남겼어요",
  group_invite: "님이 그룹에 초대했어요",
  mention: "님이 회원님을 언급했어요",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleMarkOne = async (id: number) => {
    await markNotificationRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)),
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="알림" leftAction="back" rightAction={
        <button
          type="button"
          onClick={handleMarkAll}
          className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary whitespace-nowrap transition-colors active:bg-gray-200"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          모두 읽음
        </button>
      } />

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-text-secondary">
              알림이 없어요
            </div>
          ) : notifications.map((n) => (
            <button
              key={n.notification_id}
              type="button"
              onClick={() => handleMarkOne(n.notification_id)}
              className={[
                "flex w-full items-start gap-3 px-4 py-4 text-left",
                !n.is_read ? "bg-primary/5" : "",
              ].join(" ")}
            >
              <Avatar
                name={n.actor?.username ?? "?"}
                src={n.actor?.profile_image ?? undefined}
                size="sm"
              />
              <div className="flex-1">
                <p className="text-sm text-text-primary">
                  <span className="font-semibold">{n.actor?.username ?? ""}</span>
                  {TYPE_LABEL[n.type] ?? ""}
                </p>
                <p className="mt-0.5 text-xs text-text-disabled">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
