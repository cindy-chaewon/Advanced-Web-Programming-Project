"use client";

import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import ImageGallery from "@/components/restaurant/ImageGallery";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { ApiError, api } from "@/lib/api";
import type { Restaurant, Review } from "@/lib/mockData";
import type {
  AiReviewApi,
  MenuApi,
  RestaurantReadApi,
  ReviewReadApi,
} from "@/types/api";
import { toRestaurant, toReview } from "@/types/api";
import { use, useEffect, useState } from "react";

const TABS = [
  { key: "info", label: "정보" },
  { key: "menu", label: "메뉴" },
  { key: "reviews", label: "평가리뷰" },
];

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("info");
  const [isScrolled, setIsScrolled] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoadError(null);
    Promise.all([
      api.get<RestaurantReadApi>(`/restaurants/${id}`, { auth: false, signal: ac.signal }),
      api.get<MenuApi[]>(`/restaurants/${id}/menus`, { auth: false, signal: ac.signal }),
      api.get<ReviewReadApi[]>(`/restaurants/${id}/reviews`, {
        query: { limit: 50 },
        auth: false,
        signal: ac.signal,
      }),
    ])
      .then(([r, menus, rvs]) => {
        setRestaurant(toRestaurant(r, menus));
        setReviews(rvs.map(toReview));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadError(err instanceof ApiError ? err.message : "식당 정보를 불러오지 못했어요");
      });

    api
      .get<AiReviewApi>(`/restaurants/${id}/ai-review`, { auth: false, signal: ac.signal })
      .then((data) => setAiReview(data.review))
      .catch(() => {}); // AI 평가는 실패해도 페이지 자체에는 영향 없음

    return () => ac.abort();
  }, [id]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-text-secondary">{loadError}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const signatureMenus = restaurant.menus.filter((m) => m.isSignature);
  const allMenus = restaurant.menus;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      {/* 🌟 1. 최상단 고정 헤더 & 간소화 정보 (절대 위치로 띄워서 스크롤에 영향 없음) */}
      <div
        className={`absolute left-0 right-0 top-0 z-50 flex flex-col transition-colors duration-300 ${
          isScrolled ? "bg-white shadow-sm" : "bg-transparent"
        }`}
      >
        <PageHeader transparent={!isScrolled} leftAction="back" />

        {/* 간소화된 식당 정보 (스크롤 시 스르륵 나타남) */}
        <div
          className={`flex items-center justify-between px-4 transition-all duration-300 overflow-hidden ${
            isScrolled ? "h-12 opacity-100" : "h-0 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary max-w-[140px] truncate">
              {restaurant.name}
            </span>
            <Badge variant="primary">{restaurant.category}</Badge>
            <span className="text-sm font-bold text-text-primary">
              ★ {restaurant.rating}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-brown">
            🏆 {restaurant.score}
          </div>
        </div>
      </div>

      {/* 🌟 2. 메인 스크롤 영역 (이곳 전체가 자연스럽게 스크롤됩니다) */}
      <div
        className="flex-1 overflow-y-auto pb-10"
        onScroll={(e) => {
          // 사진 높이(약 200px)만큼 스크롤되면 헤더 변신
          setIsScrolled(e.currentTarget.scrollTop > 200);
        }}
      >
        {/* 사진 갤러리 (높이를 강제로 줄이지 않고 자연스럽게 스크롤되어 올라감) */}
        <div className="h-56 bg-surface">
          <ImageGallery images={restaurant.images} alt={restaurant.name} />
        </div>

        {/* 원본 식당 정보 (자연스럽게 스크롤되어 올라감) */}
        <div className="px-4 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">
                  {restaurant.name}
                </h1>
                <Badge variant="primary">{restaurant.category}</Badge>
                <Badge variant={restaurant.isOpen ? "brown" : "default"}>
                  {restaurant.isOpen ? "영업중" : "영업종료"}
                </Badge>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <StarRating value={restaurant.rating} size={14} />
                <span className="text-sm font-semibold">
                  {restaurant.rating}
                </span>
                <span className="text-sm text-text-secondary">
                  ({restaurant.reviewCount})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2">
              <span className="text-lg">🏆</span>
              <span className="text-lg font-bold text-brown">
                {restaurant.score}
              </span>
            </div>
          </div>
          {restaurant.description && (
            <p className="mt-2 text-sm text-text-secondary">
              {restaurant.description}
            </p>
          )}
        </div>

        {/* 🌟 3. 탭바 (Sticky 속성으로 헤더 밑에 찰싹 달라붙음) */}
        {/* top 값이 isScrolled 상태에 따라 헤더(56px) 또는 헤더+간소화정보(104px) 높이만큼 유동적으로 변함 */}
        <div
          className={`sticky z-40 bg-white border-y border-border transition-all duration-300 ${
            isScrolled ? "top-[104px]" : "top-0 sm:top-14" // 기본 PageHeader 높이(약 56px) 보정
          }`}
          style={{ top: isScrolled ? "104px" : "56px" }}
        >
          <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white">
          {activeTab === "info" && (
            <div className="flex flex-col gap-0 divide-y divide-border px-4">
              <InfoRow icon="📍" label="주소" value={restaurant.address} />
              <InfoRow icon="🕐" label="영업시간" value={restaurant.hours} />
              {restaurant.breakTime && (
                <InfoRow
                  icon="☕"
                  label="브레이크타임"
                  value={restaurant.breakTime}
                />
              )}
              <InfoRow icon="📞" label="전화번호" value={restaurant.phone} />
              <InfoRow
                icon="🔖"
                label="스크랩"
                value={`${restaurant.scraps}명이 저장했어요`}
              />
              <div className="py-4">
                <p className="mb-2 text-sm font-medium text-text-primary">
                  위치
                </p>
                <div className="h-40 overflow-hidden rounded-xl">
                  <KakaoMap
                    center={{ lat: restaurant.lat, lng: restaurant.lng }}
                    level={3}
                    pins={[restaurant]}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "menu" && (
            <div className="px-4 py-4">
              {signatureMenus.length > 0 && (
                <>
                  <h3 className="mb-3 text-sm font-bold text-text-primary">
                    BEST 대표메뉴
                  </h3>
                  <div className="mb-4 flex flex-col gap-3">
                    {signatureMenus.map((menu) => (
                      <div
                        key={menu.id}
                        className="flex items-center justify-between rounded-xl bg-primary/5 p-3"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-text-primary">
                              {menu.name}
                            </span>
                            <Badge variant="primary">BEST</Badge>
                          </div>
                          {menu.description && (
                            <p className="mt-0.5 text-xs text-text-secondary">
                              {menu.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-brown">
                          {menu.price.toLocaleString()}원
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <h3 className="mb-3 text-sm font-bold text-text-primary">
                전체 메뉴
              </h3>
              <div className="flex flex-col divide-y divide-border">
                {allMenus.map((menu) => (
                  <div
                    key={menu.id}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm text-text-primary">
                      {menu.name}
                    </span>
                    <span className="text-sm font-medium text-text-secondary">
                      {menu.price.toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="px-4 py-4">
              <div className="mb-4 flex items-center gap-4 rounded-xl border border-border p-4">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-text-primary">
                    {restaurant.rating}
                  </span>
                  <StarRating value={restaurant.rating} size={14} />
                  <span className="mt-1 text-xs text-text-secondary">
                    {restaurant.reviewCount}개 리뷰
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-2 text-xs text-text-secondary">
                        {star}
                      </span>
                      <div className="flex-1 overflow-hidden rounded-full bg-surface h-2">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : 5}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {aiReview && (
                <div className="mb-4 rounded-2xl bg-primary/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span className="text-sm font-bold text-brown">
                      AI 종합 평가
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">
                    {aiReview}
                  </p>
                </div>
              )}
              <div className="flex flex-col divide-y divide-border">
                {reviews.map((review) => (
                  <div key={review.id} className="py-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar
                        name={review.author.name}
                        src={review.author.avatar}
                        size="xs"
                      />
                      <span className="text-sm font-medium text-text-primary">
                        {review.author.name}
                      </span>
                      <StarRating value={review.rating} size={12} />
                      <span className="ml-auto text-xs text-text-disabled">
                        {review.createdAt}
                      </span>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                      {review.content}
                    </p>
                    {review.images && review.images.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {review.images.slice(0, 4).map((url, i) => (
                          <div
                            key={url + i}
                            className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface"
                          >
                            <img
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                        {review.images.length > 4 && (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-medium text-text-secondary">
                            +{review.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-text-disabled">
                      <span>❤ {review.likeCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
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
