"use client";

import SettingsItem from "@/components/my/SettingsItem";
import PageHeader from "@/components/layout/PageHeader";
import { useState } from "react";

export default function SettingsPage() {
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("한국어");
  const [tempLang, setTempLang] = useState("한국어");

  const handleLangConfirm = () => {
    setCurrentLang(tempLang);
    setIsLangModalOpen(false);
  };

  return (
    <div className="relative flex h-full flex-col bg-surface">
      <PageHeader title="설정" leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        <div className="mt-2 flex flex-col gap-2">
          {/* 🌟 1. 앱 관리 카테고리 */}
          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              앱 관리
            </h2>
            <div className="flex flex-col divide-y divide-border">
              <SettingsItem
                icon="🔔"
                label="알림 설정"
                href="/my/settings/notifications"
              />
              <SettingsItem
                icon="👥"
                label="친구 관리"
                href="/my/settings/friends"
              />
              <SettingsItem
                icon="🌐"
                label="언어"
                description={currentLang}
                onClick={() => {
                  setTempLang(currentLang);
                  setIsLangModalOpen(true);
                }}
              />
            </div>
          </section>

          {/* 🌟 2. 앱 정보 카테고리 */}
          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              앱 정보
            </h2>
            <div className="flex flex-col divide-y divide-border">
              <SettingsItem icon="🔒" label="개인정보 처리 방침" />
              <SettingsItem icon="📋" label="이용약관" />
              <SettingsItem icon="📞" label="고객센터" />
            </div>
          </section>

          {/* 로그아웃 / 회원 탈퇴 (보통 제일 아래에 분리합니다) */}
          <section className="bg-white flex flex-col divide-y divide-border">
            <SettingsItem label="로그아웃" danger onClick={() => {}} />
            <SettingsItem label="회원 탈퇴" danger onClick={() => {}} />
          </section>

          <p className="py-4 text-center text-xs text-text-disabled">
            HiFive v1.0.0
          </p>
        </div>
      </div>

      {/* 언어 선택 모달 */}
      {isLangModalOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md animate-slide-up rounded-t-2xl bg-white p-5 pb-8 sm:rounded-2xl sm:pb-5">
            <h3 className="mb-4 text-center text-lg font-bold text-text-primary">
              언어 선택
            </h3>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-border">
              {["한국어", "English"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTempLang(lang)}
                  className={`w-full p-4 text-center transition-colors ${
                    tempLang === lang
                      ? "bg-primary/10 font-bold text-brown"
                      : "text-text-primary"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="flex-1 rounded-xl bg-surface py-3 font-semibold text-text-secondary active:opacity-70"
              >
                취소
              </button>
              <button
                onClick={handleLangConfirm}
                className="flex-1 rounded-xl bg-brown py-3 font-semibold text-white active:opacity-70"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
