"use client";

type ChipProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function Chip({ label, selected = false, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors",
        selected
          ? "bg-primary text-white"
          : "border border-border bg-white text-text-secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}
