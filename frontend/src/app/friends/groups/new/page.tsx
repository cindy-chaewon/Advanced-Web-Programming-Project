"use client";

import FriendItem from "@/components/friends/FriendItem";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import type { Friend } from "@/lib/mockData";
import type { FriendApi } from "@/types/api";
import { toFriend } from "@/types/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CreatedGroup = { group_id: number };

const EMOJIS = ["🍜", "🍕", "☕", "🍣", "🥗", "🍻", "🍱", "🎉"];

export default function GroupNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🍜");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    api
      .get<FriendApi[]>("/friends", { signal: ac.signal })
      .then((fs) => setFriends(fs.map(toFriend).filter((f) => f.status === "friend")))
      .catch(() => {});
    return () => ac.abort();
  }, [router]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const created = await api.post<CreatedGroup>("/groups", {
        name: name.trim(),
        icon: selectedEmoji,
        color: "orange",
        invite_user_ids: Array.from(selectedMembers).map((id) => Number(id)),
      });
      router.replace(`/friends/groups/${created.group_id}`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "그룹 생성 실패");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="새 그룹 만들기" leftAction="close" />

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              그룹 이모지
            </label>
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

          <TextInput
            label="그룹명"
            placeholder="그룹 이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              멤버 초대 ({selectedMembers.size}명)
            </label>
            {friends.length === 0 ? (
              <p className="rounded-2xl border border-border px-4 py-6 text-center text-sm text-text-secondary">
                아직 친구가 없어요. 친구를 먼저 추가해보세요.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-2xl border border-border">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center px-3">
                    <div className="flex-1">
                      <FriendItem friend={f} variant="friend" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(f.id)}
                      onChange={() => toggleMember(f.id)}
                      className="h-5 w-5 accent-primary"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button
          fullWidth
          size="lg"
          disabled={!name.trim() || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "만드는 중..." : "그룹 만들기"}
        </Button>
      </div>
    </div>
  );
}
