"use client";

import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function SimpleReviewWritePage() {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [restaurant, setRestaurant] = useState("");

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="간단 리뷰 작성" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-6">
          {/* 식당 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">식당</label>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              <span className={restaurant ? "text-text-primary" : "text-text-disabled"}>
                {restaurant || "식당을 선택하세요"}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* 별점 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">별점</label>
            <StarRating value={rating} size={36} interactive onChange={setRating} />
            <p className="mt-1.5 text-xs text-text-secondary">
              {["", "별로에요", "그저 그래요", "보통이에요", "맛있어요", "최고에요"][rating]}
            </p>
          </div>

          {/* 내용 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">리뷰</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="맛집에 대한 솔직한 후기를 남겨보세요"
              maxLength={200}
              rows={5}
              className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm outline-none placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-xs text-text-disabled">{content.length}/200</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!rating || !content}>
          리뷰 올리기
        </Button>
      </div>
    </div>
  );
}
