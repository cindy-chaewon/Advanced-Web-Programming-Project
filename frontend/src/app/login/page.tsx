"use client";

import Button from "@/components/ui/Button";
import { kakaoLoginUrl, googleLoginUrl } from "@/lib/api";

function HiFiveLogo() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect width="72" height="72" rx="20" fill="#FFC107" />
      <path
        d="M18 36a18 18 0 1 1 36 0A18 18 0 0 1 18 36z"
        fill="#895129"
        fillOpacity={0.25}
      />
      <text x="36" y="44" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#895129">
        H5
      </text>
    </svg>
  );
}

export default function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = kakaoLoginUrl();
  };

  const handleGoogleLogin = () => {
    window.location.href = googleLoginUrl();
  };

  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <HiFiveLogo />
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-text-primary">HiFive</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            친구들과 채워가는<br />달콤한 맛집 지도
          </p>
        </div>

        <div className="my-4 flex gap-3">
          {["🍜", "🍱", "☕", "🍕", "🍣"].map((emoji, i) => (
            <div
              key={emoji}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl"
              style={{ marginTop: i % 2 === 0 ? 0 : 12 }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button variant="kakao" size="lg" fullWidth onClick={handleKakaoLogin}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2C5.582 2 2 4.91 2 8.5c0 2.27 1.404 4.27 3.52 5.44L4.8 17l3.82-2.28C9.07 14.9 9.53 15 10 15c4.418 0 8-2.91 8-6.5S14.418 2 10 2z"
              fill="#191919"
            />
          </svg>
          카카오로 시작하기
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={handleGoogleLogin}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          구글로 시작하기
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-text-disabled">
        로그인 시{" "}
        <span className="underline">이용약관</span>
        {" "}및{" "}
        <span className="underline">개인정보 처리방침</span>에 동의합니다
      </p>
    </div>
  );
}
