"use client";

import FriendItem from "@/components/friends/FriendItem";
import GroupCard from "@/components/friends/GroupCard";
import TabBar from "@/components/layout/TabBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SAMPLE_FRIENDS, SAMPLE_GROUPS } from "@/lib/mockData";
import Link from "next/link";
import { useState } from "react";

const TABS = [
  { key: "friends", label: "친구" },
  { key: "groups", label: "그룹" },
];

const REQUESTS = SAMPLE_FRIENDS.filter((f) => f.status === "pending");
const FRIENDS = SAMPLE_FRIENDS.filter((f) => f.status === "friend");

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
  const [activeTab, setActiveTab] = useState("friends");

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h1 className="text-lg font-bold text-text-primary">친구</h1>
        <Link href="/friends/search">
          <UserPlusIcon />
        </Link>
      </div>

      {/* 탭 */}
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {activeTab === "friends" ? (
          <div className="px-4">
            {/* 받은 요청 */}
            {REQUESTS.length > 0 && (
              <section className="py-4">
                <h2 className="mb-2 text-sm font-semibold text-text-primary">
                  받은 친구 요청{" "}
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                    {REQUESTS.length}
                  </span>
                </h2>
                <div className="divide-y divide-border">
                  {REQUESTS.map((f) => (
                    <FriendItem key={f.id} friend={f} variant="request" />
                  ))}
                </div>
              </section>
            )}

            {/* 친구 목록 */}
            <section className="py-4">
              <h2 className="mb-2 text-sm font-semibold text-text-primary">
                친구 <span className="text-text-secondary">{FRIENDS.length}</span>
              </h2>
              {FRIENDS.length > 0 ? (
                <div className="divide-y divide-border">
                  {FRIENDS.map((f) => (
                    <FriendItem key={f.id} friend={f} variant="friend" />
                  ))}
                </div>
              ) : (
                <EmptyState icon="👥" title="아직 친구가 없어요" description="친구를 추가해보세요!" />
              )}
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {SAMPLE_GROUPS.map((g) => (
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
