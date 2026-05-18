"use client";

import FriendItem from "@/components/friends/FriendItem";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { createGroup, getFriends } from "@/lib/api";
import type { FriendOut } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EMOJIS = ["🍜", "🍕", "☕", "🍣", "🥗", "🍻", "🍱", "🎉"];

export default function GroupNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🍜");
  const [friends, setFriends] = useState<FriendOut[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFriends().then(setFriends).catch(() => {});
  }, []);

  const toggleMember = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const g = await createGroup({
        name: name.trim(),
        icon: selectedEmoji,
        invite_user_ids: [...selectedIds],
      });
      router.replace(`/friends/groups/${g.group_id}`);
    } catch {
      alert("그룹 생성에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="새 그룹 만들기" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-5">
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
                    selectedEmoji === emoji ? "bg-primary ring-2 ring-primary ring-offset-1" : "bg-surface",
                  ].join(" ")}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <TextInput
            label="그룹명"
            placeholder="그룹 이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {friends.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">멤버 초대</label>
              <div className="divide-y divide-border rounded-2xl border border-border">
                {friends.map((f) => (
                  <div key={f.user_id} className="flex items-center px-3">
                    <div className="flex-1">
                      <FriendItem friend={f} variant="friend" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.user_id)}
                      onChange={() => toggleMember(f.user_id)}
                      className="h-5 w-5 accent-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" disabled={!name.trim() || saving} onClick={handleCreate}>
          {saving ? "만드는 중..." : "그룹 만들기"}
        </Button>
      </div>
    </div>
  );
}
