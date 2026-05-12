import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { SAMPLE_POSTS } from "@/lib/mockData";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = SAMPLE_POSTS.find((p) => p.id === id) ?? SAMPLE_POSTS[0];

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        {/* 이미지 */}
        {post.imageUrl && (
          <div className="flex h-52 items-center justify-center bg-surface text-6xl">🍽️</div>
        )}

        <div className="px-4 py-4">
          {/* 작성자 */}
          <div className="mb-3 flex items-center gap-2">
            <Avatar name={post.author.name} src={post.author.avatar} size="sm" />
            <div>
              <p className="text-sm font-semibold text-text-primary">{post.author.name}</p>
              <p className="text-xs text-text-disabled">{post.createdAt}</p>
            </div>
          </div>

          {/* 식당 */}
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="primary">{post.restaurant.category}</Badge>
            <span className="text-sm font-medium text-brown">{post.restaurant.name}</span>
            <StarRating value={post.rating} size={13} />
          </div>

          {/* 제목 */}
          {post.title && (
            <h1 className="mb-2 text-xl font-bold text-text-primary">{post.title}</h1>
          )}

          {/* 본문 */}
          <p className="text-sm leading-relaxed text-text-primary">{post.content}</p>

          {/* 해시태그 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-brown">
                {tag}
              </span>
            ))}
          </div>

          {/* 좋아요/댓글 */}
          <div className="mt-4 flex gap-4 border-t border-border pt-4">
            <button type="button" className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span>❤️</span>
              <span>{post.likeCount}</span>
            </button>
            <button type="button" className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span>💬</span>
              <span>{post.commentCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
