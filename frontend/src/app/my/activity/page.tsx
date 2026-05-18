"use client";

import TabBar from "@/components/layout/TabBar";
import PageHeader from "@/components/layout/PageHeader";
import PostCard from "@/components/community/PostCard";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import StarRating from "@/components/restaurant/StarRating";
import { getMyPosts, getMyScraps, getMyReviews } from "@/lib/api";
import type { PostBrief, RestaurantBrief, ReviewOut } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

const TABS = [
  { key: "posts", label: "내가 쓴 글" },
  { key: "reviews", label: "내가 쓴 리뷰" },
  { key: "scraps", label: "스크랩" },
];

export default function MyActivityPage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<PostBrief[]>([]);
  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [scraps, setScraps] = useState<RestaurantBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (activeTab === "posts") {
      getMyPosts()
        .then(setPosts)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (activeTab === "reviews") {
      getMyReviews()
        .then(setReviews)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      getMyScraps()
        .then(setScraps)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="나의 활동" leftAction="back" />
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : activeTab === "posts" ? (
          <div className="flex flex-col gap-4 px-4 py-3">
            {posts.length > 0
              ? posts.map((p) => <PostCard key={p.post_id} post={p} />)
              : <p className="py-10 text-center text-sm text-text-secondary">작성한 글이 없어요</p>
            }
          </div>
        ) : activeTab === "reviews" ? (
          <div className="flex flex-col divide-y divide-border px-4">
            {reviews.length > 0 ? reviews.map((r) => (
              <Link
                key={r.review_id}
                href={`/restaurants/${r.restaurant_id}`}
                className="flex flex-col gap-1.5 py-4 active:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {r.restaurant_name ?? "식당"}
                  </span>
                  <span className="text-xs text-text-disabled">
                    {new Date(r.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                {r.score && (
                  <StarRating value={r.score} size={12} />
                )}
                {r.content && (
                  <p className="text-sm text-text-secondary leading-relaxed">{r.content}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-text-disabled">
                  <span>👍 {r.like_count}</span>
                </div>
              </Link>
            )) : (
              <p className="py-10 text-center text-sm text-text-secondary">작성한 리뷰가 없어요</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border px-4">
            {scraps.length > 0
              ? scraps.map((r) => <RestaurantCard key={r.restaurant_id} restaurant={r} />)
              : <p className="py-10 text-center text-sm text-text-secondary">스크랩한 맛집이 없어요</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}
