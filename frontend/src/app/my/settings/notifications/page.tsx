"use client";

import PageHeader from "@/components/layout/PageHeader";
import { useState } from "react";

export default function NotificationSettingsPage() {
  // 알림 토글 상태 관리
  const [allNoti, setAllNoti] = useState(true);
  const [showInCenter, setShowInCenter] = useState(true);

  const [friendReq, setFriendReq] = useState(true);
  const [likeNoti, setLikeNoti] = useState(true);
  const [commentNoti, setCommentNoti] = useState(true);
  const [groupPlaceNoti, setGroupPlaceNoti] = useState(true);

  // '전체 알람'을 끄면 하위 알람도 모두 꺼지게 만드는 연동 로직
  const handleAllToggle = (checked: boolean) => {
    setAllNoti(checked);
    if (!checked) {
      setShowInCenter(false);
      setFriendReq(false);
      setLikeNoti(false);
      setCommentNoti(false);
      setGroupPlaceNoti(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <PageHeader title="알림 설정" leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        <div className="mt-2 flex flex-col gap-2">
          {/* 전체 알림 관리 */}
          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              전체 알림 관리
            </h2>
            <div className="flex flex-col divide-y divide-border">
              <ToggleRow
                label="전체 알람 켜기"
                checked={allNoti}
                onChange={handleAllToggle}
              />
              <ToggleRow
                label="알림센터에 메시지 표시"
                checked={showInCenter}
                onChange={setShowInCenter}
                disabled={!allNoti}
              />
            </div>
          </section>

          {/* 세부 알림 관리 */}
          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              세부 알림 관리
            </h2>
            <div className="flex flex-col divide-y divide-border">
              <ToggleRow
                label="친구 요청 알림"
                checked={friendReq}
                onChange={setFriendReq}
                disabled={!allNoti}
              />
              <ToggleRow
                label="좋아요 알림"
                checked={likeNoti}
                onChange={setLikeNoti}
                disabled={!allNoti}
              />
              <ToggleRow
                label="댓글 알림"
                checked={commentNoti}
                onChange={setCommentNoti}
                disabled={!allNoti}
              />
              <ToggleRow
                label="그룹 추가 장소 알림"
                checked={groupPlaceNoti}
                onChange={setGroupPlaceNoti}
                disabled={!allNoti}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 토글 스위치 UI를 그려주는 별도의 컴포넌트입니다.
// ----------------------------------------------------
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
