"use client";

import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { useState } from "react";

export default function MyEditPage() {
  const [name, setName] = useState("나");
  const [bio, setBio] = useState("맛집 탐험가 🍜 서울 곳곳 숨은 맛집 발굴 중");

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="프로필 수정" leftAction="back" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* 아바타 */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar name={name} size="xl" />
            <button
              type="button"
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
            <label className="mb-1.5 block text-sm font-medium text-text-primary">자기소개</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={100}
              rows={3}
              className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm outline-none placeholder:text-text-disabled focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-xs text-text-disabled">{bio.length}/100</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg">저장하기</Button>
      </div>
    </div>
  );
}
