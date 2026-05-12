"use client";

import FriendItem from "@/components/friends/FriendItem";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/search/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import { SAMPLE_FRIENDS } from "@/lib/mockData";
import { useState } from "react";

export default function FriendSearchPage() {
  const [query, setQuery] = useState("");

  const results = query
    ? SAMPLE_FRIENDS.filter(
        (f) => f.name.includes(query) || f.username.includes(query),
      )
    : [];

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="친구 검색" leftAction="back" />

      <div className="px-4 py-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="이름 또는 아이디로 검색"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {query === "" ? (
          <EmptyState
            icon="🔍"
            title="친구를 검색해보세요"
            description="이름이나 아이디로 검색할 수 있어요"
          />
        ) : results.length > 0 ? (
          <div className="divide-y divide-border">
            {results.map((f) => (
              <FriendItem key={f.id} friend={f} variant="search" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="😢"
            title="검색 결과가 없어요"
            description={`'${query}'를 찾지 못했어요`}
          />
        )}
      </div>
    </div>
  );
}
