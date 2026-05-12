"use client";

import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import ImageGallery from "@/components/restaurant/ImageGallery";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { SAMPLE_RESTAURANTS, SAMPLE_REVIEWS } from "@/lib/mockData";
import { use, useState } from "react";

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

  const restaurant = SAMPLE_RESTAURANTS.find((r) => r.id === id) ?? SAMPLE_RESTAURANTS[0];
  const reviews = SAMPLE_REVIEWS;

  const signatureMenus = restaurant.menus.filter((m) => m.isSignature);
  const allMenus = restaurant.menus;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 사진 갤러리 + 헤더 */}
      <div className="relative shrink-0">
        <div className="h-56 overflow-hidden bg-surface">
          <ImageGallery images={restaurant.images} alt={restaurant.name} />
        </div>
        <PageHeader transparent leftAction="back" />
      </div>

      {/* 식당 기본 정보 */}
      <div className="shrink-0 border-b border-border bg-white px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">{restaurant.name}</h1>
              <Badge variant="primary">{restaurant.category}</Badge>
              <Badge variant={restaurant.isOpen ? "brown" : "default"}>
                {restaurant.isOpen ? "영업중" : "영업종료"}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <StarRating value={restaurant.rating} size={14} />
              <span className="text-sm font-semibold">{restaurant.rating}</span>
              <span className="text-sm text-text-secondary">({restaurant.reviewCount})</span>
            </div>
          </div>
          {/* 맛집 점수 */}
          <div className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2">
            <span className="text-lg">🏆</span>
            <span className="text-lg font-bold text-brown">{restaurant.score}</span>
          </div>
        </div>
        {restaurant.description && (
          <p className="mt-2 text-sm text-text-secondary">{restaurant.description}</p>
        )}
      </div>

      {/* 탭 */}
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} className="shrink-0" />

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto bg-white">
        {activeTab === "info" && (
          <div className="flex flex-col gap-0 divide-y divide-border px-4">
            <InfoRow icon="📍" label="주소" value={restaurant.address} />
            <InfoRow icon="🕐" label="영업시간" value={restaurant.hours} />
            {restaurant.breakTime && (
              <InfoRow icon="☕" label="브레이크타임" value={restaurant.breakTime} />
            )}
            <InfoRow icon="📞" label="전화번호" value={restaurant.phone} />
            <InfoRow icon="🔖" label="스크랩" value={`${restaurant.scraps}명이 저장했어요`} />

            {/* 미니 지도 */}
            <div className="py-4">
              <p className="mb-2 text-sm font-medium text-text-primary">위치</p>
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
                <h3 className="mb-3 text-sm font-bold text-text-primary">BEST 대표메뉴</h3>
                <div className="mb-4 flex flex-col gap-3">
                  {signatureMenus.map((menu) => (
                    <div key={menu.id} className="flex items-center justify-between rounded-xl bg-primary/5 p-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-text-primary">{menu.name}</span>
                          <Badge variant="primary">BEST</Badge>
                        </div>
                        {menu.description && (
                          <p className="mt-0.5 text-xs text-text-secondary">{menu.description}</p>
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

            <h3 className="mb-3 text-sm font-bold text-text-primary">전체 메뉴</h3>
            <div className="flex flex-col divide-y divide-border">
              {allMenus.map((menu) => (
                <div key={menu.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-text-primary">{menu.name}</span>
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
            {/* AI 종합 평가 */}
            <div className="mb-4 rounded-2xl bg-primary/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🤖</span>
                <span className="text-sm font-bold text-brown">AI 종합 평가</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                국물이 진하고 면발이 쫄깃하다는 평가가 많아요. 가성비가 좋고 혼밥하기 좋은 환경이에요.
                점심 시간대에는 웨이팅이 있을 수 있으니 참고하세요.
              </p>
            </div>

            {/* 별점 분포 */}
            <div className="mb-4 flex items-center gap-4 rounded-xl border border-border p-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-text-primary">{restaurant.rating}</span>
                <StarRating value={restaurant.rating} size={14} />
                <span className="mt-1 text-xs text-text-secondary">{restaurant.reviewCount}개 리뷰</span>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-2 text-xs text-text-secondary">{star}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-surface h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : 5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 리뷰 리스트 */}
            <div className="flex flex-col divide-y divide-border">
              {reviews.map((review) => (
                <div key={review.id} className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={review.author.name} src={review.author.avatar} size="xs" />
                    <span className="text-sm font-medium text-text-primary">{review.author.name}</span>
                    <StarRating value={review.rating} size={12} />
                    <span className="ml-auto text-xs text-text-disabled">{review.createdAt}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{review.content}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-text-disabled">
                    <span>👍 {review.likeCount}</span>
                  </div>
                </div>
              ))}
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
