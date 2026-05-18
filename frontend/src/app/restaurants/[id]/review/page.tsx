"use client";

import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Button from "@/components/ui/Button";
import { createReview, getRestaurant } from "@/lib/api";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RATING_LABELS = ["별점을 선택해주세요", "별로에요", "그저 그래요", "보통이에요", "맛있어요", "최고에요"];

export default function ReviewWritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [score, setScore] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getRestaurant(id).then((r) => setRestaurantName(r.name)).catch(() => {});
  }, [id]);

  const handleSubmit = async () => {
    if (!score || !content.trim()) return;
    setSubmitting(true);
    try {
      await createReview(id, { content: content.trim(), score });
      router.back();
    } catch {
      alert("리뷰 등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="리뷰 작성" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-8">
          {/* 식당명 */}
          {restaurantName && (
            <div className="text-center">
              <p className="text-xs text-text-secondary">리뷰를 남길 식당</p>
              <p className="mt-1 text-lg font-bold text-text-primary">{restaurantName}</p>
            </div>
          )}

          {/* 별점 */}
          <div className="flex flex-col items-center gap-3">
            <StarRating value={score} size={48} interactive onChange={setScore} />
            <p className="text-sm font-semibold text-primary">{RATING_LABELS[score]}</p>
          </div>

          {/* 구분선 */}
          <div className="h-px bg-border" />

          {/* 리뷰 내용 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-primary">후기</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="솔직한 후기를 남겨보세요&#10;음식 맛, 서비스, 분위기 등 어떠셨나요?"
              maxLength={200}
              rows={6}
              className="w-full resize-none rounded-2xl border border-border px-4 py-3.5 text-sm leading-relaxed outline-none placeholder:text-text-disabled focus:border-primary"
            />
            <p className="mt-1.5 text-right text-xs text-text-disabled">{content.length}/200</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button
          fullWidth
          size="lg"
          disabled={!score || !content.trim() || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "등록 중..." : "리뷰 등록하기"}
        </Button>
      </div>
    </div>
  );
}
