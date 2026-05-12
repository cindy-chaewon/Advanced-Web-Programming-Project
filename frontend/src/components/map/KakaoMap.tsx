"use client";

import type { RestaurantPin } from "@/lib/mockData";
import { useEffect, useRef } from "react";

type KakaoMapProps = {
  pins?: RestaurantPin[];
  center: { lat: number; lng: number };
  level?: number;
  onPinClick?: (pin: RestaurantPin) => void;
  /** 파란 점으로 현재 위치 표시 */
  currentLocation?: { lat: number; lng: number };
  className?: string;
};

export default function KakaoMap({
  pins = [],
  center,
  level = 4,
  onPinClick,
  currentLocation,
  className = "",
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const createMap = () => {
      if (cancelled || !containerRef.current) return;

      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });

      // 현재 위치 파란 점
      if (currentLocation) {
        const dot = document.createElement("div");
        dot.style.cssText = `
          width: 16px; height: 16px; border-radius: 50%;
          background: #3b82f6; border: 3px solid white;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.25);
        `;
        new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng),
          content: dot,
          map,
          yAnchor: 0.5,
          zIndex: 10,
        });
      }

      // 식당 핀
      pins.forEach((pin) => {
        const contentEl = document.createElement("div");
        Object.assign(contentEl.style, {
          background: "#ffc107",
          color: "#895129",
          borderRadius: "20px",
          padding: "6px 12px",
          fontSize: "13px",
          fontWeight: "700",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          border: "2px solid #895129",
          cursor: "pointer",
        });
        contentEl.textContent = pin.name;

        if (onPinClick) {
          contentEl.addEventListener("click", () => onPinClick(pin));
        }

        new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(pin.lat, pin.lng),
          content: contentEl,
          map,
          yAnchor: 1.3,
          zIndex: 3,
        });
      });
    };

    const initMap = () => {
      if (cancelled) return;
      if (window.kakao.maps.Map) {
        requestAnimationFrame(() => { if (!cancelled) createMap(); });
      } else {
        window.kakao.maps.load(() => { if (!cancelled) createMap(); });
      }
    };

    const waitForKakao = () => {
      if (cancelled) return;
      if (window.kakao?.maps) {
        initMap();
      } else {
        setTimeout(waitForKakao, 100);
      }
    };

    waitForKakao();
    return () => { cancelled = true; };
  }, [center.lat, center.lng, level, pins, onPinClick, currentLocation]);

  return <div ref={containerRef} className={["w-full", className].join(" ")} />;
}
