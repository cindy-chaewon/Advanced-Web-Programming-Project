import StarRating from "@/components/restaurant/StarRating";
import type { RestaurantPin } from "@/lib/mockData";
import Link from "next/link";

type RestaurantCardProps = {
  restaurant: RestaurantPin;
};

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${restaurant.id}`} className="flex gap-3 py-3">
      {/* 썸네일 */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
        <div className="flex h-full w-full items-center justify-center text-3xl">
          {restaurant.category === "한식" ? "🍚" :
           restaurant.category === "카페" ? "☕" :
           restaurant.category === "일식" ? "🍣" :
           restaurant.category === "양식" ? "🍝" :
           restaurant.category === "중식" ? "🥢" : "🍽️"}
        </div>
      </div>

      {/* 정보 */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between">
          <h3 className="text-[15px] font-semibold text-text-primary">{restaurant.name}</h3>
          <span className="text-xs text-text-secondary">{restaurant.category}</span>
        </div>
        <StarRating value={restaurant.rating} size={13} />
        <p className="text-xs text-text-secondary">{restaurant.address}</p>
        <div className="flex gap-1.5">
          {restaurant.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-brown">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
