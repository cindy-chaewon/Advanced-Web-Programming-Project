"use client";

import TabBar from "@/components/layout/TabBar";
import PageHeader from "@/components/layout/PageHeader";
import PostCard from "@/components/community/PostCard";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { SAMPLE_PINS, SAMPLE_POSTS } from "@/lib/mockData";
import { useState } from "react";

const TABS = [
  { key: "posts", label: "내가 쓴 글" },
  { key: "reviews", label: "내가 쓴 리뷰" },
  { key: "scraps", label: "스크랩" },
];

export default function MyActivityPage() {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="나의 활동" leftAction="back" />
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {activeTab === "posts" && (
          <div className="flex flex-col gap-4 px-4 py-3">
            {SAMPLE_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        {activeTab === "reviews" && (
          <div className="flex flex-col gap-4 px-4 py-3">
            {SAMPLE_POSTS.filter((p) => p.type === "simple").map((post) => (
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
