"use client";

import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/format";
import type { NotificationApi } from "@/types/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Section = "today" | "yesterday" | "earlier";

function classify(iso: string): Section {
  const t = new Date(iso);
  const now = new Date();
  const sameDay =
    t.getFullYear() === now.getFullYear() &&
    t.getMonth() === now.getMonth() &&
    t.getDate() === now.getDate();
  if (sameDay) return "today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    t.getFullYear() === yesterday.getFullYear() &&
    t.getMonth() === yesterday.getMonth() &&
    t.getDate() === yesterday.getDate();
  return isYesterday ? "yesterday" : "earlier";
}

function describeAction(n: NotificationApi): string {
  const who = n.actor?.username ?? "누군가";
  switch (n.type) {
    case "friend_request":
      return `${who}님이 친구 요청을 보냈어요`;
    case "like":
      return `${who}님이 회원님의 글에 좋아요를 눌렀어요`;
    case "comment":
      return `${who}님이 회원님의 글에 댓글을 남겼어요`;
    case "group_invite":
      return `${who}님이 그룹에 초대했어요`;
    default:
      return "";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    api
      .get<NotificationApi[]>("/notifications", { signal: ac.signal })
      .then(setItems)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "알림 로드 실패");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [router]);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleAcceptFriend = async (notificationId: number, actorUserId: number) => {
    setActionPending(notificationId);
    try {
      await api.post(`/friends/accept`, { from_user_id: actorUserId });
      setItems((prev) => prev.filter((n) => n.notification_id !== notificationId));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "수락 실패");
    } finally {
      setActionPending(null);
    }
  };

  const handleRejectFriend = async (notificationId: number, actorUserId: number) => {
    setActionPending(notificationId);
    try {
      await api.post(`/friends/reject`, { from_user_id: actorUserId });
      setItems((prev) => prev.filter((n) => n.notification_id !== notificationId));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "거절 실패");
    } finally {
      setActionPending(null);
    }
  };

  const sections = useMemo(() => {
    const today: NotificationApi[] = [];
    const yesterday: NotificationApi[] = [];
    const earlier: NotificationApi[] = [];
    for (const n of items) {
      const s = classify(n.created_at);
      if (s === "today") today.push(n);
      else if (s === "yesterday") yesterday.push(n);
      else earlier.push(n);
    }
    return { today, yesterday, earlier };
  }, [items]);

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title="알림"
        leftAction="back"
        rightAction={
          hasUnread ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-brown"
            >
              모두 읽음
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <EmptyState icon="⚠️" title="알림 로드 실패" description={error} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="알림이 없어요"
            description="새로운 소식이 도착하면 여기에 표시돼요"
          />
        ) : (
          <>
            {sections.today.length > 0 && (
              <Section
                title="오늘"
                items={sections.today}
                actionPending={actionPending}
                onAccept={handleAcceptFriend}
                onReject={handleRejectFriend}
              />
            )}
            {sections.yesterday.length > 0 && (
              <Section
                title="어제"
                items={sections.yesterday}
                actionPending={actionPending}
                onAccept={handleAcceptFriend}
                onReject={handleRejectFriend}
              />
            )}
            {sections.earlier.length > 0 && (
              <Section
                title="이전"
                items={sections.earlier}
                actionPending={actionPending}
                onAccept={handleAcceptFriend}
                onReject={handleRejectFriend}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  actionPending,
  onAccept,
  onReject,
}: {
  title: string;
  items: NotificationApi[];
  actionPending: number | null;
  onAccept: (notificationId: number, actorUserId: number) => void;
  onReject: (notificationId: number, actorUserId: number) => void;
}) {
  return (
    <section>
      <h2 className="bg-surface px-4 py-2 text-xs font-semibold text-text-secondary">
        {title}
      </h2>
      <div className="divide-y divide-border">
        {items.map((n) => {
          const pending = actionPending === n.notification_id;
          return (
            <div
              key={n.notification_id}
              className={[
                "flex items-start gap-3 px-4 py-4",
                !n.is_read ? "bg-primary/5" : "",
              ].join(" ")}
            >
              <Avatar
                name={n.actor?.username ?? "?"}
                src={n.actor?.profile_image ?? undefined}
                size="sm"
              />
              <div className="flex-1">
                <p className="text-sm text-text-primary">{describeAction(n)}</p>
                <p className="mt-0.5 text-xs text-text-disabled">
                  {formatRelativeTime(n.created_at)}
                </p>
                {n.type === "friend_request" && n.actor?.user_id && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        onAccept(n.notification_id, n.actor?.user_id ?? 0)
                      }
                      className="rounded-lg bg-brown px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      수락
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        onReject(n.notification_id, n.actor?.user_id ?? 0)
                      }
                      className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary disabled:opacity-40"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
              {!n.is_read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
