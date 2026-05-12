"use client";

import FriendItem from "@/components/friends/FriendItem";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { SAMPLE_FRIENDS } from "@/lib/mockData";
import { useState } from "react";

const EMOJIS = ["🍜", "🍕", "☕", "🍣", "🥗", "🍻", "🍱", "🎉"];
const ACCEPTED_FRIENDS = SAMPLE_FRIENDS.filter((f) => f.status === "friend");

export default function GroupNewPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🍜");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="새 그룹 만들기" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-5">
          {/* 이모지 선택 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">그룹 이모지</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={[
                    "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-colors",
                    selectedEmoji === emoji
                      ? "bg-primary ring-2 ring-primary ring-offset-1"
                      : "bg-surface",
                  ].join(" ")}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 그룹명 */}
          <TextInput
            label="그룹명"
            placeholder="그룹 이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* 소개 */}
          <TextInput
            label="소개 (선택)"
            placeholder="그룹 소개를 입력하세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* 멤버 초대 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">멤버 초대</label>
            <div className="divide-y divide-border rounded-2xl border border-border">
              {ACCEPTED_FRIENDS.map((f) => (
                <div key={f.id} className="flex items-center px-3">
                  <div className="flex-1">
                    <FriendItem friend={f} variant="friend" />
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(f.id)}
                    onChange={() => toggleMember(f.id)}
                    className="h-5 w-5 accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!name}>
          그룹 만들기
        </Button>
      </div>
    </div>
  );
}
