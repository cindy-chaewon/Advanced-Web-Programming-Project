"use client";

import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { getMe, updateProfile } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MyEditPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMe()
      .then((u) => { setUsername(u.username); setBio(u.bio ?? ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ username: username.trim(), bio: bio.trim() });
      router.back();
    } catch {
      alert("저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="프로필 수정" leftAction="back" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar name={username || "나"} size="xl" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <TextInput
              label="닉네임"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
        )}
      </div>

      <div className="border-t border-border px-4 py-4">
        <Button fullWidth size="lg" onClick={handleSave} disabled={saving || loading}>
          {saving ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
}
