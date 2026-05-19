type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
};

const ROUNDED_MAP: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

export default function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface ${ROUNDED_MAP[rounded]} ${className}`}
      aria-busy="true"
      aria-hidden="true"
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
      <Skeleton className="h-5 w-20" rounded="full" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" rounded="full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-14 w-14" rounded="lg" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
