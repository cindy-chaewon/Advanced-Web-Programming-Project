"use client";

import RestaurantCard from "@/components/restaurant/RestaurantCard";
import SearchBar from "@/components/search/SearchBar";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import { ApiError, api } from "@/lib/api";
import { CATEGORIES } from "@/lib/mockData";
import type { RestaurantPin } from "@/lib/mockData";
import type { CategoryApi, RestaurantBriefApi } from "@/types/api";
import { toRestaurantPin } from "@/types/api";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ViewMode = "home" | "results";

type HashtagApi = { tag_id: number; name: string; usage_count?: number };

function SearchInner() {
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<ViewMode>(initialQuery ? "results" : "home");
  const [sortMode, setSortMode] = useState<"default" | "distance" | "rating" | "review">("default");
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [results, setResults] = useState<RestaurantPin[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<HashtagApi[]>([]);
  const [categories, setCategories] = useState<CategoryApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 로드: 인기 검색어 + 해시태그 + 카테고리
  useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      api.get<{ suggestions: string[] }>("/search/suggestions", {
        auth: false,
        signal: ac.signal,
      }),
      api.get<HashtagApi[]>("/hashtags/popular", {
        query: { limit: 12 },
        auth: false,
        signal: ac.signal,
      }),
      api.get<CategoryApi[]>("/categories", { auth: false, signal: ac.signal }),
    ])
      .then(([s, h, c]) => {
        setRecent(s.suggestions ?? []);
        setHashtags(h);
        setCategories(c);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // 검색 실행
  useEffect(() => {
    if (view !== "results" || !query.trim()) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get<RestaurantBriefApi[]>("/restaurants/search", {
        query: { q: query.trim(), limit: 50 },
        auth: false,
        signal: ac.signal,
      })
      .then((data) => setResults(data.map(toRestaurantPin)))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "검색 실패");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [view, query]);

  const handleSubmit = (q: string) => {
    if (q.trim()) setView("results");
  };

  // 카테고리 이모지 매핑 (백엔드는 name만, 프론트 mockData에 emoji 매핑 있음)
  const categoryEmoji = (name: string): string => {
    const found = CATEGORIES.find((c) => c.name === name);
    return found?.emoji ?? "🍽️";
  };

  // 결과 필터링/정렬 (클라이언트 측)
  const displayedResults = useMemo(() => {
    let arr = [...results];
    if (highRatingOnly) arr = arr.filter((r) => r.rating >= 4.5);
    if (categoryFilter) arr = arr.filter((r) => r.category === categoryFilter);
    switch (sortMode) {
      case "rating":
        arr.sort((a, b) => b.rating - a.rating);
        break;
      case "review":
        arr.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      // distance는 백엔드가 distance_meters 채워주므로 기본 순서 유지 (search endpoint는 미지원)
      default:
        break;
    }
    return arr;
  }, [results, sortMode, highRatingOnly, categoryFilter]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {view === "results" && (
          <button
            type="button"
            onClick={() => {
              setView("home");
              setQuery("");
            }}
            className="shrink-0"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#1a1a1a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            autoFocus={view === "home"}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "home" ? (
          <div className="flex flex-col gap-6 px-4 py-5">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">
                추천 검색어
              </h2>
              {recent.length === 0 ? (
                <p className="text-xs text-text-disabled">추천 검색어가 없어요</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recent.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        setView("results");
                      }}
                      className="rounded-full border border-border px-3.5 py-1.5 text-sm text-text-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">카테고리</h2>
              <div className="grid grid-cols-4 gap-2">
                {(categories.length > 0
                  ? categories.map((c) => ({ name: c.name, emoji: categoryEmoji(c.name) }))
                  : CATEGORIES
                ).map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setQuery(cat.name);
                      setView("results");
                    }}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface py-3"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-xs font-medium text-text-primary">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">
                인기 해시태그
              </h2>
              {hashtags.length === 0 ? (
                <p className="text-xs text-text-disabled">인기 해시태그가 없어요</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <a
                      key={tag.tag_id}
                      href={`/hashtags/${encodeURIComponent(tag.name)}`}
                      className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-brown"
                    >
                      #{tag.name}
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex flex-col">
            <div
              className="flex gap-2 overflow-x-auto px-4 py-3"
              style={{ scrollbarWidth: "none" }}
            >
              <Chip
                label="거리순"
                selected={sortMode === "distance"}
                onClick={() =>
                  setSortMode((p) => (p === "distance" ? "default" : "distance"))
                }
              />
              <Chip
                label="별점순"
                selected={sortMode === "rating"}
                onClick={() =>
                  setSortMode((p) => (p === "rating" ? "default" : "rating"))
                }
              />
              <Chip
                label="리뷰순"
                selected={sortMode === "review"}
                onClick={() =>
                  setSortMode((p) => (p === "review" ? "default" : "review"))
                }
              />
              <Chip
                label="★ 4.5+"
                selected={highRatingOnly}
                onClick={() => setHighRatingOnly((p) => !p)}
              />
              {["한식", "일식", "양식", "카페", "중식", "분식"].map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={categoryFilter === cat}
                  onClick={() =>
                    setCategoryFilter((p) => (p === cat ? null : cat))
                  }
                />
              ))}
            </div>

            <p className="px-4 text-xs text-text-secondary">
              검색 결과{" "}
              <span className="font-semibold text-text-primary">{displayedResults.length}</span>개
            </p>

            <div className="divide-y divide-border px-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : error ? (
                <EmptyState icon="⚠️" title="검색 실패" description={error} />
              ) : displayedResults.length > 0 ? (
                displayedResults.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
              ) : (
                <EmptyState
                  icon="🔍"
                  title="검색 결과가 없어요"
                  description={`'${query}'에 대한 결과를 찾지 못했어요. 직접 등록해보세요!`}
                  action={
                    <a
                      href="/restaurants/new"
                      className="inline-block rounded-xl bg-brown px-5 py-2.5 text-sm font-bold text-white"
                    >
                      + 식당 등록하기
                    </a>
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
