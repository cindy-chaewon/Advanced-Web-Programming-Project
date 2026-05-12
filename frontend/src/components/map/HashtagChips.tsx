"use client";

import { useState } from "react";

const HASHTAGS = [
  "#한식", "#양식", "#일식", "#중식",
  "#혼밥", "#가성비", "#데이트", "#카페",
  "#술집", "#분위기", "#배달", "#야식",
];

export default function HashtagChips() {
  const [selected, setSelected] = useState<string | null>(null);

  const toggle = (tag: string) => {
    setSelected((prev) => (prev === tag ? null : tag));
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
      {HASHTAGS.map((tag) => {
        const isSelected = selected === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={[
              "inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold shadow-sm transition-colors",
              isSelected
                ? "bg-primary text-brown"
                : "bg-white text-text-secondary border border-border",
            ].join(" ")}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
