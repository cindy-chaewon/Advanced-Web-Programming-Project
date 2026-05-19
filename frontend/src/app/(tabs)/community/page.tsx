"use client";

import PostCard from "@/components/community/PostCard";
import TabBar from "@/components/layout/TabBar";
import EmptyState from "@/components/ui/EmptyState";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import { ApiError, api } from "@/lib/api";
import type { Post } from "@/lib/mockData";
import type { PostBriefApi } from "@/types/api";
import { toPost } from "@/types/api";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const FALLBACK_CENTER = { lat: 37.4516, lng: 127.1306 };

const TABS = [
  { key: "popular", label: "인기" },
  { key: "nearby", label: "내주변" },
  { key: "latest", label: "최신" },
];

function PencilIcon({ size = 22, color = "#1a1a1a" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="#1a1a1a" strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#1a1a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"popular" | "nearby" | "latest">("popular");
  const [filterType, setFilterType] = useState<"all" | "simple" | "blog">("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 20) {
      setIsFilterVisible(false);
    } else if (currentScrollY < lastScrollY.current) {
      setIsFilterVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  // 서버 호출: sort + type 필터 변경 시 fetch
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setLoadError(null);

    const query: Record<string, string | number> = {
      sort: activeTab,
      limit: 50,
    };
    if (filterType !== "all") query.type = filterType;
    if (activeTab === "nearby") {
      query.lat = FALLBACK_CENTER.lat;
      query.lng = FALLBACK_CENTER.lng;
      query.radius = 2000;
    }

    api
      .get<PostBriefApi[]>("/posts", { query, auth: false, signal: ac.signal })
      .then((data) => setPosts(data.map(toPost)))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadError(err instanceof ApiError ? err.message : "글을 불러오지 못했어요");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [activeTab, filterType]);

  // 클라이언트 측: 평점 필터만 (서버에는 endpoint 없음)
  const displayedPosts =
    ratingFilter === "all"
      ? posts
      : posts.filter((p) => Math.floor(p.rating ?? 0) === Number.parseInt(ratingFilter, 10));

  return (
    <div className="relative flex h-full flex-col bg-white overflow-hidden">
      {/* 상단 고정 영역 */}
      <div className="z-20 shrink-0 bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h1 className="text-lg font-bold text-text-primary">커뮤니티</h1>
          <div className="flex items-center gap-3">
            <Link href="/search" aria-label="검색">
              <SearchIcon />
            </Link>
            <Link href="/my/notifications" aria-label="알림">
              <BellIcon />
            </Link>
          </div>
        </div>
        <TabBar
          tabs={TABS}
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as "popular" | "nearby" | "latest")}
        />
      </div>

      {/* 🌟 드롭다운 필터 바 (gap-2를 주어 버튼을 나란히 배치) */}
      <div
        className={`z-10 flex shrink-0 items-center gap-2 bg-surface px-4 transition-all duration-300 ease-in-out ${
          isFilterVisible
            ? "h-12 border-b border-border opacity-100"
            : "h-0 opacity-0 overflow-hidden"
        }`}
      >
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | "simple" | "blog")}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-primary outline-none focus:border-brown cursor-pointer"
        >
          <option value="all">모든 리뷰</option>
          <option value="simple">간단 리뷰만</option>
          <option value="blog">블로그 리뷰만</option>
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-primary outline-none focus:border-brown cursor-pointer"
        >
          <option value="all">모든 평점</option>
          <option value="5">★ 5점</option>
          <option value="4">★ 4점</option>
          <option value="3">★ 3점</option>
          <option value="2">★ 2점</option>
          <option value="1">★ 1점</option>
        </select>
      </div>

      {/* 피드 영역 */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 bg-surface"
        onScroll={handleScroll}
      >
        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon="⚠️"
              title="글을 불러오지 못했어요"
              description={loadError}
            />
          </div>
        ) : loading && displayedPosts.length === 0 ? (
          <div className="flex flex-col gap-5">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : displayedPosts.length > 0 ? (
          <div className="flex flex-col gap-5">
            {displayedPosts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-2 bg-white p-4 border border-border rounded-2xl shadow-sm"
              >
                <div className="flex">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      post.type === "simple"
                        ? "bg-primary/10 text-brown"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {post.type === "simple" ? "📝 간단 리뷰" : "📓 블로그 리뷰"}
                  </span>
                </div>

                <PostCard post={post} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              icon="📝"
              title="조건에 맞는 게시물이 없어요"
              description="다른 평점이나 필터를 선택해 보세요!"
            />
          </div>
        )}
      </div>

      {/* 작성 FAB (우하단) */}
      <Link
        href="/community/write"
        aria-label="글 작성"
        className="absolute bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-95"
      >
        <PencilIcon size={24} color="#1a1a1a" />
      </Link>
    </div>
  );
}
