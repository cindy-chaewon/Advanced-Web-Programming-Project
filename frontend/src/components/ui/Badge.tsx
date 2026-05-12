import type { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "brown" | "outline";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface text-text-secondary",
  primary: "bg-primary/15 text-brown",
  brown: "bg-brown text-white",
  outline: "border border-border text-text-secondary bg-white",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
