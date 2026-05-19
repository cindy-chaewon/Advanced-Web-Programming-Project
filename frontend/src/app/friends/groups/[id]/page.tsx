"use client";

import PostCard from "@/components/community/PostCard";
import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import Avatar from "@/components/ui/Avatar";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import type { Post, RestaurantPin } from "@/lib/mockData";
import type {
  GroupApi,
  GroupMemberApi,
  PostBriefApi,
  RestaurantBriefApi,
} from "@/types/api";
import { toPost, toRestaurantPin } from "@/types/api";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

const FALLBACK_CENTER = { lat: 37.4516, lng: 127.1306 };

const TABS = [
  { key: "map", label: "🗺 지도" },
  { key: "posts", label: "📝 글" },
  { key: "members", label: "👥 멤버" },
];

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"map" | "posts" | "members">("map");
  const [group, setGroup] = useState<GroupApi | null>(null);
  const [members, setMembers] = useState<GroupMemberApi[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantPin[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    Promise.all([
      api.get<GroupApi>(`/groups/${id}`, { signal: ac.signal }),
      api.get<GroupMemberApi[]>(`/groups/${id}/members`, { signal: ac.signal }),
      api.get<RestaurantBriefApi[]>(`/groups/${id}/restaurants`, { signal: ac.signal }),
      api
        .get<PostBriefApi[]>(`/groups/${id}/posts`, {
          query: { limit: 50 },
          signal: ac.signal,
        })
        .catch(() => [] as PostBriefApi[]),
    ])
      .then(([g, ms, rs, ps]) => {
        setGroup(g);
        setMembers(ms);
        setRestaurants(rs.map(toRestaurantPin));
        setPosts(ps.map(toPost));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "그룹을 불러오지 못했어요");
      });
    return () => ac.abort();
  }, [id, router]);

  // 멤버 필터 적용된 데이터
  const filteredRestaurants = useMemo(() => {
    if (memberFilter === null) return restaurants;
    // 백엔드에서 owner 정보가 핀에 안 와서 클라이언트는 일단 전체 노출
    return restaurants;
  }, [restaurants, memberFilter]);

  const filteredPosts = useMemo(() => {
    if (memberFilter === null) return posts;
    return posts.filter((p) => Number(p.author.id) === memberFilter);
  }, [posts, memberFilter]);

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

  if (!group) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const center =
    restaurants.length > 0 && restaurants[0].lat
      ? { lat: restaurants[0].lat, lng: restaurants[0].lng }
      : FALLBACK_CENTER;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <PageHeader title={group.name} leftAction="back" />

      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl">
            {group.icon}
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{group.name}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              멤버 {group.member_count}명 · 맛집 {restaurants.length}곳
            </p>
          </div>
        </div>
      </div>

      <TabBar
        tabs={TABS}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as "map" | "posts" | "members")}
      />

      {/* 멤버 필터 칩 (지도/글 탭에서 노출) */}
      {(activeTab === "map" || activeTab === "posts") && members.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            type="button"
            onClick={() => setMemberFilter(null)}
            className={[
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
              memberFilter === null
                ? "bg-brown text-white"
                : "bg-surface text-text-secondary",
            ].join(" ")}
          >
            전체
          </button>
          {members.map((m) => (
            <button
              key={m.user_id}
              type="button"
              onClick={() => setMemberFilter(m.user_id)}
              className={[
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                memberFilter === m.user_id
                  ? "bg-brown text-white"
                  : "bg-surface text-text-secondary",
              ].join(" ")}
            >
              {m.username}
              {m.role === "owner" && " 👑"}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === "map" && (
          <>
            <div className="h-60">
              <KakaoMap
                pins={filteredRestaurants}
                center={center}
                level={5}
                className="h-full"
              />
            </div>
            <div className="px-4 pb-10">
              <p className="py-3 text-sm font-bold text-text-primary">
                그룹 맛집 <span className="text-primary">{filteredRestaurants.length}</span>
              </p>
              {filteredRestaurants.length === 0 ? (
                <p className="py-10 text-center text-sm text-text-secondary">
                  등록된 그룹 맛집이 없습니다
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {filteredRestaurants.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "posts" && (
          <div className="flex flex-col gap-4 px-4 py-4">
            {filteredPosts.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-secondary">
                그룹원의 글이 없어요
              </p>
            ) : (
              filteredPosts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                <Avatar
                  name={m.username}
                  src={m.profile_image ?? undefined}
                  size="md"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {m.username}
                    {m.role === "owner" && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-brown">
                        담당
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-disabled">@{m.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
