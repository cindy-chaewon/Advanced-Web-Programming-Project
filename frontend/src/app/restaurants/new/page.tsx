"use client";

import PageHeader from "@/components/layout/PageHeader";
import AddressPicker, {
  type PickedAddress,
} from "@/components/restaurant/AddressPicker";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { uploadImages } from "@/lib/upload";
import type { CategoryApi } from "@/types/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CreatedRestaurant = { restaurant_id: number };

const FALLBACK_COORD = { lat: 37.4516, lng: 127.1306 };

async function geocodeAddress(addr: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    // kakao.maps.services는 SDK가 ?libraries=services 옵션으로 로드돼야 사용 가능
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const services = (window as any).kakao?.maps?.services;
    if (!services?.Geocoder) {
      resolve(null);
      return;
    }
    const g = new services.Geocoder();
    g.addressSearch(
      addr,
      (
        result: Array<{ x: string; y: string }>,
        status: string,
      ) => {
        if (status === services.Status.OK && result[0]) {
          resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
        } else {
          resolve(null);
        }
      },
    );
  });
}

export default function RestaurantNewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategoryApi[]>([]);
  const [form, setForm] = useState({
    name: "",
    category_id: 0,
    address: "",
    phone: "",
    hours: "",
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedCoord, setPickedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    api
      .get<CategoryApi[]>("/categories", { auth: false })
      .then((c) => {
        setCategories(c);
        if (c[0]) setForm((f) => ({ ...f, category_id: c[0].category_id }));
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const urls = pendingFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [pendingFiles]);

  const set =
    (key: "name" | "phone" | "hours") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handlePickAddress = (a: PickedAddress) => {
    setForm((prev) => ({
      ...prev,
      address: a.address,
      name: prev.name || a.name,
    }));
    setPickedCoord({ lat: a.lat, lng: a.lng });
    setPickerOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category_id || !form.address.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const coord =
        pickedCoord ?? (await geocodeAddress(form.address.trim())) ?? FALLBACK_COORD;
      const imageUrls = pendingFiles.length > 0 ? await uploadImages(pendingFiles) : [];
      const created = await api.post<CreatedRestaurant>("/restaurants", {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        opening_hours: form.hours.trim() || null,
        category_id: form.category_id,
        address: {
          full_address: form.address.trim(),
          latitude: coord.lat,
          longitude: coord.lng,
        },
        hashtags: [],
        image_urls: imageUrls,
        thumbnail_url: imageUrls[0] ?? null,
      });
      router.replace(`/restaurants/${created.restaurant_id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "등록 실패",
      );
      setSubmitting(false);
    }
  };

  const canSubmit =
    form.name.trim() && form.category_id > 0 && form.address.trim() && !submitting;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="식당 등록" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-5 text-sm text-text-secondary">
          지도에 없는 맛집을 직접 등록해보세요!
        </p>

        <div className="flex flex-col gap-4">
          <TextInput
            label="식당명 *"
            placeholder="식당 이름을 입력하세요"
            value={form.name}
            onChange={set("name")}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              카테고리 *
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, category_id: cat.category_id }))}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    form.category_id === cat.category_id
                      ? "bg-primary text-white"
                      : "border border-border text-text-secondary",
                  ].join(" ")}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              위치 *
            </label>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              {form.address ? (
                <span className="flex items-center gap-2 text-text-primary">
                  📍 <span className="truncate">{form.address}</span>
                </span>
              ) : (
                <span className="text-text-disabled">카카오맵에서 위치 검색</span>
              )}
              <span className="shrink-0 text-xs text-brown">
                {form.address ? "변경" : "검색"}
              </span>
            </button>
          </div>

          <TextInput
            label="전화번호"
            placeholder="031-000-0000"
            value={form.phone}
            onChange={set("phone")}
            type="tel"
          />

          <TextInput
            label="영업시간"
            placeholder="예: 매일 11:00 - 22:00"
            value={form.hours}
            onChange={set("hours")}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              사진 (선택)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              {previewUrls.map((u, i) => (
                <div
                  key={u}
                  className="relative h-24 w-24 overflow-hidden rounded-xl border border-border"
                >
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {previewUrls.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-text-disabled"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-xs">사진 추가</span>
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "등록 중..." : "등록하기"}
        </Button>
      </div>

      <AddressPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickAddress}
      />
    </div>
  );
}
