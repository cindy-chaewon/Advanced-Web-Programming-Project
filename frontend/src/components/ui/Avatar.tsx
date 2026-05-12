type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
};

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-11 h-11 text-base",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

function getInitial(name?: string) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

const BG_COLORS = [
  "bg-orange-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-teal-400",
];

function getBgColor(name?: string) {
  if (!name) return BG_COLORS[0];
  const code = name.charCodeAt(0);
  return BG_COLORS[code % BG_COLORS.length];
}

export default function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "avatar"}
        className={["rounded-full object-cover", sizeClass, className].join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "flex items-center justify-center rounded-full font-semibold text-white",
        getBgColor(name),
        sizeClass,
        className,
      ].join(" ")}
    >
      {getInitial(name)}
    </div>
  );
}
