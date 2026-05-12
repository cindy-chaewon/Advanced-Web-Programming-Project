"use client";

import PostCard from "@/components/community/PostCard";
import TabBar from "@/components/layout/TabBar";
import EmptyState from "@/components/ui/EmptyState";
import { SAMPLE_POSTS } from "@/lib/mockData";
import Link from "next/link";
import { useState } from "react";

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

  const sortedPosts =
    activeTab === "popular"
      ? [...SAMPLE_POSTS].sort((a, b) => b.likeCount - a.likeCount)
      : activeTab === "latest"
        ? [...SAMPLE_POSTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : SAMPLE_POSTS;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h1 className="text-lg font-bold text-text-primary">커뮤니티</h1>
        <Link href="/community/write">
          <PencilIcon />
        </Link>
      </div>

      {/* 탭 */}
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {/* 피드 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sortedPosts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sortedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📝"
            title="아직 게시물이 없어요"
            description="첫 번째 리뷰를 남겨보세요!"
          />
        )}
      </div>
    </div>
  );
}
