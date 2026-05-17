"use client";

import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

interface FriendProps {
  friend: {
    id: string;
    name: string;
    avatar?: string;
    status: string;
  };
  variant: "friend" | "request";
}

export default function FriendItem({ friend, variant }: FriendProps) {
  return (
    <div className="flex items-center justify-between py-3">
      {/* 🌟 핵심 포인트: 프로필 사진과 이름을 Link로 감싸서 클릭 가능하게 만듭니다 */}
      <Link
        href={`/friends/${friend.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-70"
      >
        <Avatar name={friend.name} src={friend.avatar} size="md" />
        <span className="truncate text-sm font-medium text-text-primary">
          {friend.name}
        </span>
      </Link>

      {/* 친구 요청 탭에서만 보이는 수락/거절 버튼 */}
      {variant === "request" && (
        <div className="ml-4 flex shrink-0 gap-2">
          <button className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary active:opacity-70">
            거절
          </button>
          <button className="rounded-lg bg-brown px-3 py-1.5 text-xs font-semibold text-white active:opacity-70">
            수락
          </button>
        </div>
      )}
    </div>
  );
}
