"use client";

import ProfileHeader from "@/components/my/ProfileHeader";
import SettingsItem from "@/components/my/SettingsItem";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { getMe, getMyPosts, getMyScraps, getMyStats, logout } from "@/lib/api";
import type { PostBrief, RestaurantBrief, UserMeOut, UserStatsOut } from "@/lib/api";
import { removeToken } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMeOut | null>(null);
  const [stats, setStats] = useState<UserStatsOut | null>(null);
  const [posts, setPosts] = useState<PostBrief[]>([]);
  const [scraps, setScraps] = useState<RestaurantBrief[]>([]);

  useEffect(() => {
    Promise.all([getMe(), getMyStats(), getMyPosts({ limit: 2 }), getMyScraps()])
      .then(([u, s, p, sc]) => {
        setUser(u);
        setStats(s);
        setPosts(p);
        setScraps(sc.slice(0, 2));
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout().catch(() => {});
    removeToken();
    router.replace("/login");
  };

  const me = {
    name: user?.username ?? "나",
    bio: user?.bio ?? undefined,
    avatar: user?.profile_image ?? undefined,
    stats: {
      posts: stats?.post_count ?? 0,
      reviews: stats?.review_count ?? 0,
      scraps: stats?.scrap_count ?? 0,
      friends: stats?.friend_count ?? 0,
    },
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface">
      <ProfileHeader {...me} />

      <div className="mt-2 flex flex-col gap-2">
        <section className="bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-text-primary">내가 쓴 글</h2>
            <Link href="/my/activity" className="text-xs text-text-secondary">더보기</Link>
          </div>
          {posts.length > 0 ? posts.map((post) => (
            <Link
              key={post.post_id}
              href={`/community/${post.post_id}`}
              className="block border-b border-border px-4 py-3 last:border-0 active:bg-surface"
            >
              <p className="text-sm font-medium text-text-primary line-clamp-1">
                {post.title ?? post.content_preview}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {post.restaurant?.name} · {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </p>
            </Link>
          )) : (
            <p className="px-4 py-3 text-sm text-text-secondary">아직 작성한 글이 없어요</p>
          )}
        </section>

        <section className="bg-white px-4">
          <div className="flex items-center justify-between border-b border-border py-3">
            <h2 className="text-sm font-bold text-text-primary">스크랩한 맛집</h2>
            <Link href="/my/activity" className="text-xs text-text-secondary">더보기</Link>
          </div>
          {scraps.length > 0 ? scraps.map((r) => (
            <RestaurantCard key={r.restaurant_id} restaurant={r} />
          )) : (
            <p className="py-3 text-sm text-text-secondary">스크랩한 맛집이 없어요</p>
          )}
        </section>

        <section className="bg-white">
          <h2 className="border-b border-border px-4 py-3 text-sm font-bold text-text-primary">설정</h2>
          <SettingsItem icon="✏️" label="프로필 수정" href="/my/edit" />
          <SettingsItem icon="🔔" label="알림" href="/my/notifications" />
          <SettingsItem icon="⚙️" label="설정" href="/my/settings" />
          <SettingsItem icon="🚪" label="로그아웃" danger onClick={handleLogout} />
        </section>
      </div>
    </div>
  );
}
