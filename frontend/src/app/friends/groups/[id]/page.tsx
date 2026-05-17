"use client";

import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import Avatar from "@/components/ui/Avatar";
import { SAMPLE_GROUPS, SAMPLE_PINS } from "@/lib/mockData";
import { use, useState } from "react";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const group = SAMPLE_GROUPS.find((g) => g.id === id) ?? SAMPLE_GROUPS[0];

  const [groupRestaurants, setGroupRestaurants] = useState(
    SAMPLE_PINS.slice(0, 3),
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const handleAddRestaurant = (restaurantName: string) => {
    alert(`'${restaurantName}'이(가) 그룹 맛집으로 등록되었습니다!`);
    setIsAddModalOpen(false);
  };

  const handleDeleteRestaurant = (
    restaurantId: string,
    restaurantName: string,
  ) => {
    if (window.confirm(`'${restaurantName}'을(를) 정말 삭제하시겠습니까?`)) {
      setGroupRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <PageHeader title={group.name} leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl">
              {group.coverEmoji}
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {group.name}
              </p>
              {group.description && (
                <p className="text-sm text-text-secondary">
                  {group.description}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              멤버 {group.memberCount}명
            </p>
            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex shrink-0 flex-col items-center gap-1"
                >
                  <Avatar name={m.name} src={m.avatar} size="md" />
                  <span className="text-xs text-text-secondary">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 그룹 지도 */}
        <div className="border-b border-border">
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-text-primary">
              그룹 맛집 지도
            </p>
          </div>
          <div className="h-52">
            <KakaoMap
              pins={groupRestaurants} // 지도 핀도 현재 상태의 리스트와 동기화
              center={{ lat: 37.4979, lng: 127.0276 }}
              level={4}
              className="h-full"
            />
          </div>

          {/* 그룹 맛집 추가 버튼 */}
          <div className="bg-surface px-4 py-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-sm font-bold text-brown shadow-sm transition-opacity active:opacity-70"
            >
              <span className="text-base">➕</span>
              내가 스크랩한 맛집 추가하기
            </button>
          </div>
        </div>

        {/* 맛집 리스트 */}
        <div className="px-4 pb-10">
          <div className="flex items-center justify-between py-3">
            <p className="text-sm font-bold text-text-primary">
              그룹 맛집{" "}
              <span className="text-primary">{groupRestaurants.length}</span>
            </p>
            {groupRestaurants.length > 0 && (
              <button
                onClick={() => setIsDeleteMode(!isDeleteMode)}
                className="text-xs font-medium text-text-disabled underline transition-opacity active:opacity-70"
              >
                {isDeleteMode ? "취소" : "그룹 맛집 삭제"}
              </button>
            )}
          </div>

          {/* 리스트 출력 */}
          <div className="divide-y divide-border">
            {groupRestaurants.length === 0 ? (
              <div className="py-10 text-center text-sm text-text-secondary">
                등록된 그룹 맛집이 없습니다.
              </div>
            ) : (
              groupRestaurants.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  {/* 기존 카드는 남은 공간을 다 차지하도록 flex-1 부여 */}
                  <div className="min-w-0 flex-1">
                    <RestaurantCard restaurant={r} />
                  </div>

                  {/* 🌟 삭제 모드일 때만 나타나는 삭제 버튼 */}
                  {isDeleteMode && (
                    <button
                      onClick={() => handleDeleteRestaurant(r.id, r.name)}
                      className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-500 transition-colors active:bg-red-100"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 맛집 추가 모달 (바텀 시트) */}
      {isAddModalOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40">
          <div className="flex-1" onClick={() => setIsAddModalOpen(false)} />

          <div className="flex h-3/4 animate-slide-up flex-col rounded-t-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-base font-bold text-text-primary">
                내 스크랩 맛집 불러오기
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-lg font-bold text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-2">
              <p className="py-2 text-xs text-text-secondary">
                그룹 지도에 등록할 맛집을 선택해주세요.
              </p>

              <div className="flex flex-col">
                {SAMPLE_PINS.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center justify-between border-b border-border py-4 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-text-primary">
                        {restaurant.name}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {restaurant.category} · ★ {restaurant.rating}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddRestaurant(restaurant.name)}
                      className="shrink-0 rounded-lg bg-brown px-4 py-2 text-xs font-bold text-white transition-opacity active:opacity-80"
                    >
                      추가
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
