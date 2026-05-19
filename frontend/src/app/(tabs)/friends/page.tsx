"use client";

import FriendItem from "@/components/friends/FriendItem";
import GroupCard from "@/components/friends/GroupCard";
import TabBar from "@/components/layout/TabBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import type { Friend, Group } from "@/lib/mockData";
import type { FriendApi, FriendRequestApi, GroupApi } from "@/types/api";
import { toFriend, toGroup } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { key: "friends", label: "친구" },
  { key: "groups", label: "그룹" },
];

function UserPlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"friends" | "groups">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    Promise.all([
      api.get<FriendApi[]>("/friends", { signal: ac.signal }),
      api.get<FriendRequestApi[]>("/friends/requests", { signal: ac.signal }),
      api.get<GroupApi[]>("/groups", { signal: ac.signal }),
    ])
      .then(([fs, reqs, gs]) => {
        setFriends(fs.map(toFriend));
        setRequests(
          reqs.map((r) => ({
            id: String(r.user_id),
            name: r.username,
            username: r.username,
            avatar: r.profile_image ?? undefined,
            restaurantCount: 0,
            pinColor: "#F472B6",
            status: "pending" as const,
          })),
        );
        setGroups(gs.map((g) => toGroup(g)));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "친구 정보를 불러오지 못했어요");
      });
    return () => ac.abort();
  }, [router]);

  const handleAccept = async (userId: string) => {
    setActionPendingId(userId);
    try {
      await api.post("/friends/accept", { from_user_id: Number(userId) });
      const removed = requests.find((r) => r.id === userId);
      setRequests((prev) => prev.filter((r) => r.id !== userId));
      if (removed) {
        setFriends((prev) => [{ ...removed, status: "friend" }, ...prev]);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "수락 실패");
    } finally {
      setActionPendingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionPendingId(userId);
    try {
      await api.post("/friends/reject", { from_user_id: Number(userId) });
      setRequests((prev) => prev.filter((r) => r.id !== userId));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "거절 실패");
    } finally {
      setActionPendingId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filteredFriends = q
    ? friends.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.username ?? "").toLowerCase().includes(q),
      )
    : friends;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h1 className="text-lg font-bold text-text-primary">친구</h1>
        <Link href="/friends/search" aria-label="친구 검색">
          <UserPlusIcon />
        </Link>
      </div>

      <TabBar
        tabs={[
          { key: "friends", label: `친구 ${friends.length}` },
          { key: "groups", label: `그룹 ${groups.length}` },
        ]}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as "friends" | "groups")}
      />

      {activeTab === "friends" && (
        <div className="border-b border-border px-4 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="아이디로 친구 검색"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brown"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-4">
            <EmptyState icon="⚠️" title="불러오기 실패" description={error} />
          </div>
        )}

        {!error && activeTab === "friends" && (
          <div className="px-4">
            {requests.length > 0 && (
              <section className="py-4">
                <h2 className="mb-2 text-sm font-semibold text-text-primary">
                  받은 친구 요청{" "}
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                    {requests.length}
                  </span>
                </h2>
                <div className="divide-y divide-border">
                  {requests.map((f) => (
                    <FriendItem
                      key={f.id}
                      friend={f}
                      variant="request"
                      onAccept={handleAccept}
                      onReject={handleReject}
                      actionPending={actionPendingId === f.id}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="py-4">
              <h2 className="mb-2 text-sm font-semibold text-text-primary">
                내 친구 <span className="text-text-secondary">{filteredFriends.length}</span>
              </h2>
              {filteredFriends.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredFriends.map((f) => (
                    <FriendItem key={f.id} friend={f} variant="friend" />
                  ))}
                </div>
              ) : friends.length > 0 ? (
                <p className="py-6 text-center text-sm text-text-secondary">
                  "{query}" 검색 결과가 없어요
                </p>
              ) : (
                <EmptyState
                  icon="👥"
                  title="아직 친구가 없어요"
                  description="친구를 추가해보세요!"
                />
              )}
            </section>
          </div>
        )}

        {!error && activeTab === "groups" && (
          <div className="flex flex-col gap-3 p-4">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
            <Link href="/friends/groups/new">
              <Button variant="secondary" fullWidth size="lg">
                + 새 그룹 만들기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
