"use client";

import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export default function TextInput({ label, error, hint, id, className = "", ...props }: TextInputProps) {
  const inputId = id ?? label?.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "h-12 w-full rounded-xl border px-4 text-[15px] outline-none transition-colors",
          "placeholder:text-text-disabled",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          error ? "border-red-400" : "border-border",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}
