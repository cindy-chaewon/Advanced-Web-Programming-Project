"use client";

import { useEffect, useRef, useState } from "react";

export type PickedAddress = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (a: PickedAddress) => void;
};

type KakaoPlace = {
  place_name: string;
  address_name: string;
  road_address_name?: string;
  x: string;
  y: string;
};

export default function AddressPicker({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const services = (window as any).kakao?.maps?.services;
    if (!services?.Places) {
      setError("카카오맵 services 라이브러리가 로드되지 않았어요");
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const places = new services.Places();
      places.keywordSearch(q, (data: KakaoPlace[], status: string) => {
        setLoading(false);
        if (status === services.Status.OK) {
          setResults(data);
        } else if (status === services.Status.ZERO_RESULT) {
          setResults([]);
        } else {
          setError("검색 실패");
        }
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button type="button" onClick={onClose} className="text-xl text-text-secondary">
          ✕
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="식당 또는 주소 검색"
          className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brown"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {error && <p className="px-4 py-10 text-center text-sm text-red-500">{error}</p>}
        {!loading && !error && query.trim() && results.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-text-secondary">
            "{query}" 결과 없음
          </p>
        )}
        {!loading && !error && !query.trim() && (
          <p className="px-4 py-10 text-center text-sm text-text-disabled">
            식당 이름이나 주소를 입력하세요
          </p>
        )}
        <ul className="divide-y divide-border">
          {results.map((p, i) => (
            <li key={`${p.place_name}_${i}`}>
              <button
                type="button"
                onClick={() =>
                  onPick({
                    name: p.place_name,
                    address: p.road_address_name || p.address_name,
                    lat: Number(p.y),
                    lng: Number(p.x),
                  })
                }
                className="w-full px-4 py-3 text-left transition-colors active:bg-surface"
              >
                <p className="text-sm font-semibold text-text-primary">{p.place_name}</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {p.road_address_name || p.address_name}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
