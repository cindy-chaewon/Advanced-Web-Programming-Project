import Avatar from "@/components/ui/Avatar";
import type { Group } from "@/lib/mockData";
import Link from "next/link";

type GroupCardProps = {
  group: Group;
};

export default function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/friends/groups/${group.id}`} className="block">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
        {/* 그룹 이모지 아이콘 */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">
          {group.coverEmoji}
        </div>

        {/* 정보 */}
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">{group.name}</p>
          <p className="text-xs text-text-secondary">{group.description}</p>
          {/* 멤버 아바타 */}
          <div className="mt-2 flex -space-x-2">
            {group.members.slice(0, 5).map((m) => (
              <Avatar key={m.id} name={m.name} src={m.avatar} size="xs" className="ring-2 ring-white" />
            ))}
            {group.members.length > 5 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-text-secondary ring-2 ring-white">
                +{group.members.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-text-disabled">
          <span className="font-medium text-text-secondary">{group.restaurantCount}</span>곳
        </div>
      </div>
    </Link>
  );
}
