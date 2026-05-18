"use client";

import FriendItem from "@/components/friends/FriendItem";
import GroupCard from "@/components/friends/GroupCard";
import TabBar from "@/components/layout/TabBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  acceptFriend,
  getFriendRequests,
  getFriends,
  getGroups,
  rejectFriend,
} from "@/lib/api";
import type { FriendOut, FriendRequestOut, GroupOut } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const TABS = [
  { key: "friends", label: "친구" },
  { key: "groups", label: "그룹" },
];

function UserPlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState<FriendOut[]>([]);
  const [requests, setRequests] = useState<FriendRequestOut[]>([]);
  const [groups, setGroups] = useState<GroupOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "friends") {
      setLoading(true);
      Promise.all([getFriends(), getFriendRequests()])
        .then(([f, r]) => { setFriends(f); setRequests(r); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      getGroups()
        .then(setGroups)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const refreshFriendData = async () => {
    try {
      const [f, r] = await Promise.all([getFriends(), getFriendRequests()]);
      setFriends(f);
      setRequests(r);
    } catch {
      // ignore
    }
  };

  const handleAccept = async (fromUserId: number) => {
    await acceptFriend(fromUserId).catch(() => {});
    await refreshFriendData();
  };

  const handleReject = async (fromUserId: number) => {
    await rejectFriend(fromUserId).catch(() => {});
    setRequests((prev) => prev.filter((r) => r.from_user_id !== fromUserId));
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h1 className="text-lg font-bold text-text-primary">친구</h1>
        <Link href="/friends/search"><UserPlusIcon /></Link>
      </div>

      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : activeTab === "friends" ? (
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
                  {requests.map((r) => (
                    <FriendItem
                      key={r.from_user_id}
                      friend={{ user_id: r.from_user_id, username: r.from_username, profile_image: r.from_profile_image }}
                      variant="request"
                      onAccept={() => handleAccept(r.from_user_id)}
                      onReject={() => handleReject(r.from_user_id)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="py-4">
              <h2 className="mb-2 text-sm font-semibold text-text-primary">
                친구 <span className="text-text-secondary">{friends.length}</span>
              </h2>
              {friends.length > 0 ? (
                <div className="divide-y divide-border">
                  {friends.map((f) => (
                    <FriendItem key={f.user_id} friend={f} variant="friend" />
                  ))}
                </div>
              ) : (
                <EmptyState icon="👥" title="아직 친구가 없어요" description="친구를 추가해보세요!" />
              )}
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {groups.map((g) => <GroupCard key={g.group_id} group={g} />)}
            <Link href="/friends/groups/new">
              <Button variant="secondary" fullWidth size="lg">+ 새 그룹 만들기</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
