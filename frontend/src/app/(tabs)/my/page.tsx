"use client";

import ProfileHeader from "@/components/my/ProfileHeader";
import SettingsItem from "@/components/my/SettingsItem";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { SAMPLE_FRIENDS, SAMPLE_PINS, SAMPLE_POSTS } from "@/lib/mockData";
import Link from "next/link";

const ME = {
  name: "(닉네임)",
  bio: "(내 한마디 작성, 혹은 칭호)",
  avatar: undefined,
  stats: {
    posts: SAMPLE_POSTS.length,
    reviews: 12,
    scraps: 8,
    friends: SAMPLE_FRIENDS.filter((f) => f.status === "friend").length,
  },
};

export default function MyPage() {
  const simpleReviews = SAMPLE_POSTS.filter((p) => p.type === "simple");
  const blogPosts = SAMPLE_POSTS.filter((p) => p.type !== "simple");

  const scrollToSettings = () => {
    const settingsSection = document.getElementById("settings-section");
    if (settingsSection) {
      settingsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface">
      {/* 🌟 프로필과 퀵 메뉴를 하나의 시각적 그룹으로 묶기 위해 상단 패딩(pt)을 줄였습니다 */}
      <div className="bg-white shadow-sm mb-2">
        <ProfileHeader {...ME} />

        <div className="grid grid-cols-4 gap-2 px-4 pb-10 pt-2">
          <Link
            href="/my/activity?tab=reviews"
            className="flex flex-col items-center gap-2 transition-opacity active:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
              📝
            </div>
            <span className="text-xs font-bold text-text-primary">
              간단 리뷰
            </span>
          </Link>

          <Link
            href="/my/activity?tab=posts"
            className="flex flex-col items-center gap-2 transition-opacity active:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
              📓
            </div>
            <span className="text-xs font-bold text-text-primary">
              내 블로그
            </span>
          </Link>

          <Link
            href="/my/activity?tab=scraps"
            className="flex flex-col items-center gap-2 transition-opacity active:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
              🔖
            </div>
            <span className="text-xs font-bold text-text-primary">스크랩</span>
          </Link>

          <button
            onClick={scrollToSettings}
            className="flex flex-col items-center gap-2 transition-opacity active:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-xl">
              ⚙️
            </div>
            <span className="text-xs font-bold text-text-primary">설정</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 pb-10">
        {/* 1. 내가 쓴 간단 리뷰 */}
        <section className="bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-text-primary">
              내가 쓴 간단 리뷰
            </h2>
            <Link
              href="/my/activity?tab=reviews"
              className="text-xs text-text-secondary"
            >
              더보기
            </Link>
          </div>
          {simpleReviews.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 active:bg-surface"
            >
              <div className="mt-0.5 flex shrink-0 items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-bold text-brown">
                ★ {post.rating ?? 0}
              </div>

              {/* 우측 텍스트 정보 */}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-text-primary line-clamp-1">
                  {post.title ?? post.content}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {post.restaurant.name} · {post.createdAt}
                </p>
              </div>
            </Link>
          ))}
        </section>

        {/* 2. 내가 쓴 맛집 블로그 */}
        <section className="bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-text-primary">
              내가 쓴 맛집 블로그
            </h2>
            <Link
              href="/my/activity?tab=posts"
              className="text-xs text-text-secondary"
            >
              더보기
            </Link>
          </div>
          {blogPosts.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 active:bg-surface"
            >
              <div className="mt-0.5 flex shrink-0 items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-bold text-brown">
                ★ {post.rating ?? 0}
              </div>

              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-text-primary line-clamp-1">
                  {post.title ?? post.content}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {post.restaurant.name} · {post.createdAt}
                </p>
              </div>
            </Link>
          ))}
        </section>

        {/* 3. 스크랩한 맛집 */}
        <section className="bg-white px-4">
          <div className="flex items-center justify-between border-b border-border py-3">
            <h2 className="text-sm font-bold text-text-primary">
              스크랩한 맛집
            </h2>
            <Link
              href="/my/activity?tab=scraps"
              className="text-xs text-text-secondary"
            >
              더보기
            </Link>
          </div>
          {SAMPLE_PINS.slice(0, 2).map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </section>

        {/* 4. 설정 (id="settings-section" 부여) */}
        <section id="settings-section" className="bg-white">
          <h2 className="border-b border-border px-4 py-3 text-sm font-bold text-text-primary">
            설정
          </h2>
          <SettingsItem icon="⚙️" label="설정" href="/my/settings" />
          <SettingsItem icon="🚪" label="로그아웃" danger onClick={() => {}} />
        </section>
      </div>
    </div>
  );
}
