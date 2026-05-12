"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title?: string;
  leftAction?: "back" | "close" | ReactNode;
  rightAction?: ReactNode;
  transparent?: boolean;
  className?: string;
};

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PageHeader({
  title,
  leftAction = "back",
  rightAction,
  transparent = false,
  className = "",
}: PageHeaderProps) {
  const router = useRouter();

  const renderLeft = () => {
    if (leftAction === "back") {
      return (
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-surface"
        >
          <BackIcon />
        </button>
      );
    }
    if (leftAction === "close") {
      return (
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-surface"
        >
          <CloseIcon />
        </button>
      );
    }
    return leftAction;
  };

  return (
    <header
      className={[
        "flex h-14 items-center justify-between px-2",
        transparent ? "absolute inset-x-0 top-0 z-10 bg-transparent" : "bg-white border-b border-border",
        className,
      ].join(" ")}
    >
      <div className="w-10">{renderLeft()}</div>
      {title && <h1 className="text-base font-semibold text-text-primary">{title}</h1>}
      <div className="w-10 flex justify-end">{rightAction ?? null}</div>
    </header>
  );
}
