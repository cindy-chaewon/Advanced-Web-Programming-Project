"use client";

import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import ImageGallery from "@/components/restaurant/ImageGallery";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { getAiReview, getRestaurant, getReviews, scrapRestaurant, unscrapRestaurant } from "@/lib/api";
import type { AiReviewOut, MapPin, RestaurantRead, ReviewOut } from "@/lib/api";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { key: "info", label: "정보" },
  { key: "reviews", label: "평가리뷰" },
];

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [restaurant, setRestaurant] = useState<RestaurantRead | null>(null);
  const [reviews, setReviews] = useState<ReviewOut[]>([]);
  const [scrapped, setScrapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiReview, setAiReview] = useState<AiReviewOut | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getRestaurant(id), getReviews(id)])
      .then(([r, rv]) => { setRestaurant(r); setReviews(rv); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === "reviews" && reviews.length > 0 && !aiReview && !aiLoading) {
      handleLoadAiReview();
    }
  }, [activeTab, reviews.length]);

  const handleLoadAiReview = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const data = await getAiReview(id);
      setAiReview(data);
    } catch (e: unknown) {
      setAiError((e as Error).message ?? "AI 종합평을 불러오지 못했어요.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleScrap = async () => {
    if (!restaurant) return;
    try {
      if (scrapped) {
        await unscrapRestaurant(id);
        setScrapped(false);
      } else {
        await scrapRestaurant(id);
        setScrapped(true);
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
          식당 정보를 불러올 수 없어요
        </div>
      </div>
    );
  }

  const mapPin: MapPin | undefined =
    restaurant.address
      ? {
          restaurant_id: restaurant.restaurant_id,
          name: restaurant.name,
          lat: Number(restaurant.address.latitude),
          lng: Number(restaurant.address.longitude),
          category: restaurant.category?.name ?? "",
          avg_review_score: restaurant.score?.avg_review_score ?? 0,
          review_count: restaurant.score?.review_count ?? 0,
          address: restaurant.address.full_address ?? "",
          hashtags: restaurant.hashtags,
          thumbnail_url: restaurant.thumbnail_url,
        }
      : undefined;

  const avgScore = restaurant.score?.avg_review_score ?? 0;
  const reviewCount = restaurant.score?.review_count ?? 0;
  const totalScore = restaurant.score?.total_score ?? 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative shrink-0">
        <div className="h-56 overflow-hidden bg-surface">
          {restaurant.images.length > 0 ? (
            <ImageGallery images={restaurant.images} alt={restaurant.name} />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              {restaurant.category?.name === "한식" ? "🍚" :
               restaurant.category?.name === "카페" ? "☕" :
               restaurant.category?.name === "일식" ? "🍣" : "🍽️"}
            </div>
          )}
        </div>
        <PageHeader transparent leftAction="back" />
      </div>

      <div className="shrink-0 border-b border-border bg-white px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">{restaurant.name}</h1>
              {restaurant.category && <Badge variant="primary">{restaurant.category.name}</Badge>}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <StarRating value={avgScore} size={14} />
              <span className="text-sm font-semibold">{avgScore.toFixed(1)}</span>
              <span className="text-sm text-text-secondary">({reviewCount})</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2">
              <span className="text-lg">🏆</span>
              <span className="text-lg font-bold text-brown">{Math.round(totalScore)}</span>
            </div>
            <button
              type="button"
              onClick={handleScrap}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${scrapped ? "bg-primary text-white border-primary" : "border-border text-text-secondary"}`}
            >
              {scrapped ? "🔖 저장됨" : "🔖 저장"}
            </button>
          </div>
        </div>
        {restaurant.description && (
          <p className="mt-2 text-sm text-text-secondary">{restaurant.description}</p>
        )}
      </div>

      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} className="shrink-0" />

      <div className="flex-1 overflow-y-auto bg-white">
        {activeTab === "info" && (
          <div className="flex flex-col gap-0 divide-y divide-border px-4">
            {restaurant.address?.full_address && (
              <InfoRow icon="📍" label="주소" value={restaurant.address.full_address} />
            )}
            {restaurant.opening_hours && (
              <InfoRow icon="🕐" label="영업시간" value={restaurant.opening_hours} />
            )}
            {restaurant.break_time && (
              <InfoRow icon="☕" label="브레이크타임" value={restaurant.break_time} />
            )}
            {restaurant.phone && (
              <InfoRow icon="📞" label="전화번호" value={restaurant.phone} />
            )}
            <InfoRow icon="🔖" label="스크랩" value={`${restaurant.score?.scrap_count ?? 0}명이 저장했어요`} />

            {mapPin && (
              <div className="py-4">
                <p className="mb-2 text-sm font-medium text-text-primary">위치</p>
                <div className="h-40 overflow-hidden rounded-xl">
                  <KakaoMap
                    center={{ lat: mapPin.lat, lng: mapPin.lng }}
                    level={3}
                    pins={[mapPin]}
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}



        {activeTab === "reviews" && (
          <div className="px-4 py-4">

            {/* AI 종합평 카드 */}
            {reviewCount > 0 && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                {!aiReview && !aiLoading && !aiError && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    <span className="text-sm text-amber-600">Gemini가 분석 중이에요...</span>
                  </div>
                )}
                {aiLoading && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    <span className="text-sm text-amber-600">Gemini가 분석 중이에요...</span>
                  </div>
                )}
                {aiError && (
                  <div className="flex flex-col items-center gap-2 py-1">
                    <p className="text-xs text-red-500">{aiError}</p>
                    <button type="button" onClick={handleLoadAiReview} className="text-xs font-medium text-amber-600 underline">
                      다시 시도
                    </button>
                  </div>
                )}
                {aiReview && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="text-base">✨</span>
                      <span className="text-sm font-bold text-amber-700">AI 종합평</span>
                      <span className="ml-auto text-xs text-amber-400">리뷰 {aiReview.review_count}개 · 글 {aiReview.post_count}개 분석</span>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-amber-900">{aiReview.review}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4 flex items-center gap-4 rounded-xl border border-border p-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-text-primary">{avgScore.toFixed(1)}</span>
                <StarRating value={avgScore} size={14} />
                <span className="mt-1 text-xs text-text-secondary">{reviewCount}개 리뷰</span>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const cnt = reviews.filter((r) => r.score === star).length;
                  const pct = reviews.length > 0 ? (cnt / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-2 text-xs text-text-secondary">{star}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-surface h-2">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/restaurants/${id}/review`)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-3 text-sm font-semibold text-primary transition-colors active:bg-primary/5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              리뷰 쓰기
            </button>

            <div className="flex flex-col divide-y divide-border">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.review_id} className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={review.author.username} src={review.author.profile_image ?? undefined} size="xs" />
                    <span className="text-sm font-medium text-text-primary">{review.author.username}</span>
                    {review.score && <StarRating value={review.score} size={12} />}
                    <span className="ml-auto text-xs text-text-disabled">
                      {new Date(review.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{review.content}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-text-disabled">
                    <span>👍 {review.like_count}</span>
                  </div>
                </div>
              )) : (
                <p className="py-8 text-center text-sm text-text-secondary">아직 리뷰가 없어요</p>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}
