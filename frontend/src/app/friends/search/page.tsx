"use client";

import FriendItem from "@/components/friends/FriendItem";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/search/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import type { Friend } from "@/lib/mockData";
import type { UserSearchApi } from "@/types/api";
import { toFriendFromSearch } from "@/types/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FriendSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      setError(null);
      api
        .get<UserSearchApi[]>("/users/search", {
          query: { nickname: q, limit: 20 },
          signal: ac.signal,
        })
        .then((data) => setResults(data.map(toFriendFromSearch)))
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof ApiError ? err.message : "검색 실패");
        });
    }, 200);
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query]);

  const handleSendRequest = async (userId: string) => {
    try {
      await api.post("/friends/request", { target_user_id: Number(userId) });
      setRequestedIds((prev) => new Set([...prev, userId]));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "요청 실패");
    }
  };

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
        {error ? (
          <EmptyState icon="⚠️" title="검색 실패" description={error} />
        ) : query === "" ? (
          <EmptyState
            icon="🔍"
            title="친구를 검색해보세요"
            description="이름이나 아이디로 검색할 수 있어요"
          />
        ) : results.length > 0 ? (
          <div className="divide-y divide-border">
            {results.map((f) => (
              <div key={f.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <FriendItem friend={f} variant="search" />
                </div>
                {f.status === "none" && (
                  <button
                    type="button"
                    onClick={() => handleSendRequest(f.id)}
                    disabled={requestedIds.has(f.id)}
                    className="shrink-0 rounded-lg bg-brown px-3 py-1.5 text-xs font-semibold text-white disabled:bg-surface disabled:text-text-secondary"
                  >
                    {requestedIds.has(f.id) ? "요청됨" : "친구 추가"}
                  </button>
                )}
                {f.status === "pending" && (
                  <span className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary">
                    요청 대기
                  </span>
                )}
                {f.status === "friend" && (
                  <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-brown">
                    친구
                  </span>
                )}
              </div>
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
