"use client";

import SettingsItem from "@/components/my/SettingsItem";
import PageHeader from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col bg-surface">
      <PageHeader title="설정" leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        <div className="mt-2 flex flex-col gap-2">
          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              알림 설정
            </h2>
            <SettingsItem icon="🔔" label="친구 요청 알림" description="새 친구 요청이 오면 알림을 보내요" />
            <SettingsItem icon="❤️" label="좋아요 알림" description="글에 좋아요가 달리면 알림을 보내요" />
            <SettingsItem icon="💬" label="댓글 알림" description="댓글이 달리면 알림을 보내요" />
          </section>

          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              앱 설정
            </h2>
            <SettingsItem icon="🗺️" label="위치 권한" description="맛집 지도에 필요해요" />
            <SettingsItem icon="🌐" label="언어" description="한국어" />
          </section>

          <section className="bg-white">
            <h2 className="border-b border-border px-4 py-3 text-xs font-semibold text-text-secondary">
              계정
            </h2>
            <SettingsItem icon="🔒" label="개인정보 처리방침" />
            <SettingsItem icon="📋" label="이용약관" />
            <SettingsItem icon="📞" label="고객센터" />
            <SettingsItem label="로그아웃" danger onClick={() => {}} />
            <SettingsItem label="회원 탈퇴" danger onClick={() => {}} />
          </section>

          <p className="py-4 text-center text-xs text-text-disabled">HiFive v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
