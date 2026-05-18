"use client";

import RestaurantCard from "@/components/restaurant/RestaurantCard";
import SearchBar from "@/components/search/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import { getCategories, getPopularTags, searchRestaurants } from "@/lib/api";
import type { CategoryOut, RestaurantBrief, TagOut } from "@/lib/api";
import { useEffect, useState } from "react";

type ViewMode = "home" | "results";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("home");
  const [results, setResults] = useState<RestaurantBrief[]>([]);
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [popularTags, setPopularTags] = useState<TagOut[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getPopularTags(12)])
      .then(([cats, tags]) => { setCategories(cats); setPopularTags(tags); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (q: string) => {
    if (!q.trim()) return;
    setView("results");
    setLoading(true);
    try {
      const data = await searchRestaurants({ q: q.trim() });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = async (tag: string) => {
    setQuery(`#${tag}`);
    setView("results");
    setLoading(true);
    try {
      const data = await searchRestaurants({ tag });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (name: string) => {
    setQuery(name);
    handleSubmit(name);
  };

  const EMOJI_MAP: Record<string, string> = {
    한식: "🍚", 양식: "🍝", 일식: "🍣", 중식: "🥢",
    카페: "☕", 술집: "🍺", 디저트: "🍰", 기타: "🍴",
  };

  return (
    <div className="flex h-full flex-col bg-white">
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
          <SearchBar value={query} onChange={setQuery} onSubmit={handleSubmit} autoFocus={view === "home"} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "home" ? (
          <div className="flex flex-col gap-6 px-4 py-5">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">카테고리</h2>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.name)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface py-3"
                  >
                    <span className="text-2xl">{EMOJI_MAP[cat.name] ?? "🍴"}</span>
                    <span className="text-xs font-medium text-text-primary">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">인기 해시태그</h2>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag.tag_id}
                    type="button"
                    onClick={() => handleTagClick(tag.name)}
                    className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-brown"
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col">
            <p className="px-4 py-3 text-xs text-text-secondary">
              검색 결과 <span className="font-semibold text-text-primary">{results.length}</span>개
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-border px-4">
                {results.map((r) => <RestaurantCard key={r.restaurant_id} restaurant={r} />)}
              </div>
            ) : (
              <EmptyState icon="🔍" title="검색 결과가 없어요" description={`'${query}'에 대한 결과를 찾지 못했어요`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
