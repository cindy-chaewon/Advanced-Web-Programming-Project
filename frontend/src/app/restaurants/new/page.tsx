"use client";

import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import {
  createRestaurant,
  getCategories,
  getGroups,
  uploadImage,
} from "@/lib/api";
import type { CategoryOut, GroupOut } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LocationResult = { address: string; lat: number; lng: number };

export default function RestaurantNewPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [openingHours, setOpeningHours] = useState("");
  const [phone, setPhone] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [groups, setGroups] = useState<GroupOut[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getGroups().then(setGroups).catch(() => {});
  }, []);

  const handleLocationSearch = () => {
    if (!locationQuery.trim()) return;
    setSearching(true);
    const run = () => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(locationQuery.trim(), (result, status) => {
        setSearching(false);
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          const r = result[0];
          setLocation({ address: r.address_name, lat: parseFloat(r.y), lng: parseFloat(r.x) });
        } else {
          alert("주소를 찾을 수 없어요. 다시 시도해주세요.");
        }
      });
    };
    if (window.kakao?.maps?.services?.Geocoder) {
      run();
    } else {
      window.kakao.maps.load(run);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const { url } = await uploadImage(file);
      setThumbnailUrl(url);
    } catch {
      alert("이미지 업로드에 실패했어요.");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const tag = hashtagInput.replace(/^#/, "").trim();
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const toggleGroup = (id: number) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !location || !selectedCategoryId) return;
    setSubmitting(true);
    try {
      const r = await createRestaurant({
        name: name.trim(),
        phone: phone || undefined,
        opening_hours: openingHours || undefined,
        category_id: selectedCategoryId,
        address: {
          full_address: location.address,
          latitude: location.lat,
          longitude: location.lng,
        },
        thumbnail_url: thumbnailUrl ?? undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        group_ids: selectedGroupIds.size > 0 ? [...selectedGroupIds] : undefined,
      });
      router.replace(`/restaurants/${r.restaurant_id}`);
    } catch {
      alert("식당 등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!name.trim() && !!location && !!selectedCategoryId && !submitting;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="식당 등록" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-5">
          {/* 식당명 */}
          <TextInput
            label="식당명 *"
            placeholder="식당 이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* 위치 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">위치 *</label>
            {location ? (
              <div className="flex items-center justify-between rounded-xl border border-primary px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-primary">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#F59E0B" />
                    <circle cx="12" cy="9" r="2.5" fill="white" />
                  </svg>
                  <span className="text-sm text-text-primary">{location.address}</span>
                </div>
                <button type="button" onClick={() => setLocation(null)} className="ml-3 shrink-0 text-xs text-text-secondary">
                  변경
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
                  placeholder="주소를 입력하세요 (예: 서울 강남구 역삼동)"
                  className="h-12 flex-1 rounded-xl border border-border px-4 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={searching}
                  className="h-12 shrink-0 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-60"
                >
                  {searching ? "검색 중" : "검색"}
                </button>
              </div>
            )}
          </div>

          {/* 카테고리 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">카테고리 *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.category_id)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    selectedCategoryId === cat.category_id
                      ? "bg-primary text-white"
                      : "border border-border text-text-secondary",
                  ].join(" ")}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 대표 사진 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">대표 사진</label>
            <div className="flex gap-3">
              {thumbnailUrl && (
                <div className="relative h-24 w-24 shrink-0">
                  <img src={thumbnailUrl} alt="대표 사진" className="h-full w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl(null)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              {!thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingImg}
                  className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface transition-colors hover:border-primary disabled:opacity-60"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-disabled">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span className="mt-1 text-xs text-text-disabled">{uploadingImg ? "업로드 중" : "사진 추가"}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* 영업시간 */}
          <TextInput
            label="영업시간"
            placeholder="예: 매일 11:00 - 22:00"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
          />

          {/* 전화번호 */}
          <TextInput
            label="전화번호"
            placeholder="02-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
          />

          {/* 해시태그 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">해시태그</label>
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleHashtagKeyDown}
              placeholder="#가성비 #혼밥 (Enter 또는 Space로 추가)"
              className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-primary"
            />
            {hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
                  >
                    #{tag}
                    <button type="button" onClick={() => removeHashtag(tag)} className="ml-0.5 text-text-disabled hover:text-text-primary">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 그룹 추가 */}
          {groups.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">그룹에 추가</label>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => {
                  const selected = selectedGroupIds.has(g.group_id);
                  return (
                    <button
                      key={g.group_id}
                      type="button"
                      onClick={() => toggleGroup(g.group_id)}
                      className={[
                        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        selected
                          ? "bg-primary text-white"
                          : "border border-border text-text-secondary",
                      ].join(" ")}
                    >
                      <span>{g.icon ?? "👥"}</span>
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "등록 중..." : "등록하기"}
        </Button>
      </div>
    </div>
  );
}
