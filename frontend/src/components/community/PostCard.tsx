import type { PostBrief } from "@/lib/api";
import { timeAgo } from "@/lib/api";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

type PostCardProps = {
  post: PostBrief;
};

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#6b6b6b" strokeWidth="1.5" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#6b6b6b" strokeWidth="1.5" />
    </svg>
  );
}

export default function PostCard({ post }: PostCardProps) {
  const restaurantName = post.restaurant?.name ?? "";
  const authorName = post.author.username;

  if (post.type === "blog") {
    return (
      <Link href={`/community/${post.post_id}`} className="block">
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {post.thumbnail_url && (
            <div className="flex h-44 items-center justify-center bg-surface text-5xl">🍽️</div>
          )}
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Avatar src={post.author.profile_image ?? undefined} name={authorName} size="xs" />
              <span className="text-xs font-medium text-text-secondary">{authorName}</span>
              <span className="text-xs text-text-disabled">{timeAgo(post.created_at)}</span>
            </div>
            <h3 className="mb-1 text-base font-bold text-text-primary line-clamp-2">
              {post.title ?? post.content_preview}
            </h3>
            <p className="mb-2 text-sm text-text-secondary line-clamp-2">{post.content_preview}</p>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-brown">{restaurantName}</span>
              <div className="flex gap-3 text-xs text-text-secondary ml-auto">
                <span className="flex items-center gap-1"><HeartIcon />{post.like_count}</span>
                <span className="flex items-center gap-1"><CommentIcon />{post.comment_count}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/community/${post.post_id}`} className="block">
      <div className="flex gap-3 border-b border-border py-3">
        <Avatar src={post.author.profile_image ?? undefined} name={authorName} size="sm" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">{authorName}</span>
            <span className="text-xs text-text-disabled">{timeAgo(post.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-brown">{restaurantName}</span>
            {post.score && <StarRating value={post.score} size={11} />}
          </div>
          <p className="text-sm text-text-secondary line-clamp-2">{post.content_preview}</p>
          <div className="flex gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><HeartIcon />{post.like_count}</span>
            <span className="flex items-center gap-1"><CommentIcon />{post.comment_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
