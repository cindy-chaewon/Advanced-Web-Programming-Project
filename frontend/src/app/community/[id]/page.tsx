"use client";

import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { getComments, getPost, likePost, unlikePost, createComment } from "@/lib/api";
import type { CommentOut, PostRead } from "@/lib/api";
import { timeAgo } from "@/lib/api";
import { use, useEffect, useState } from "react";

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<PostRead | null>(null);
  const [comments, setComments] = useState<CommentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getPost(id), getComments(id)])
      .then(([p, c]) => { setPost(p); setComments(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      if (post.is_liked) {
        await unlikePost(id);
        setPost({ ...post, is_liked: false, like_count: post.like_count - 1 });
      } else {
        await likePost(id);
        setPost({ ...post, is_liked: true, like_count: post.like_count + 1 });
      }
    } catch {
      // ignore
    }
  };

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    setSubmitting(true);
    try {
      const c = await createComment(id, commentInput.trim());
      setComments((prev) => [...prev, c]);
      setCommentInput("");
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
          게시글을 불러올 수 없어요
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        {post.thumbnail_url && (
          <div className="flex h-52 items-center justify-center bg-surface text-6xl">🍽️</div>
        )}

        <div className="px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Avatar name={post.author.username} src={post.author.profile_image ?? undefined} size="sm" />
            <div>
              <p className="text-sm font-semibold text-text-primary">{post.author.username}</p>
              <p className="text-xs text-text-disabled">{timeAgo(post.created_at)}</p>
            </div>
          </div>

          {post.restaurant && (
            <div className="mb-3 flex items-center gap-2">
              {post.restaurant.category && <Badge variant="primary">{post.restaurant.category.name}</Badge>}
              <span className="text-sm font-medium text-brown">{post.restaurant.name}</span>
              {post.score && <StarRating value={post.score} size={13} />}
            </div>
          )}

          {post.title && (
            <h1 className="mb-2 text-xl font-bold text-text-primary">{post.title}</h1>
          )}

          <p className="text-sm leading-relaxed text-text-primary">{post.content}</p>

          {post.ai_summary && (
            <div className="mt-4 rounded-2xl bg-primary/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🤖</span>
                <span className="text-xs font-bold text-brown">AI 요약</span>
              </div>
              <p className="text-xs text-text-primary leading-relaxed">{post.ai_summary}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-brown">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-4 flex gap-4 border-t border-border pt-4">
            <button type="button" onClick={handleLike} className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span>{post.is_liked ? "❤️" : "🤍"}</span>
              <span>{post.like_count}</span>
            </button>
            <span className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span>💬</span>
              <span>{comments.length}</span>
            </span>
          </div>
        </div>

        {/* 댓글 목록 */}
        {comments.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <h3 className="mb-3 text-sm font-bold text-text-primary">댓글 {comments.length}</h3>
            <div className="flex flex-col divide-y divide-border">
              {comments.map((c) => (
                <div key={c.comment_id} className="py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={c.author?.username ?? "?"} src={c.author?.profile_image ?? undefined} size="xs" />
                    <span className="text-xs font-semibold text-text-primary">{c.author?.username ?? "탈퇴한 사용자"}</span>
                    <span className="text-xs text-text-disabled ml-auto">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 댓글 입력 */}
      <div className="flex gap-2 border-t border-border px-4 py-3">
        <input
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
          placeholder="댓글을 입력하세요"
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleComment}
          disabled={submitting || !commentInput.trim()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          등록
        </button>
      </div>
    </div>
  );
}
