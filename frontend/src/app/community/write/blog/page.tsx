"use client";

import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function BlogWritePage() {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="맛집 블로그 작성" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-5">
          {/* 식당 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">식당</label>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              <span className="text-text-disabled">식당을 선택하세요</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">사진</label>
            <button
              type="button"
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-text-disabled"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-xs">사진 추가</span>
            </button>
          </div>

          {/* 별점 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">별점</label>
            <StarRating value={rating} size={32} interactive onChange={setRating} />
          </div>

          {/* 제목 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="맛집에 대한 상세한 후기를 작성해주세요"
              rows={10}
              className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm outline-none placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!title || !content || !rating}>
          발행하기
        </Button>
      </div>
    </div>
  );
}
