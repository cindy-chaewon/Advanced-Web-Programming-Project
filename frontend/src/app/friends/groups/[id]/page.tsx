import KakaoMap from "@/components/map/KakaoMap";
import PageHeader from "@/components/layout/PageHeader";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import Avatar from "@/components/ui/Avatar";
import { SAMPLE_GROUPS, SAMPLE_PINS } from "@/lib/mockData";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = SAMPLE_GROUPS.find((g) => g.id === id) ?? SAMPLE_GROUPS[0];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <PageHeader
        title={group.name}
        leftAction="back"
      />

      <div className="flex-1 overflow-y-auto">
        {/* 그룹 정보 */}
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl">
              {group.coverEmoji}
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{group.name}</p>
              {group.description && (
                <p className="text-sm text-text-secondary">{group.description}</p>
              )}
            </div>
          </div>

          {/* 멤버 */}
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">멤버 {group.memberCount}명</p>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {group.members.map((m) => (
                <div key={m.id} className="flex shrink-0 flex-col items-center gap-1">
                  <Avatar name={m.name} src={m.avatar} size="md" />
                  <span className="text-xs text-text-secondary">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 그룹 지도 */}
        <div className="border-b border-border">
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-text-primary">그룹 맛집 지도</p>
          </div>
          <div className="h-52">
            <KakaoMap
              pins={SAMPLE_PINS.filter((p) => p.isFriend)}
              center={{ lat: 37.4979, lng: 127.0276 }}
              level={4}
              className="h-full"
            />
          </div>
        </div>

        {/* 맛집 리스트 */}
        <div className="px-4">
          <div className="flex items-center justify-between py-3">
            <p className="text-sm font-bold text-text-primary">
              그룹 맛집 <span className="text-primary">{group.restaurantCount}</span>
            </p>
          </div>
          <div className="divide-y divide-border">
            {SAMPLE_PINS.slice(0, 3).map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
