import type { RestaurantBrief } from "@/lib/api";
import StarRating from "@/components/restaurant/StarRating";
import Link from "next/link";

type RestaurantCardProps = {
  restaurant: RestaurantBrief;
};

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const categoryName = restaurant.category?.name ?? "";
  const address = restaurant.address?.full_address ?? restaurant.address?.district ?? "";

  return (
    <Link href={`/restaurants/${restaurant.restaurant_id}`} className="flex gap-3 py-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
        {restaurant.thumbnail_url ? (
          <img src={restaurant.thumbnail_url} alt={restaurant.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {categoryName === "한식" ? "🍚" :
             categoryName === "카페" ? "☕" :
             categoryName === "일식" ? "🍣" :
             categoryName === "양식" ? "🍝" :
             categoryName === "중식" ? "🥢" : "🍽️"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between">
          <h3 className="text-[15px] font-semibold text-text-primary">{restaurant.name}</h3>
          <span className="text-xs text-text-secondary">{categoryName}</span>
        </div>
        <StarRating value={restaurant.avg_review_score} size={13} />
        <p className="text-xs text-text-secondary">{address}</p>
        <div className="flex gap-1.5">
          {restaurant.hashtags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-brown">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
