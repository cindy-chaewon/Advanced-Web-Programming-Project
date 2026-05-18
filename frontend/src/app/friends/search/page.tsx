"use client";

import FriendItem from "@/components/friends/FriendItem";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/search/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import { requestFriend, searchUsers } from "@/lib/api";
import type { UserSearchHit } from "@/lib/api";
import { useEffect, useState } from "react";

export default function FriendSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchUsers(query.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (userId: number) => {
    await requestFriend(userId).catch(() => {});
    setRequestedIds((prev) => new Set([...prev, userId]));
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="친구 검색" leftAction="back" />

      <div className="px-4 py-3">
        <SearchBar value={query} onChange={setQuery} placeholder="닉네임으로 검색" autoFocus />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {query === "" ? (
          <EmptyState icon="🔍" title="친구를 검색해보세요" description="닉네임으로 검색할 수 있어요" />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-border">
            {results.map((u) => (
              <FriendItem
                key={u.user_id}
                friend={u}
                variant={u.friend_status === "accepted" ? "friend" : "search"}
                onAdd={requestedIds.has(u.user_id) ? undefined : () => handleAdd(u.user_id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon="😢" title="검색 결과가 없어요" description={`'${query}'를 찾지 못했어요`} />
        )}
      </div>
    </div>
  );
}
