"use client";

import HashtagChips from "@/components/map/HashtagChips";
import KakaoMap from "@/components/map/KakaoMap";
import RestaurantBottomSheet from "@/components/map/RestaurantBottomSheet";
import Avatar from "@/components/ui/Avatar";
import { getMe, getNearbyRestaurants, toMapPin } from "@/lib/api";
import type { MapPin } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      <circle cx="12" cy="12" r="8" stroke={active ? "#3b82f6" : "#9ca3af"} strokeWidth="1.5" strokeDasharray="2 2" />
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
  const router = useRouter();
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [clusterPins, setClusterPins] = useState<MapPin[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>("나");

  useEffect(() => {
    getMe().then((me) => {
      setProfileImage(me.profile_image);
      setProfileName(me.username);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLocating(true);
    getLocation()
      .then(async (loc) => {
        setUserLocation(loc);
        try {
          const restaurants = await getNearbyRestaurants(loc.lat, loc.lng, 2000);
          setPins(restaurants.map(toMapPin));
        } catch {
          // 위치는 있지만 API 실패 시 빈 핀으로
        }
      })
      .catch(() => {})
      .finally(() => setLocating(false));
  }, []);

  const mapCenter = userLocation ?? DEFAULT_CENTER;

  const handleLocateMe = () => {
    setLocating(true);
    getLocation()
      .then(async (loc) => {
        setUserLocation(loc);
        try {
          const restaurants = await getNearbyRestaurants(loc.lat, loc.lng, 2000);
          setPins(restaurants.map(toMapPin));
        } catch {
          // ignore
        }
      })
      .catch(() => {})
      .finally(() => setLocating(false));
  };

  return (
    <div className="relative h-full overflow-hidden">
      <KakaoMap
        pins={selectedTag ? pins.filter((p) => p.category === selectedTag) : pins}
        center={mapCenter}
        level={4}
        onPinClick={setSelectedPin}
        onClusterClick={setClusterPins}
        currentLocation={userLocation ?? undefined}
        className="h-full"
      />

      <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 pt-4">
          <Link
            href="/search"
            className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-md"
          >
            <SearchIcon />
            <span className="text-sm text-text-disabled">식당, 지역을 검색하세요</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/my/notifications"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
            >
              <BellIcon />
            </Link>
            <Link href="/my" className="flex items-center justify-center">
              <Avatar src={profileImage} name={profileName} size="sm" className="shadow-md" />
            </Link>
          </div>
        </div>
        <HashtagChips selected={selectedTag} onSelect={setSelectedTag} />
      </div>

      <button
        type="button"
        onClick={() => router.push("/restaurants/new")}
        className="absolute bottom-32 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
        aria-label="식당 등록"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

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

      {clusterPins.length > 0 && !selectedPin && (
        <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-white shadow-2xl">
          {/* 드래그 핸들 */}
          <div className="flex justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 pb-4 pt-4">
            <div>
              <p className="text-xs font-medium text-text-secondary">이 위치의 식당</p>
              <p className="text-lg font-bold text-text-primary">{clusterPins.length}곳</p>
            </div>
            <button
              type="button"
              onClick={() => setClusterPins([])}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-text-secondary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {/* 구분선 */}
          <div className="mx-6 h-px bg-gray-100" />
          {/* 목록 */}
          <div className="max-h-72 overflow-y-auto py-2 pb-8">
            {clusterPins.map((pin) => (
              <button
                key={pin.restaurant_id}
                type="button"
                onClick={() => { setSelectedPin(pin); setClusterPins([]); }}
                className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors active:bg-surface"
              >
                {pin.thumbnail_url ? (
                  <img src={pin.thumbnail_url} alt={pin.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl">🍽️</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-text-primary">{pin.name}</p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">{pin.category}</p>
                  {pin.avg_review_score > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs font-semibold text-amber-500">★ {pin.avg_review_score.toFixed(1)}</span>
                      <span className="text-xs text-text-disabled">({pin.review_count})</span>
                    </div>
                  )}
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPin && (
        <RestaurantBottomSheet
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
        />
      )}
    </div>
  );
}
