"use client";

import { ApiError, api } from "@/lib/api";
import type { RestaurantBriefApi } from "@/types/api";
import { useEffect, useRef, useState } from "react";

export type PickedRestaurant = {
  id: number;
  name: string;
  category: string;
  address: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (r: PickedRestaurant) => void;
};

export default function RestaurantPicker({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RestaurantBriefApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      api
        .get<RestaurantBriefApi[]>("/restaurants/search", {
          query: { q, limit: 20 },
          auth: false,
          signal: ac.signal,
        })
        .then(setResults)
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof ApiError ? err.message : "검색에 실패했어요");
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-xl text-text-secondary"
        >
          ✕
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="식당 이름으로 검색"
          className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brown"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {error && (
          <p className="px-4 py-10 text-center text-sm text-text-secondary">{error}</p>
        )}
        {!loading && !error && query.trim() && results.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-text-secondary">
            "{query}" 결과 없음
          </p>
        )}
        {!loading && !error && !query.trim() && (
          <p className="px-4 py-10 text-center text-sm text-text-disabled">
            식당 이름을 입력하세요
          </p>
        )}
        <ul className="divide-y divide-border">
          {results.map((r) => (
            <li key={r.restaurant_id}>
              <button
                type="button"
                onClick={() =>
                  onPick({
                    id: r.restaurant_id,
                    name: r.name,
                    category: r.category?.name ?? "",
                    address: r.address?.full_address ?? "",
                  })
                }
                className="w-full px-4 py-3 text-left transition-colors active:bg-surface"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {r.name}
                  </span>
                  {r.category && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-brown">
                      {r.category.name}
                    </span>
                  )}
                </div>
                {r.address?.full_address && (
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {r.address.full_address}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
