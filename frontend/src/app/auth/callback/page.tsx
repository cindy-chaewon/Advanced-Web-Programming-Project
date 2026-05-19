"use client";

import { api } from "@/lib/api";
import { setStoredUser, setToken, type StoredUser } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const isNew = params.get("is_new") === "true";

    if (!token) {
      setError("로그인 토큰이 없어요");
      return;
    }

    setToken(token);

    // 사용자 정보 채우기 (실패해도 로그인 자체는 성공)
    api
      .get<StoredUser>("/auth/me")
      .then((user) => {
        setStoredUser(user);
      })
      .catch(() => {})
      .finally(() => {
        router.replace(isNew ? "/my/edit?welcome=1" : "/");
      });
  }, [params, router]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-text-secondary">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="text-sm font-semibold text-primary underline"
        >
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-text-secondary">로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
