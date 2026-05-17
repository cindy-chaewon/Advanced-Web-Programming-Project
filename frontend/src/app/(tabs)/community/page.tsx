"use client";

import PostCard from "@/components/community/PostCard";
import TabBar from "@/components/layout/TabBar";
import EmptyState from "@/components/ui/EmptyState";
import { SAMPLE_POSTS } from "@/lib/mockData";
import Link from "next/link";
import { useState, useRef } from "react";

const TABS = [
  { key: "popular", label: "인기" },
  { key: "nearby", label: "내주변" },
  { key: "latest", label: "최신" },
];

function PencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("popular");

  // 🌟 드롭다운 필터 상태
  const [filterType, setFilterType] = useState("all"); // 리뷰 형태 (간단/블로그)
  const [ratingFilter, setRatingFilter] = useState("all"); // 평점 (5/4/3/2/1)

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

  // 🌟 1. 다중 필터 적용 (리뷰 형태 + 평점)
  const filteredPosts = SAMPLE_POSTS.filter((post) => {
    // 형태 필터
    if (filterType === "simple" && post.type !== "simple") return false;
    if (filterType === "blog" && post.type === "simple") return false;

    // 평점 필터 (소수점은 내림 처리하여 4.5점도 '4점' 대역으로 인식)
    if (ratingFilter !== "all") {
      const postRating = post.rating ?? 0;
      if (Math.floor(postRating) !== parseInt(ratingFilter)) return false;
    }

    return true; // 모든 조건을 통과하면 화면에 표시
  });

  // 2. 탭(인기/최신 등) 정렬
  const sortedPosts =
    activeTab === "popular"
      ? [...filteredPosts].sort((a, b) => b.likeCount - a.likeCount)
      : activeTab === "latest"
        ? [...filteredPosts].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          )
        : filteredPosts;

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden">
      {/* 상단 고정 영역 */}
      <div className="z-20 shrink-0 bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h1 className="text-lg font-bold text-text-primary">커뮤니티</h1>
          <Link href="/community/write">
            <PencilIcon />
          </Link>
        </div>
        <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
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
          onChange={(e) => setFilterType(e.target.value)}
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
        {sortedPosts.length > 0 ? (
          <div className="flex flex-col gap-5">
            {sortedPosts.map((post) => (
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
    </div>
  );
}
