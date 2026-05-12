import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import { SAMPLE_NOTIFICATIONS } from "@/lib/mockData";

export default function NotificationsPage() {
  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="알림" leftAction="back" />

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {SAMPLE_NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className={[
              "flex items-start gap-3 px-4 py-4",
              !n.isRead ? "bg-primary/5" : "",
            ].join(" ")}
          >
            <Avatar name={n.actor.name} src={n.actor.avatar} size="sm" />
            <div className="flex-1">
              <p className="text-sm text-text-primary">
                <span className="font-semibold">{n.actor.name}</span>
                {n.content}
              </p>
              <p className="mt-0.5 text-xs text-text-disabled">{n.createdAt}</p>
            </div>
            {!n.isRead && (
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
