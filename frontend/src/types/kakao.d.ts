declare global {
  interface Window {
    kakao: KakaoNamespace;
  }

  interface KakaoNamespace {
    maps: KakaoMaps;
  }

  interface KakaoMaps {
    load: (callback: () => void) => void;
    Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMapInstance;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
    CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
    InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
    event: {
      addListener: (target: object, type: string, handler: () => void) => void;
      removeListener: (target: object, type: string, handler: () => void) => void;
    };
    Size: new (width: number, height: number) => object;
    Point: new (x: number, y: number) => object;
    MarkerImage: new (src: string, size: object, options?: object) => object;
    services: {
      Geocoder: new () => KakaoGeocoder;
      Status: { OK: string };
    };
  }

  interface KakaoGeocoder {
    addressSearch: (
      query: string,
      cb: (result: KakaoAddressResult[], status: string) => void,
    ) => void;
  }

  interface KakaoAddressResult {
    address_name: string;
    x: string;
    y: string;
  }

  interface KakaoMapOptions {
    center: KakaoLatLng;
    level?: number;
  }

  interface KakaoMarkerOptions {
    position: KakaoLatLng;
    map?: KakaoMapInstance;
    image?: object;
    title?: string;
  }

  interface KakaoCustomOverlayOptions {
    position: KakaoLatLng;
    content: string | HTMLElement;
    map?: KakaoMapInstance;
    yAnchor?: number;
    zIndex?: number;
  }

  interface KakaoInfoWindowOptions {
    content: string;
    removable?: boolean;
  }

  interface KakaoMapInstance {
    setCenter: (latlng: KakaoLatLng) => void;
    setLevel: (level: number) => void;
    getCenter: () => KakaoLatLng;
    getLevel: () => number;
  }

  interface KakaoLatLng {
    getLat: () => number;
    getLng: () => number;
  }

  interface KakaoMarker {
    setMap: (map: KakaoMapInstance | null) => void;
    getMap: () => KakaoMapInstance | null;
    getPosition: () => KakaoLatLng;
  }

  interface KakaoCustomOverlay {
    setMap: (map: KakaoMapInstance | null) => void;
  }

  interface KakaoInfoWindow {
    open: (map: KakaoMapInstance, marker: KakaoMarker) => void;
    close: () => void;
  }
}

export {};
