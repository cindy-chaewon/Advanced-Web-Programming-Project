"use client";

import HashtagChips from "@/components/map/HashtagChips";
import KakaoMap from "@/components/map/KakaoMap";
import RestaurantBottomSheet from "@/components/map/RestaurantBottomSheet";
import Avatar from "@/components/ui/Avatar";
import type { RestaurantPin } from "@/lib/mockData";
import { getNearbyPins, SAMPLE_PINS } from "@/lib/mockData";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

type UserLocation = { lat: number; lng: number };

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="#6b6b6b" strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#1a1a1a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill={active ? "#3b82f6" : "#9ca3af"} />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        stroke={active ? "#3b82f6" : "#9ca3af"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke={active ? "#3b82f6" : "#9ca3af"}
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function getLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("no geolocation")); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

export default function MainMapPage() {
  const [selectedPin, setSelectedPin] = useState<RestaurantPin | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);

  // 첫 진입 시 위치 자동 획득
  useEffect(() => {
    setLocating(true);
    getLocation()
      .then(setUserLocation)
      .catch(() => {}) // 실패 시 기본 위치 사용
      .finally(() => setLocating(false));
  }, []);

  // 현재 위치 기준 주변 핀 (없으면 기본 목업 핀)
  const nearbyPins = useMemo(
    () => (userLocation ? getNearbyPins(userLocation.lat, userLocation.lng) : SAMPLE_PINS),
    [userLocation],
  );

  const mapCenter = userLocation ?? DEFAULT_CENTER;

  const handleLocateMe = () => {
    setLocating(true);
    getLocation()
      .then(setUserLocation)
      .catch(() => {})
      .finally(() => setLocating(false));
  };

  return (
    <div className="relative h-full overflow-hidden">
      <KakaoMap
        pins={nearbyPins}
        center={mapCenter}
        level={4}
        onPinClick={setSelectedPin}
        currentLocation={userLocation ?? undefined}
        className="h-full"
      />

      {/* 상단 오버레이 */}
      <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 pt-4">
          <Link
            href="/search"
            className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-md"
          >
            <SearchIcon />
            <span className="text-sm text-text-disabled">식당, 지역을 검색하세요</span>
          </Link>
          <div className="flex gap-2">
            <Link
              href="/my/notifications"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
            >
              <BellIcon />
            </Link>
            <Link href="/my">
              <Avatar name="나" size="sm" className="shadow-md" />
            </Link>
          </div>
        </div>
        <HashtagChips />
      </div>

      {/* 내 위치 FAB */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute bottom-18 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-95 disabled:opacity-60"
      >
        {locating ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        ) : (
          <LocationIcon active={!!userLocation} />
        )}
      </button>

      {selectedPin && (
        <RestaurantBottomSheet
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
        />
      )}
    </div>
  );
}
