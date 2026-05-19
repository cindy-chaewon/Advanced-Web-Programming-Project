"use client";

import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MeResponse = {
  user_id: number;
  username: string;
  email?: string | null;
  profile_image?: string | null;
  bio?: string | null;
};

export default function MyEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    api
      .get<MeResponse>("/users/me", { signal: ac.signal })
      .then((u) => {
        setName(u.username);
        setBio(u.bio ?? "");
        setProfileImage(u.profile_image ?? null);
        setUserId(String(u.user_id));
        setEmail(u.email ?? "");
      })
      .catch(() => {});
    return () => ac.abort();
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const result = await uploadImage(file);
      setProfileImage(result.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "사진 업로드 실패");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.put("/users/me", {
        nickname: name.trim(),
        bio: bio.trim() || null,
        profile_image: profileImage,
      });
      router.replace("/my");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장 실패");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="프로필 수정" leftAction="back" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <div className="relative">
            <Avatar name={name} src={profileImage ?? undefined} size="xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">사진 변경</p>
        </div>

        <div className="flex flex-col gap-5">
          <TextInput
            label="닉네임"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              자기소개
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={100}
              rows={3}
              className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm outline-none placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-xs text-text-disabled">{bio.length}/100</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              아이디
            </label>
            <input
              value={userId}
              readOnly
              disabled
              className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text-secondary outline-none"
            />
            <p className="mt-1 text-xs text-text-disabled">아이디는 변경할 수 없어요</p>
          </div>

          {email && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                이메일
              </label>
              <input
                value={email}
                readOnly
                disabled
                className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text-secondary outline-none"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!name.trim() || submitting} onClick={handleSave}>
          {submitting ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
}
