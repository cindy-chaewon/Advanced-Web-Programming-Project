"use client";

import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import Avatar from "@/components/ui/Avatar";
import {
  getGroup, getGroupMembers, getGroupRestaurants,
  getFriends, getMe, inviteGroupMembers, toMapPin,
} from "@/lib/api";
import type { FriendOut, GroupMemberOut, GroupOut, MapPin, RestaurantBrief } from "@/lib/api";
import { use, useEffect, useState } from "react";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupOut | null>(null);
  const [members, setMembers] = useState<GroupMemberOut[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantBrief[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<number | null>(null);

  // 초대 시트
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [friends, setFriends] = useState<FriendOut[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    Promise.all([
      getGroup(id),
      getGroupMembers(id).catch(() => [] as GroupMemberOut[]),
      getGroupRestaurants(id).catch(() => [] as RestaurantBrief[]),
      getMe().catch(() => null),
    ]).then(([g, m, r, me]) => {
      setGroup(g);
      setMembers(m);
      setRestaurants(r);
      setPins(r.filter((x) => x.address).map(toMapPin));
      if (me) setMyUserId(me.user_id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const openInviteSheet = async () => {
    const allFriends = await getFriends().catch(() => [] as FriendOut[]);
    const memberIdSet = new Set(members.map((m) => m.user_id));
    setFriends(allFriends.filter((f) => !memberIdSet.has(f.user_id)));
    setSelectedIds(new Set());
    setShowInviteSheet(true);
  };

  const toggleSelect = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleInvite = async () => {
    if (selectedIds.size === 0) return;
    setInviting(true);
    try {
      await inviteGroupMembers(id, [...selectedIds]);
      const updated = await getGroupMembers(id).catch(() => members);
      setMembers(updated);
      setShowInviteSheet(false);
    } catch {
      alert("초대에 실패했어요. 다시 시도해주세요.");
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">그룹을 불러올 수 없어요</div>
      </div>
    );
  }

  const isOwner = myUserId === group.owner_id;

  const mapCenter = pins.length > 0
    ? { lat: pins[0].lat, lng: pins[0].lng }
    : { lat: 37.5665, lng: 126.978 };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <PageHeader title={group.name} leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl">
              {group.icon ?? "👥"}
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{group.name}</p>
              <p className="text-sm text-text-secondary">멤버 {group.member_count}명</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">멤버</span>
            {isOwner && (
              <button
                type="button"
                onClick={openInviteSheet}
                className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-primary"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                초대
              </button>
            )}
          </div>

          {members.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {members.map((m) => (
                <div key={m.user_id} className="flex shrink-0 flex-col items-center gap-1">
                  <Avatar name={m.username} src={m.profile_image ?? undefined} size="md" />
                  <span className="text-xs text-text-secondary">{m.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {pins.length > 0 && (
          <div className="border-b border-border">
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-text-primary">그룹 맛집 지도</p>
            </div>
            <div className="h-52">
              <KakaoMap pins={pins} center={mapCenter} level={4} className="h-full" />
            </div>
          </div>
        )}

        <div className="px-4">
          <div className="flex items-center justify-between py-3">
            <p className="text-sm font-bold text-text-primary">
              그룹 맛집 <span className="text-primary">{restaurants.length}</span>
            </p>
          </div>
          <div className="divide-y divide-border">
            {restaurants.map((r) => <RestaurantCard key={r.restaurant_id} restaurant={r} />)}
          </div>
        </div>
      </div>

      {/* 멤버 초대 바텀시트 */}
      {showInviteSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowInviteSheet(false)} />
          <div className="relative flex max-h-[75%] flex-col rounded-t-3xl bg-white shadow-2xl">
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 pb-4 pt-4">
              <div>
                <p className="text-xs font-medium text-text-secondary">그룹에 초대하기</p>
                <p className="text-lg font-bold text-text-primary">친구 선택</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteSheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-text-secondary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mx-6 h-px bg-gray-100" />

            {/* 친구 목록 */}
            <div className="flex-1 overflow-y-auto py-2">
              {friends.length === 0 ? (
                <p className="py-12 text-center text-sm text-text-secondary">초대할 수 있는 친구가 없어요</p>
              ) : (
                <div className="flex flex-col">
                  {friends.map((f) => {
                    const checked = selectedIds.has(f.user_id);
                    return (
                      <button
                        key={f.user_id}
                        type="button"
                        onClick={() => toggleSelect(f.user_id)}
                        className={[
                          "flex items-center gap-4 px-6 py-4 transition-colors",
                          checked ? "bg-primary/8" : "active:bg-surface",
                        ].join(" ")}
                      >
                        <Avatar name={f.username} src={f.profile_image ?? undefined} size="md" />
                        <span className="flex-1 text-left text-base font-semibold text-text-primary">{f.username}</span>
                        <div className={[
                          "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                          checked ? "border-primary bg-primary" : "border-gray-300 bg-white",
                        ].join(" ")}>
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 초대 버튼 */}
            <div className="px-6 pt-3" style={{ paddingBottom: "3rem" }}>
              <button
                type="button"
                onClick={handleInvite}
                disabled={selectedIds.size === 0 || inviting}
                className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-md transition-opacity disabled:opacity-40"
              >
                {inviting ? "초대 중..." : selectedIds.size > 0 ? `${selectedIds.size}명 초대하기` : "초대하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
