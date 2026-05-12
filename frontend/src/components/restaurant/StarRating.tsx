type StarRatingProps = {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
};

export default function StarRating({
  value,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            {...(interactive ? { onClick: () => onChange?.(i + 1) } : {})}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            style={{ padding: 0, background: "none", border: "none" }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#ffc107" : "#e5e5e5"}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
