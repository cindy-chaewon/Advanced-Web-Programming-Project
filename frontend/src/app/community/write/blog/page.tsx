"use client";

import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Button from "@/components/ui/Button";
import { createPost, searchRestaurants } from "@/lib/api";
import type { RestaurantBrief } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BlogWritePage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantResults, setRestaurantResults] = useState<RestaurantBrief[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantBrief | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRestaurantSearch = async (q: string) => {
    setRestaurantQuery(q);
    if (!q.trim()) { setRestaurantResults([]); return; }
    const data = await searchRestaurants({ q: q.trim() }).catch(() => []);
    setRestaurantResults(data);
  };

  const handleSubmit = async () => {
    if (!selectedRestaurant || !title || !content || !rating) return;
    setSubmitting(true);
    try {
      const post = await createPost({
        type: "blog",
        restaurant_id: selectedRestaurant.restaurant_id,
        title,
        content,
        score: rating,
      });
      router.replace(`/community/${post.post_id}`);
    } catch {
      alert("게시 실패. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="맛집 블로그 작성" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-5">
          {/* 식당 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">식당</label>
            {selectedRestaurant ? (
              <div className="flex items-center justify-between rounded-xl border border-primary px-4 py-3">
                <span className="text-sm font-medium text-text-primary">{selectedRestaurant.name}</span>
                <button type="button" onClick={() => setSelectedRestaurant(null)} className="text-xs text-text-secondary">변경</button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={restaurantQuery}
                  onChange={(e) => handleRestaurantSearch(e.target.value)}
                  onFocus={() => setShowPicker(true)}
                  placeholder="식당을 검색하세요"
                  className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-primary"
                />
                {showPicker && restaurantResults.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-border bg-white shadow">
                    {restaurantResults.map((r) => (
                      <button
                        key={r.restaurant_id}
                        type="button"
                        onClick={() => { setSelectedRestaurant(r); setShowPicker(false); }}
                        className="flex w-full items-center px-4 py-3 text-left text-sm hover:bg-surface"
                      >
                        <span className="font-medium">{r.name}</span>
                        <span className="ml-2 text-xs text-text-secondary">{r.category?.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none placeholder:text-text-disabled focus:border-primary"
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
              className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm outline-none placeholder:text-text-disabled focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button
          fullWidth
          size="lg"
          disabled={!title || !content || !rating || !selectedRestaurant || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "발행 중..." : "발행하기"}
        </Button>
      </div>
    </div>
  );
}
