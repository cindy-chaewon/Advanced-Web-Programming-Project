"use client";

import PostCard from "@/components/community/PostCard";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import type { Post, RestaurantPin } from "@/lib/mockData";
import type {
  PostBriefApi,
  RestaurantBriefApi,
  UserDetailApi,
} from "@/types/api";
import { toPost, toRestaurantPin } from "@/types/api";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

const TABS = [
  { key: "reviews", label: "작성 리뷰" },
  { key: "blogs", label: "블로그 리뷰" },
  { key: "scraps", label: "스크랩" },
];

export default function FriendProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<UserDetailApi | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [scraps, setScraps] = useState<RestaurantPin[]>([]);
  const [activeTab, setActiveTab] = useState<"reviews" | "blogs" | "scraps">("reviews");
  const [isRequested, setIsRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    api
      .get<UserDetailApi>(`/users/${id}`, { signal: ac.signal })
      .then((u) => {
        setUser(u);
        if (u.friend_status === "accepted") {
          return Promise.all([
            api.get<PostBriefApi[]>(`/users/${id}/posts`, { signal: ac.signal }),
            api.get<RestaurantBriefApi[]>(`/users/${id}/scraps`, { signal: ac.signal }),
          ]).then(([ps, ss]) => {
            setPosts(ps.map(toPost));
            setScraps(ss.map(toRestaurantPin));
          });
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "프로필을 불러오지 못했어요");
      });
    return () => ac.abort();
  }, [id, router]);

  const handleRequestFriend = async () => {
    try {
      await api.post("/friends/request", { target_user_id: Number(id) });
      setIsRequested(true);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "요청 실패");
    }
  };

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const isFriend = user.friend_status === "accepted" || user.friend_status === "self";
  const simpleReviews = posts.filter((p) => p.type === "simple");
  const blogPosts = posts.filter((p) => p.type !== "simple");

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-surface">
      <PageHeader title={`${user.username}님의 프로필`} leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white px-4 py-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar
              name={user.username}
              src={user.profile_image ?? undefined}
              size="lg"
            />
            <div className="text-center">
              <h2 className="text-xl font-bold text-text-primary">
                {user.username}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {user.bio || "맛있는 걸 좋아하는 미식가"}
              </p>
              <p className="mt-2 text-xs text-text-disabled">
                글 {user.post_count} · 리뷰 {user.review_count} · 친구 {user.friend_count}
                {user.level ? ` · Lv.${user.level}` : ""}
              </p>
            </div>

            {user.friend_status === "self" ? null : isFriend ? (
              <div className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-brown">
                나와 단짝 친구
              </div>
            ) : user.friend_status === "pending" || isRequested ? (
              <button
                type="button"
                disabled
                className="mt-2 rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-text-secondary"
              >
                요청 대기 중
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestFriend}
                className="mt-2 rounded-full bg-brown px-4 py-1.5 text-xs font-bold text-white transition-opacity active:opacity-80"
              >
                친구 추가하기
              </button>
            )}
          </div>
        </div>

        {isFriend ? (
          <div className="mt-2 flex-1 bg-white min-h-[400px]">
            <div className="sticky top-0 z-10 border-b border-border bg-white">
              <TabBar
                tabs={TABS}
                activeKey={activeTab}
                onChange={(k) => setActiveTab(k as "reviews" | "blogs" | "scraps")}
              />
            </div>

            <div className="px-4 py-4">
              {activeTab === "reviews" && (
                <div className="flex flex-col gap-4">
                  {simpleReviews.length > 0 ? (
                    simpleReviews.map((p) => <PostCard key={p.id} post={p} />)
                  ) : (
                    <EmptyState icon="📝" title="작성한 리뷰가 없어요" />
                  )}
                </div>
              )}
              {activeTab === "blogs" && (
                <div className="flex flex-col gap-4">
                  {blogPosts.length > 0 ? (
                    blogPosts.map((p) => <PostCard key={p.id} post={p} />)
                  ) : (
                    <EmptyState icon="📓" title="작성한 블로그가 없어요" />
                  )}
                </div>
              )}
              {activeTab === "scraps" && (
                <div className="divide-y divide-border">
                  {scraps.length > 0 ? (
                    scraps.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
                  ) : (
                    <EmptyState icon="🔖" title="스크랩한 맛집이 없어요" />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex min-h-[300px] flex-1 flex-col items-center justify-center bg-white px-4 py-20 text-center">
            <span className="mb-4 text-5xl opacity-80">🔒</span>
            <h3 className="text-base font-bold text-text-primary">
              친구가 비공개로 설정한 프로필입니다
            </h3>
            <p className="mt-1.5 text-sm text-text-secondary">
              친구 추가를 하시면 맛집 지도와 리뷰를 확인할 수 있어요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
