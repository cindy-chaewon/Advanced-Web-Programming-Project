"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type SettingsItemProps = {
  icon?: ReactNode;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  rightContent?: ReactNode;
  danger?: boolean;
};

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SettingsItem({
  icon,
  label,
  description,
  href,
  onClick,
  rightContent,
  danger = false,
}: SettingsItemProps) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-4 active:bg-surface">
      {icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-lg">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className={["text-sm font-medium", danger ? "text-red-500" : "text-text-primary"].join(" ")}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-text-secondary">{description}</p>
        )}
      </div>
      {rightContent ?? <ChevronRight />}
    </div>
  );

  if (href) {
    return <Link href={href} className="block border-b border-border last:border-0">{content}</Link>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-b border-border text-left last:border-0"
    >
      {content}
    </button>
  );
}
