"use client";

import PostCard from "@/components/community/PostCard";
import TabBar from "@/components/layout/TabBar";
import EmptyState from "@/components/ui/EmptyState";
import { getPosts } from "@/lib/api";
import type { PostBrief } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const TABS = [
  { key: "popular", label: "인기" },
  { key: "nearby", label: "내주변" },
  { key: "latest", label: "최신" },
];

function PencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("no geolocation")); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("popular");
  const [posts, setPosts] = useState<PostBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const sort = activeTab === "nearby" ? "nearby" : activeTab === "latest" ? "latest" : "popular";

    const load = async () => {
      if (sort === "nearby") {
        try {
          const { lat, lng } = await getUserLocation();
          return await getPosts({ sort, lat, lng, radius: 3000 });
        } catch {
          return await getPosts({ sort: "latest" });
        }
      }
      return getPosts({ sort });
    };

    load()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h1 className="text-lg font-bold text-text-primary">커뮤니티</h1>
        <Link href="/community/write">
          <PencilIcon />
        </Link>
      </div>

      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : posts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {posts.map((post) => <PostCard key={post.post_id} post={post} />)}
          </div>
        ) : (
          <EmptyState icon="📝" title="아직 게시물이 없어요" description="첫 번째 리뷰를 남겨보세요!" />
        )}
      </div>
    </div>
  );
}
