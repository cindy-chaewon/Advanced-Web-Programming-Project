"use client";

import ProfileHeader from "@/components/my/ProfileHeader";
import SettingsItem from "@/components/my/SettingsItem";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn, logout } from "@/lib/auth";
import type { Post, RestaurantPin } from "@/lib/mockData";
import type { PostBriefApi, RestaurantBriefApi } from "@/types/api";
import { toPost, toRestaurantPin } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MeResponse = {
  user_id: number;
  username: string;
  profile_image?: string | null;
  bio?: string | null;
  points?: number;
  level?: number;
};

type MeStats = {
  post_count: number;
  review_count: number;
  scrap_count: number;
  friend_count: number;
};

export default function MyPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<MeStats>({
    post_count: 0,
    review_count: 0,
    scrap_count: 0,
    friend_count: 0,
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [scraps, setScraps] = useState<RestaurantPin[]>([]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    Promise.all([
      api.get<MeResponse>("/users/me", { signal: ac.signal }),
      api.get<MeStats>("/users/me/stats", { signal: ac.signal }),
      api.get<PostBriefApi[]>("/users/me/posts", {
        query: { limit: 10 },
        signal: ac.signal,
      }),
      api.get<RestaurantBriefApi[]>("/users/me/scraps", {
        query: { limit: 10 },
        signal: ac.signal,
      }),
    ])
      .then(([u, s, ps, ss]) => {
        setMe(u);
        setStats(s);
        setPosts(ps.map(toPost));
        setScraps(ss.map(toRestaurantPin));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
        }
      });
    return () => ac.abort();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    logout();
    router.replace("/login");
  };

  const scrollToSettings = () => {
    document.getElementById("settings-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const simpleReviews = posts.filter((p) => p.type === "simple");
  const blogPosts = posts.filter((p) => p.type !== "simple");

  if (!me) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface">
      <div className="bg-white shadow-sm mb-2">
        <ProfileHeader
          name={me.username}
          bio={me.bio ?? undefined}
          avatar={me.profile_image ?? undefined}
          level={me.level}
          points={me.points}
          stats={{
            posts: stats.post_count,
            reviews: stats.review_count,
            scraps: stats.scrap_count,
            friends: stats.friend_count,
          }}
        />

        <div className="grid grid-cols-4 gap-2 px-4 pb-10 pt-2">
          <Link
            href="/my/activity?tab=reviews"
            className="flex flex-col items-center gap-2 transition-opacity active:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
              📝
            </div>
            <span className="text-xs font-bold text-text-primary">간단 리뷰</span>
          </Link>

          <Link
            href="/my/activity?tab=posts"
            className="flex flex-col items-center gap-2 transition-opacity active:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
              📓
            </div>
            <span className="text-xs font-bold text-text-primary">내 블로그</span>
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
            type="button"
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
        <section className="bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-text-primary">내가 쓴 간단 리뷰</h2>
            <Link href="/my/activity?tab=reviews" className="text-xs text-text-secondary">
              더보기
            </Link>
          </div>
          {simpleReviews.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-text-secondary">
              아직 작성한 간단 리뷰가 없어요
            </p>
          ) : (
            simpleReviews.slice(0, 2).map((post) => (
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
            ))
          )}
        </section>

        <section className="bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-text-primary">내가 쓴 맛집 블로그</h2>
            <Link href="/my/activity?tab=posts" className="text-xs text-text-secondary">
              더보기
            </Link>
          </div>
          {blogPosts.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-text-secondary">
              아직 작성한 블로그가 없어요
            </p>
          ) : (
            blogPosts.slice(0, 2).map((post) => (
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
            ))
          )}
        </section>

        <section className="bg-white px-4">
          <div className="flex items-center justify-between border-b border-border py-3">
            <h2 className="text-sm font-bold text-text-primary">스크랩한 맛집</h2>
            <Link href="/my/activity?tab=scraps" className="text-xs text-text-secondary">
              더보기
            </Link>
          </div>
          {scraps.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-secondary">
              스크랩한 맛집이 없어요
            </p>
          ) : (
            scraps.slice(0, 2).map((r) => <RestaurantCard key={r.id} restaurant={r} />)
          )}
        </section>

        <section id="settings-section" className="bg-white">
          <h2 className="border-b border-border px-4 py-3 text-sm font-bold text-text-primary">
            설정
          </h2>
          <SettingsItem icon="⚙️" label="설정" href="/my/settings" />
          <SettingsItem icon="🚪" label="로그아웃" danger onClick={handleLogout} />
        </section>
      </div>
    </div>
  );
}
