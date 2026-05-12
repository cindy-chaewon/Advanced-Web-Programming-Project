import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

type ProfileHeaderProps = {
  name: string;
  bio?: string;
  avatar?: string;
  stats: { posts: number; reviews: number; scraps: number; friends: number };
};

export default function ProfileHeader({ name, bio, avatar, stats }: ProfileHeaderProps) {
  return (
    <div className="bg-white px-5 py-6">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={avatar} size="xl" />
        <div className="flex-1">
          <p className="text-lg font-bold text-text-primary">{name}</p>
          {bio && <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">{bio}</p>}
          <Link
            href="/my/edit"
            className="mt-2 inline-block rounded-lg border border-border px-3 py-1 text-xs font-medium text-text-secondary active:bg-surface"
          >
            프로필 수정
          </Link>
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-5 grid grid-cols-4 divide-x divide-border rounded-2xl border border-border bg-surface py-4">
        {[
          { label: "글", value: stats.posts },
          { label: "리뷰", value: stats.reviews },
          { label: "스크랩", value: stats.scraps },
          { label: "친구", value: stats.friends },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-text-primary">{s.value}</span>
            <span className="text-xs text-text-secondary">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
