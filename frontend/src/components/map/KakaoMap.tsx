"use client";

import type { MapPin } from "@/lib/api";
import { useEffect, useRef } from "react";

type KakaoMapProps = {
  pins?: MapPin[];
  center: { lat: number; lng: number };
  level?: number;
  onPinClick?: (pin: MapPin) => void;
  onClusterClick?: (pins: MapPin[]) => void;
  currentLocation?: { lat: number; lng: number };
  className?: string;
};

const TRANSPARENT_IMG =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function KakaoMap({
  pins = [],
  center,
  level = 4,
  onPinClick,
  onClusterClick,
  currentLocation,
  className = "",
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const createMap = () => {
      if (cancelled || !containerRef.current) return;

      const kakaoMaps = window.kakao.maps;
      const map = new kakaoMaps.Map(containerRef.current, {
        center: new kakaoMaps.LatLng(center.lat, center.lng),
        level,
      });

      // 현재 위치 파란 점
      if (currentLocation) {
        const dot = document.createElement("div");
        dot.style.cssText = `
          width:16px;height:16px;border-radius:50%;
          background:#3b82f6;border:3px solid white;
          box-shadow:0 0 0 4px rgba(59,130,246,0.25);
        `;
        new kakaoMaps.CustomOverlay({
          position: new kakaoMaps.LatLng(currentLocation.lat, currentLocation.lng),
          content: dot,
          map,
          yAnchor: 0.5,
          zIndex: 10,
        });
      }

      const transparentImage = new kakaoMaps.MarkerImage(
        TRANSPARENT_IMG,
        new kakaoMaps.Size(1, 1),
        { offset: new kakaoMaps.Point(0, 0) },
      );

      type Pair = { marker: KakaoMarker; overlay: KakaoCustomOverlay; pin: MapPin };
      const pairs: Pair[] = pins.map((pin) => {
        const pos = new kakaoMaps.LatLng(pin.lat, pin.lng);

        const marker = new kakaoMaps.Marker({ position: pos, image: transparentImage });

        const el = document.createElement("div");
        Object.assign(el.style, {
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
        el.textContent = pin.name;
        if (onPinClick) el.addEventListener("click", () => onPinClick(pin));

        const overlay = new kakaoMaps.CustomOverlay({
          position: pos,
          content: el,
          map,
          yAnchor: 1.3,
          zIndex: 3,
        });

        return { marker, overlay, pin };
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const MarkerClusterer = (kakaoMaps as any).MarkerClusterer;
      if (!MarkerClusterer) return;

      const markerToPin = new Map<KakaoMarker, MapPin>(
        pairs.map(({ marker, pin }) => [marker, pin]),
      );

      const clusterer = new MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 1,       // 항상 클러스터링 유지
        gridSize: 80,
        disableClickZoom: true,   // 클릭해도 줌인 안 함
        styles: [
          {
            width: "44px",
            height: "44px",
            background: "#ffc107",
            borderRadius: "50%",
            color: "#895129",
            textAlign: "center",
            fontWeight: "700",
            lineHeight: "44px",
            border: "2px solid #895129",
            fontSize: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          },
        ],
      });

      clusterer.addMarkers(pairs.map((p) => p.marker));

      // 클러스터 클릭 → 해당 핀 목록을 부모로 전달
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (kakaoMaps.event as any).addListener(clusterer, "clusterclick", (cluster: any) => {
        if (!onClusterClick) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clusterPins = (cluster.getMarkers() as KakaoMarker[])
          .map((m) => markerToPin.get(m))
          .filter((p): p is MapPin => p !== undefined);
        onClusterClick(clusterPins);
      });

      // 마커가 클러스터에 포함되면 오버레이 숨김
      const syncOverlays = () => {
        pairs.forEach(({ marker, overlay }) => {
          overlay.setMap(marker.getMap() ? map : null);
        });
      };

      setTimeout(syncOverlays, 150);
      kakaoMaps.event.addListener(map, "idle", syncOverlays);
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
      if (window.kakao?.maps) initMap();
      else setTimeout(waitForKakao, 100);
    };

    waitForKakao();
    return () => { cancelled = true; };
  }, [center.lat, center.lng, level, pins, onPinClick, onClusterClick, currentLocation]);

  return <div ref={containerRef} className={["w-full", className].join(" ")} />;
}
