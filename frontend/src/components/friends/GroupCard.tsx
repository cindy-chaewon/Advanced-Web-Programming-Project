import type { GroupOut } from "@/lib/api";
import Link from "next/link";

type GroupCardProps = {
  group: GroupOut;
};

export default function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/friends/groups/${group.group_id}`} className="block">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">
          {group.icon ?? "👥"}
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">{group.name}</p>
          <p className="text-xs text-text-secondary">멤버 {group.member_count}명</p>
        </div>
      </div>
    </Link>
  );
}
