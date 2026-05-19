"use client";

import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

interface FriendProps {
  friend: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    status: string;
    pinColor?: string;
    restaurantCount?: number;
  };
  variant: "friend" | "request" | "search";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  actionPending?: boolean;
}

export default function FriendItem({
  friend,
  variant,
  onAccept,
  onReject,
  actionPending,
}: FriendProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <Link
        href={`/friends/${friend.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-70"
      >
        <div className="relative">
          <Avatar name={friend.name} src={friend.avatar} size="md" />
          {friend.pinColor && variant === "friend" && (
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
              style={{ backgroundColor: friend.pinColor }}
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">
            {friend.name}
          </p>
          <p className="truncate text-xs text-text-disabled">
            @{friend.username ?? friend.name}
            {friend.restaurantCount !== undefined && friend.restaurantCount > 0 && (
              <span className="ml-1">· 맛집 {friend.restaurantCount}곳</span>
            )}
          </p>
        </div>
      </Link>

      {variant === "request" && (
        <div className="ml-4 flex shrink-0 gap-2">
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onReject?.(friend.id)}
            className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary disabled:opacity-40 active:opacity-70"
          >
            거절
          </button>
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onAccept?.(friend.id)}
            className="rounded-lg bg-brown px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 active:opacity-70"
          >
            수락
          </button>
        </div>
      )}
    </div>
  );
}
