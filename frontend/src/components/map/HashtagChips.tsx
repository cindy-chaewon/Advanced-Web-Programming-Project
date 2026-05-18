"use client";

import { getCategories } from "@/lib/api";
import type { CategoryOut } from "@/lib/api";
import { useEffect, useState } from "react";

interface Props {
  selected: string | null;
  onSelect: (tag: string | null) => void;
}

export default function HashtagChips({ selected, onSelect }: Props) {
  const [categories, setCategories] = useState<CategoryOut[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
      {categories.map((cat) => {
        const isSelected = selected === cat.name;
        return (
          <button
            key={cat.category_id}
            type="button"
            onClick={() => onSelect(isSelected ? null : cat.name)}
            className={[
              "inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold shadow-sm transition-colors",
              isSelected
                ? "bg-primary text-brown"
                : "bg-white text-text-secondary border border-border",
            ].join(" ")}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
