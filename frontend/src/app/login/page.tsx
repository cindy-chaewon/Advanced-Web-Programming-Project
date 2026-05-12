import Button from "@/components/ui/Button";

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
  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-12">
      {/* 로고 영역 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <HiFiveLogo />
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-text-primary">HiFive</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            친구들과 채워가는<br />달콤한 맛집 지도
          </p>
        </div>

        {/* 허니콤 일러스트 */}
        <div className="my-4 flex gap-3">
          {["🍜", "🍱", "☕", "🍕", "🍣"].map((emoji, i) => (
            <div
              key={i}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl"
              style={{ marginTop: i % 2 === 0 ? 0 : 12 }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      {/* 로그인 버튼 */}
      <div className="flex w-full flex-col gap-3">
        <Button variant="kakao" size="lg" fullWidth>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2C5.582 2 2 4.91 2 8.5c0 2.27 1.404 4.27 3.52 5.44L4.8 17l3.82-2.28C9.07 14.9 9.53 15 10 15c4.418 0 8-2.91 8-6.5S14.418 2 10 2z"
              fill="#191919"
            />
          </svg>
          카카오로 시작하기
        </Button>
        <Button variant="secondary" size="lg" fullWidth>
          인증서로 로그인
        </Button>
      </div>

      {/* 약관 */}
      <p className="mt-4 text-center text-xs text-text-disabled">
        로그인 시{" "}
        <span className="underline">이용약관</span>
        {" "}및{" "}
        <span className="underline">개인정보 처리방침</span>에 동의합니다
      </p>
    </div>
  );
}
