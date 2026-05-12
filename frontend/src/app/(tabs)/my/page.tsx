"use client";

import ProfileHeader from "@/components/my/ProfileHeader";
import SettingsItem from "@/components/my/SettingsItem";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { SAMPLE_FRIENDS, SAMPLE_PINS, SAMPLE_POSTS } from "@/lib/mockData";
import Link from "next/link";

const ME = {
  name: "나",
  bio: "맛집 탐험가 🍜 서울 곳곳 숨은 맛집 발굴 중",
  avatar: undefined,
  stats: {
    posts: SAMPLE_POSTS.length,
    reviews: 12,
    scraps: 8,
    friends: SAMPLE_FRIENDS.filter((f) => f.status === "friend").length,
  },
};

export default function MyPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface">
      {/* 프로필 헤더 */}
      <ProfileHeader {...ME} />

      <div className="mt-2 flex flex-col gap-2">
        {/* 활동 */}
        <section className="bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-text-primary">내가 쓴 글</h2>
            <Link href="/my/activity" className="text-xs text-text-secondary">더보기</Link>
          </div>
          {SAMPLE_POSTS.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="block border-b border-border px-4 py-3 last:border-0 active:bg-surface"
            >
              <p className="text-sm font-medium text-text-primary line-clamp-1">
                {post.title ?? post.content}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">{post.restaurant.name} · {post.createdAt}</p>
            </Link>
          ))}
        </section>

        {/* 스크랩한 맛집 */}
        <section className="bg-white px-4">
          <div className="flex items-center justify-between border-b border-border py-3">
            <h2 className="text-sm font-bold text-text-primary">스크랩한 맛집</h2>
            <Link href="/my/activity" className="text-xs text-text-secondary">더보기</Link>
          </div>
          {SAMPLE_PINS.slice(0, 2).map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </section>

        {/* 설정 */}
        <section className="bg-white">
          <h2 className="border-b border-border px-4 py-3 text-sm font-bold text-text-primary">설정</h2>
          <SettingsItem icon="🔔" label="알림" href="/my/notifications" />
          <SettingsItem icon="⚙️" label="설정" href="/my/settings" />
          <SettingsItem icon="🚪" label="로그아웃" danger onClick={() => {}} />
        </section>
      </div>
    </div>
  );
}
