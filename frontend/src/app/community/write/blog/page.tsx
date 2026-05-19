"use client";

import RestaurantPicker, {
  type PickedRestaurant,
} from "@/components/community/RestaurantPicker";
import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Button from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { uploadImages } from "@/lib/upload";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CreatedPost = { post_id: number };

export default function BlogWritePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [restaurant, setRestaurant] = useState<PickedRestaurant | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const wrapSelection = (prefix: string, suffix = prefix) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = content.slice(0, start);
    const middle = content.slice(start, end);
    const after = content.slice(end);
    const placeholder = middle || "내용";
    const next = `${before}${prefix}${placeholder}${suffix}${after}`;
    setContent(next);
    setTimeout(() => {
      el.focus();
      const newStart = start + prefix.length;
      const newEnd = newStart + placeholder.length;
      el.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const insertText = (text: string) => {
    const el = contentRef.current;
    if (!el) {
      setContent((c) => c + text);
      return;
    }
    const start = el.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(start);
    setContent(`${before}${text}${after}`);
    setTimeout(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    const urls = pendingFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [pendingFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!restaurant || !title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const imageUrls = pendingFiles.length > 0 ? await uploadImages(pendingFiles) : [];
      const created = await api.post<CreatedPost>("/posts", {
        type: "blog",
        restaurant_id: restaurant.id,
        title: title.trim(),
        content: content.trim(),
        score: rating > 0 ? rating : undefined,
        hashtags: [],
        image_urls: imageUrls,
      });
      router.replace(`/community/${created.post_id}`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "발행에 실패했어요");
      setSubmitting(false);
    }
  };

  const canSubmit = restaurant && title.trim() && content.trim() && !submitting;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="맛집 블로그 작성" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              식당 *
            </label>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              {restaurant ? (
                <span className="flex items-center gap-2 text-text-primary">
                  <span className="font-medium">{restaurant.name}</span>
                  {restaurant.category && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-brown">
                      {restaurant.category}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-text-disabled">식당을 선택하세요</span>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              사진
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
              {previewUrls.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-text-disabled"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs">사진 추가</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              별점 (선택)
            </label>
            <StarRating value={rating} size={32} interactive onChange={setRating} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              제목 *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              내용 *
            </label>
            <div className="overflow-hidden rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="맛집에 대한 상세한 후기를 작성해주세요"
                rows={10}
                className="w-full resize-none px-4 py-3 text-sm outline-none placeholder:text-text-disabled"
              />
              <div className="flex items-center gap-1 border-t border-border bg-surface px-2 py-1.5">
                <ToolbarButton
                  onClick={() => fileInputRef.current?.click()}
                  label="📷"
                  title="사진 추가"
                />
                <ToolbarButton
                  onClick={() => insertText(" #")}
                  label="#"
                  title="해시태그 삽입"
                />
                <span className="mx-1 h-4 w-px bg-border" />
                <ToolbarButton
                  onClick={() => wrapSelection("**")}
                  label="B"
                  title="굵게"
                  bold
                />
                <ToolbarButton
                  onClick={() => wrapSelection("*")}
                  label="I"
                  title="기울임"
                  italic
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "발행 중..." : "발행하기"}
        </Button>
      </div>

      <RestaurantPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(r) => {
          setRestaurant(r);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  title,
  bold,
  italic,
}: {
  onClick: () => void;
  label: string;
  title: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors active:bg-white",
        bold ? "font-bold" : "",
        italic ? "italic" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
