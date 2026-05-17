"use client";

import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import TabBar from "@/components/layout/TabBar";
import PostCard from "@/components/community/PostCard";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { SAMPLE_FRIENDS, SAMPLE_PINS, SAMPLE_POSTS } from "@/lib/mockData";
import { use, useState } from "react";

const TABS = [
  { key: "reviews", label: "작성 리뷰" },
  { key: "blogs", label: "블로그 리뷰" },
  { key: "scraps", label: "스크랩" },
];

export default function FriendProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const friend = SAMPLE_FRIENDS.find((f) => f.id === id) ?? SAMPLE_FRIENDS[0];

  const [activeTab, setActiveTab] = useState("reviews");
  const [isRequested, setIsRequested] = useState(false); // 친구 요청을 보냈는지 상태 관리

  // 🌟 핵심: 현재 친구 상태인지 확인하는 변수
  // (실제 백엔드 연결 시에는 서버에서 받아온 정보를 바탕으로 true/false가 결정됩니다)
  const isFriend = friend.status === "friend";

  const simpleReviews = SAMPLE_POSTS.filter((p) => p.type === "simple");
  const blogPosts = SAMPLE_POSTS.filter((p) => p.type !== "simple");
  const scraps = SAMPLE_PINS;

  // 친구 추가 버튼 클릭 함수
  const handleRequestFriend = () => {
    setIsRequested(true);
    alert("친구 요청을 보냈습니다!");
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-surface">
      <PageHeader title={`${friend.name}님의 프로필`} leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        {/* 프로필 정보 영역 */}
        <div className="bg-white px-4 py-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar name={friend.name} src={friend.avatar} size="lg" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-text-primary">
                {friend.name}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {(friend as any).statusMessage || "맛있는 걸 좋아하는 미식가"}
              </p>
            </div>

            {isFriend ? (
              <div className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-brown">
                나와 단짝 친구
              </div>
            ) : isRequested ? (
              <button
                disabled
                className="mt-2 rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-text-secondary"
              >
                요청 대기 중
              </button>
            ) : (
              <button
                onClick={handleRequestFriend}
                className="mt-2 rounded-full bg-brown px-4 py-1.5 text-xs font-bold text-white transition-opacity active:opacity-80"
              >
                친구 추가하기
              </button>
            )}
          </div>
        </div>

        {/* 🌟 친구일 때만 맛집 지도와 탭 내용을 보여주고, 아니면 자물쇠 화면을 보여줍니다 */}
        {isFriend ? (
          <>
            {/* 친구 맛집 지도 */}
            <div className="mt-2 bg-white">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-bold text-text-primary">
                  친구가 다녀간 맛집 🗺️
                </h3>
                <span className="text-xs font-medium text-text-secondary">
                  총 {scraps.length}곳
                </span>
              </div>
              <div className="h-60 w-full">
                <KakaoMap
                  pins={scraps}
                  center={{ lat: 37.4979, lng: 127.0276 }}
                  level={5}
                  className="h-full"
                />
              </div>
            </div>

            {/* 하단 활동 내역 탭 & 리스트 */}
            <div className="mt-2 flex-1 bg-white min-h-[400px]">
              <div className="sticky top-0 z-10 border-b border-border bg-white">
                <TabBar
                  tabs={TABS}
                  activeKey={activeTab}
                  onChange={setActiveTab}
                />
              </div>

              <div className="px-4 py-4">
                {activeTab === "reviews" && (
                  <div className="flex flex-col gap-4">
                    {simpleReviews.length > 0 ? (
                      simpleReviews.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))
                    ) : (
                      <EmptyState icon="📝" title="작성한 리뷰가 없어요" />
                    )}
                  </div>
                )}

                {activeTab === "blogs" && (
                  <div className="flex flex-col gap-4">
                    {blogPosts.length > 0 ? (
                      blogPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))
                    ) : (
                      <EmptyState icon="📓" title="작성한 블로그가 없어요" />
                    )}
                  </div>
                )}

                {activeTab === "scraps" && (
                  <div className="divide-y divide-border">
                    {scraps.length > 0 ? (
                      scraps.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                        />
                      ))
                    ) : (
                      <EmptyState icon="🔖" title="스크랩한 맛집이 없어요" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-2 flex min-h-[300px] flex-1 flex-col items-center justify-center bg-white px-4 py-20 text-center">
            <span className="mb-4 text-5xl opacity-80">🔒</span>
            <h3 className="text-base font-bold text-text-primary">
              친구가 비공개로 설정한 프로필입니다
            </h3>
            <p className="mt-1.5 text-sm text-text-secondary">
              친구 추가를 하시면 맛집 지도와 리뷰를 확인할 수 있어요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
