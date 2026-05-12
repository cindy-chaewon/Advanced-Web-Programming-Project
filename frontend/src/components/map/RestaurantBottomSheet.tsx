"use client";

import type { RestaurantPin } from "@/lib/mockData";
import Link from "next/link";

type RestaurantBottomSheetProps = {
  pin: RestaurantPin | null;
  onClose: () => void;
};

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc107">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function RestaurantBottomSheet({ pin, onClose }: RestaurantBottomSheetProps) {
  if (!pin) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-30" onClick={onClose} />

      {/* Sheet — z-50으로 네비바(z-40) 위를 덮음 */}
      <div className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-17">
          {/* 태그 */}
          <div className="mb-2 flex gap-1.5 flex-wrap">
            {pin.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-brown"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 식당명 & 카테고리 */}
          <h2 className="text-xl font-bold text-text-primary">{pin.name}</h2>
          <p className="mt-0.5 text-sm text-text-secondary">{pin.category}</p>

          {/* 별점 */}
          <div className="mt-2 flex items-center gap-1">
            <StarIcon />
            <span className="text-sm font-semibold text-text-primary">{pin.rating.toFixed(1)}</span>
            <span className="text-sm text-text-secondary">({pin.reviewCount})</span>
          </div>

          {/* 주소 */}
          <p className="mt-1.5 text-xs text-text-secondary">{pin.address}</p>

          {/* 상세보기 버튼 */}
          <Link
            href={`/restaurants/${pin.id}`}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white active:bg-primary/90"
          >
            상세보기
          </Link>
        </div>
      </div>
    </>
  );
}
