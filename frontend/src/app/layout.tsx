import ToastHost from "@/components/ui/Toast";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

const pretendard = localFont({
  src: "../../public/fonts/subset-PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "HiFive",
  description: "친구와 함께하는 맛집 지도 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body
        className="h-dvh overflow-hidden bg-gray-100 font-pretendard antialiased"
        suppressHydrationWarning
      >
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
          strategy="afterInteractive"
        />
        <div className="relative mx-auto h-dvh w-full overflow-hidden bg-white md:max-w-[430px] md:shadow-xl">
          {children}
        </div>
        <ToastHost />
      </body>
    </html>
  );
}
