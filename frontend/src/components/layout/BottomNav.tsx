"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactElement;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#ffc107" : "none"}>
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V12h6v9"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        fill={active ? "#ffc107" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <path
        d="M16.5 16.5L21 21"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? "#ffc107" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function FriendsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="9"
        cy="8"
        r="3.5"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        fill={active ? "#ffc107" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <path
        d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="18"
        cy="8"
        r="2.5"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        fill={active ? "#ffc107" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <path
        d="M15.5 20c0-2.21 1.119-4.143 2.809-5.337"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MyIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        fill={active ? "#ffc107" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <path
        d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
        stroke={active ? "#ffc107" : "#6b6b6b"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", icon: (a) => <HomeIcon active={a} /> },
  { href: "/search", label: "검색", icon: (a) => <SearchIcon active={a} /> },
  { href: "/community", label: "커뮤니티", icon: (a) => <CommunityIcon active={a} /> },
  { href: "/friends", label: "친구", icon: (a) => <FriendsIcon active={a} /> },
  { href: "/my", label: "마이", icon: (a) => <MyIcon active={a} /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute bottom-0 left-1/2 z-40 flex h-14 w-full -translate-x-1/2 items-stretch border-t border-border bg-white md:max-w-107.5">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            {item.icon(isActive)}
            <span
              className={[
                "text-[10px] font-medium",
                isActive ? "text-primary" : "text-text-secondary",
              ].join(" ")}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
