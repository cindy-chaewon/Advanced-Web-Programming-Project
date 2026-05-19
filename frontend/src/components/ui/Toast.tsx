"use client";

import { useEffect, useState } from "react";

type ToastEvent = {
  message: string;
  level?: "error" | "info" | "success";
  durationMs?: number;
};

const EVENT_NAME = "hifive:toast";

export function showToast(message: string, opts: Omit<ToastEvent, "message"> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastEvent>(EVENT_NAME, { detail: { message, ...opts } }),
  );
}

export default function ToastHost() {
  const [toast, setToast] = useState<ToastEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastEvent>).detail;
      setToast(detail);
      const t = window.setTimeout(() => setToast(null), detail.durationMs ?? 4000);
      return () => window.clearTimeout(t);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  if (!toast) return null;

  const color =
    toast.level === "error"
      ? "bg-red-500/95"
      : toast.level === "success"
        ? "bg-green-500/95"
        : "bg-text-primary/95";

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-full ${color} px-4 py-2 text-xs font-medium text-white shadow-lg`}
      role="status"
    >
      {toast.message}
    </div>
  );
}
