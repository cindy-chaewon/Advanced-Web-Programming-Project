"use client";

import PostCard from "@/components/community/PostCard";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import type { Post, RestaurantPin } from "@/lib/mockData";
import type { PostBriefApi, RestaurantBriefApi } from "@/types/api";
import { toPost, toRestaurantPin } from "@/types/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const TABS = [
  { key: "reviews", label: "간단 리뷰" },
  { key: "posts", label: "맛집 블로그" },
  { key: "scraps", label: "스크랩" },
];

function ActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "reviews" | "posts" | "scraps") ?? "reviews";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [scraps, setScraps] = useState<RestaurantPin[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    Promise.all([
      api.get<PostBriefApi[]>("/users/me/posts", {
        query: { limit: 100 },
        signal: ac.signal,
      }),
      api.get<RestaurantBriefApi[]>("/users/me/scraps", {
        query: { limit: 100 },
        signal: ac.signal,
      }),
    ])
      .then(([ps, ss]) => {
        setAllPosts(ps.map(toPost));
        setScraps(ss.map(toRestaurantPin));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "불러오기 실패");
      });
    return () => ac.abort();
  }, [router]);

  const simpleReviews = allPosts.filter((p) => p.type === "simple");
  const blogPosts = allPosts.filter((p) => p.type !== "simple");

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="나의 활동" leftAction="back" />
      <TabBar
        tabs={TABS}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as "reviews" | "posts" | "scraps")}
      />

      <div className="flex-1 overflow-y-auto">
        {error && (
          <p className="px-4 py-6 text-center text-sm text-text-secondary">{error}</p>
        )}
        {activeTab === "reviews" && (
          <div className="flex flex-col gap-4 px-4 py-3">
            {simpleReviews.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                작성한 간단 리뷰가 없어요
              </p>
            ) : (
              simpleReviews.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4 px-4 py-3">
            {blogPosts.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                작성한 블로그가 없어요
              </p>
            ) : (
              blogPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}
        {activeTab === "scraps" && (
          <div className="px-4 py-3">
            {scraps.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                스크랩한 맛집이 없어요
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs text-text-secondary">
                  총 <span className="font-semibold text-text-primary">{scraps.length}</span>개
                  스크랩
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {scraps.map((r) => (
                    <a
                      key={r.id}
                      href={`/restaurants/${r.id}`}
                      className="overflow-hidden rounded-2xl border border-border bg-white transition-opacity active:opacity-70"
                    >
                      <div className="relative flex aspect-square items-center justify-center bg-surface text-4xl">
                        🍽️
                        <span className="absolute right-2 top-2 text-base">🔖</span>
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {r.name}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          ★ {(r.rating ?? 0).toFixed(1)} · {r.category}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyActivityPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">불러오는 중...</div>}>
      <ActivityContent />
    </Suspense>
  );
}
