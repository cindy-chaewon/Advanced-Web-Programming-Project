"use client";

import RestaurantCard from "@/components/restaurant/RestaurantCard";
import SearchBar from "@/components/search/SearchBar";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import { CATEGORIES, SAMPLE_HASHTAGS, SAMPLE_PINS } from "@/lib/mockData";
import { useState } from "react";

type ViewMode = "home" | "results";

const RECENT_SEARCHES = ["광화문 맛집", "혼밥 한식", "강남 카페"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("home");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const handleSubmit = (q: string) => {
    if (q.trim()) setView("results");
  };

  const results = SAMPLE_PINS.filter(
    (p) =>
      p.name.includes(query) ||
      p.category.includes(query) ||
      p.tags.some((t) => t.includes(query)),
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 검색바 헤더 */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {view === "results" && (
          <button
            type="button"
            onClick={() => { setView("home"); setQuery(""); }}
            className="shrink-0"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {view === "home" ? (
          <div className="flex flex-col gap-6 px-4 py-5">
            {/* 최근 검색어 */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">최근 검색어</h2>
              <div className="flex flex-wrap gap-2">
                {RECENT_SEARCHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setQuery(s); setView("results"); }}
                    className="rounded-full border border-border px-3.5 py-1.5 text-sm text-text-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            {/* 카테고리 */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">카테고리</h2>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => { setQuery(cat.name); setView("results"); }}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface py-3"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-xs font-medium text-text-primary">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 인기 해시태그 */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">인기 해시태그</h2>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_HASHTAGS.slice(0, 12).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => { setQuery(tag.replace("#", "")); setView("results"); }}
                    className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-brown"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* 필터 */}
            <div className="flex gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
              {["거리순", "별점순", "리뷰순", "한식", "일식", "양식", "카페"].map((f) => (
                <Chip
                  key={f}
                  label={f}
                  selected={selectedFilter === f}
                  onClick={() => setSelectedFilter((p) => (p === f ? null : f))}
                />
              ))}
            </div>

            {/* 결과 수 */}
            <p className="px-4 text-xs text-text-secondary">
              검색 결과 <span className="font-semibold text-text-primary">{results.length}</span>개
            </p>

            {/* 결과 리스트 */}
            <div className="divide-y divide-border px-4">
              {results.length > 0 ? (
                results.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
              ) : (
                <EmptyState
                  icon="🔍"
                  title="검색 결과가 없어요"
                  description={`'${query}'에 대한 결과를 찾지 못했어요`}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
