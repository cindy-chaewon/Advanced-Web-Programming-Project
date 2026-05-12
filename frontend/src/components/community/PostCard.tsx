import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import type { Post } from "@/lib/mockData";
import Link from "next/link";

type PostCardProps = {
  post: Post;
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
  if (post.type === "blog") {
    return (
      <Link href={`/community/${post.id}`} className="block">
        {/* 블로그형 - 큰 이미지 카드 */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {post.imageUrl && (
            <div className="flex h-44 items-center justify-center bg-surface text-5xl">
              🍽️
            </div>
          )}
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Avatar src={post.author.avatar} name={post.author.name} size="xs" />
              <span className="text-xs font-medium text-text-secondary">{post.author.name}</span>
              <span className="text-xs text-text-disabled">{post.createdAt}</span>
            </div>
            <h3 className="mb-1 text-base font-bold text-text-primary line-clamp-2">{post.title}</h3>
            <p className="mb-2 text-sm text-text-secondary line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-brown">{post.restaurant.name}</span>
              <div className="flex gap-3 text-xs text-text-secondary ml-auto">
                <span className="flex items-center gap-1"><HeartIcon />{post.likeCount}</span>
                <span className="flex items-center gap-1"><CommentIcon />{post.commentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/community/${post.id}`} className="block">
      {/* 간단리뷰형 - 컴팩트 */}
      <div className="flex gap-3 border-b border-border py-3">
        <Avatar src={post.author.avatar} name={post.author.name} size="sm" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">{post.author.name}</span>
            <span className="text-xs text-text-disabled">{post.createdAt}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-brown">{post.restaurant.name}</span>
            <StarRating value={post.rating} size={11} />
          </div>
          <p className="text-sm text-text-secondary line-clamp-2">{post.content}</p>
          <div className="flex gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><HeartIcon />{post.likeCount}</span>
            <span className="flex items-center gap-1"><CommentIcon />{post.commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
