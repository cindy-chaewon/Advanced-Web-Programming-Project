"use client";

import PostCard from "@/components/community/PostCard";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { ApiError, api } from "@/lib/api";
import type { Post, RestaurantPin } from "@/lib/mockData";
import type { PostBriefApi, RestaurantBriefApi } from "@/types/api";
import { toPost, toRestaurantPin } from "@/types/api";
import { use, useEffect, useState } from "react";

const TABS = [
  { key: "restaurants", label: "맛집" },
  { key: "posts", label: "블로그 글" },
];

export default function HashtagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = use(params);
  const decodedTag = decodeURIComponent(tag);

  const [activeTab, setActiveTab] = useState<"restaurants" | "posts">("restaurants");
  const [restaurants, setRestaurants] = useState<RestaurantPin[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      api.get<RestaurantBriefApi[]>(
        `/hashtags/${encodeURIComponent(decodedTag)}/restaurants`,
        { auth: false, signal: ac.signal, query: { limit: 50 } },
      ),
      api.get<PostBriefApi[]>(`/hashtags/${encodeURIComponent(decodedTag)}/posts`, {
        auth: false,
        signal: ac.signal,
        query: { limit: 50 },
      }),
    ])
      .then(([rs, ps]) => {
        setRestaurants(rs.map(toRestaurantPin));
        setPosts(ps.map(toPost));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "해시태그를 불러오지 못했어요");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [decodedTag]);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="해시태그" leftAction="back" />

      <div className="bg-primary px-4 py-5">
        <h1 className="text-2xl font-bold text-text-primary">#{decodedTag}</h1>
        <p className="mt-1 text-sm text-brown">
          맛집 {restaurants.length}곳 · 글 {posts.length}개
        </p>
      </div>

      <TabBar
        tabs={[
          { key: "restaurants", label: `맛집 ${restaurants.length}` },
          { key: "posts", label: `블로그 글 ${posts.length}` },
        ]}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as "restaurants" | "posts")}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="px-4 py-10 text-center text-sm text-text-secondary">{error}</p>
        ) : activeTab === "restaurants" ? (
          <div className="divide-y divide-border px-4">
            {restaurants.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                #{decodedTag} 태그가 달린 맛집이 없어요
              </p>
            ) : (
              restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 py-4">
            {posts.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                #{decodedTag} 태그가 달린 글이 없어요
              </p>
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
