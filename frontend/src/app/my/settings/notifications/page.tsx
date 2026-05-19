"use client";

import PageHeader from "@/components/layout/PageHeader";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NotificationSettings = {
  friend_request: boolean;
  likes: boolean;
  group_invite: boolean;
  marketing: boolean;
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    friend_request: true,
    likes: true,
    group_invite: true,
    marketing: false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const ac = new AbortController();
    api
      .get<NotificationSettings>("/users/me/notifications", { signal: ac.signal })
      .then(setSettings)
      .catch(() => {});
    return () => ac.abort();
  }, [router]);

  const update = async (patch: Partial<NotificationSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setError(null);
    try {
      await api.patch("/users/me/notifications", patch);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장 실패");
      // 롤백
      setSettings(settings);
    }
  };

  const allOn = settings.friend_request && settings.likes && settings.group_invite;
  const handleAllToggle = (checked: boolean) => {
    update({ friend_request: checked, likes: checked, group_invite: checked });
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <PageHeader title="알림 설정" leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        <div className="mt-2 flex flex-col gap-2">
          {error && (
            <p className="bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
          )}

          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              전체 알림 관리
            </h2>
            <div className="flex flex-col divide-y divide-border">
              <ToggleRow label="전체 알람 켜기" checked={allOn} onChange={handleAllToggle} />
            </div>
          </section>

          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              세부 알림 관리
            </h2>
            <div className="flex flex-col divide-y divide-border">
              <ToggleRow
                label="친구 요청 알림"
                checked={settings.friend_request}
                onChange={(v) => update({ friend_request: v })}
              />
              <ToggleRow
                label="좋아요 · 댓글 알림"
                checked={settings.likes}
                onChange={(v) => update({ likes: v })}
              />
              <ToggleRow
                label="그룹 초대 / 새 글 알림"
                checked={settings.group_invite}
                onChange={(v) => update({ group_invite: v })}
              />
              <ToggleRow
                label="마케팅 정보 수신"
                checked={settings.marketing}
                onChange={(v) => update({ marketing: v })}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-4 ${disabled ? "opacity-50" : ""}`}
    >
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-brown" : "bg-border"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
