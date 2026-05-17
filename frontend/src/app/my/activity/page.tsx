"use client";

import TabBar from "@/components/layout/TabBar";
import PageHeader from "@/components/layout/PageHeader";
import PostCard from "@/components/community/PostCard";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { SAMPLE_PINS, SAMPLE_POSTS } from "@/lib/mockData";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 탭 이름도 마이페이지와 통일감 있게 수정했습니다.
const TABS = [
  { key: "reviews", label: "간단 리뷰" },
  { key: "posts", label: "맛집 블로그" },
  { key: "scraps", label: "스크랩" },
];

function ActivityContent() {
  // URL에서 ?tab= 값을 읽어옵니다.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "reviews"; // 전달된 값이 없으면 기본값은 reviews

  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="나의 활동" leftAction="back" />
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {activeTab === "reviews" && (
          <div className="flex flex-col gap-4 px-4 py-3">
            {SAMPLE_POSTS.filter((p) => p.type === "simple").map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4 px-4 py-3">
            {/* 블로그는 simple 타입이 아닌 글들을 보여줍니다 */}
            {SAMPLE_POSTS.filter((p) => p.type !== "simple").map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        {activeTab === "scraps" && (
          <div className="divide-y divide-border px-4">
            {SAMPLE_PINS.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Next.js에서 useSearchParams를 안전하게 사용하기 위해 Suspense로 감싸줍니다.
export default function MyActivityPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">불러오는 중...</div>}>
      <ActivityContent />
    </Suspense>
  );
}
