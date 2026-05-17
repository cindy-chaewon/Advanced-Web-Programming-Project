"use client";

import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { SAMPLE_POSTS } from "@/lib/mockData";
import { use, useState } from "react";
import Link from "next/link"; // 🌟 Link 컴포넌트 추가

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const post = SAMPLE_POSTS.find((p) => p.id === id) ?? SAMPLE_POSTS[0];

  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <PageHeader leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        {/* 이미지 */}
        {post.imageUrl && (
          <div className="flex h-52 items-center justify-center bg-surface text-6xl">
            🍽️
          </div>
        )}

        <div className="px-4 py-5 pb-6">
          {/* 🌟 수정된 해시태그 영역 */}
          <div className="mb-3 flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                // 실제 구현하신 검색 페이지 경로에 맞게 href를 수정해 주세요. (예: /search?q=태그)
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-brown transition-colors hover:bg-primary/20 active:opacity-70"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* 제목 */}
          {post.title && (
            <h1 className="mb-4 text-2xl font-bold text-text-primary">
              {post.title}
            </h1>
          )}

          {/* 식당 정보 */}
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="primary">{post.restaurant.category}</Badge>
            <span className="text-sm font-medium text-brown">
              {post.restaurant.name}
            </span>
            <StarRating value={post.rating} size={13} />
          </div>

          {/* 작성자 */}
          <div className="flex items-center gap-2">
            <Avatar
              name={post.author.name}
              src={post.author.avatar}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {post.author.name}
              </p>
              <p className="text-xs text-text-disabled">{post.createdAt}</p>
            </div>
          </div>

          {/* 구분선 */}
          <hr className="my-5 border-border" />

          {/* 본문 */}
          <p className="text-sm leading-relaxed text-text-primary">
            {post.content}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-white px-4 py-3 pb-safe flex gap-6 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={() => setIsLiked(!isLiked)}
          className="flex items-center gap-1.5 text-sm transition-opacity active:opacity-60"
        >
          <span className="text-lg">{isLiked ? "❤️" : "🤍"}</span>
          <span
            className={`font-medium ${isLiked ? "text-red-500" : "text-text-secondary"}`}
          >
            {isLiked ? post.likeCount + 1 : post.likeCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsCommentOpen(true)}
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-opacity active:opacity-60"
        >
          <span className="text-lg">💬</span>
          <span className="font-medium">{post.commentCount}</span>
        </button>
      </div>

      {isCommentOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40">
          <div className="flex-1" onClick={() => setIsCommentOpen(false)} />

          <div className="flex h-3/4 flex-col rounded-t-2xl bg-white animate-slide-up shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <h3 className="text-base font-bold text-text-primary">
                댓글 <span className="text-brown">{post.commentCount}</span>
              </h3>
              <button
                onClick={() => setIsCommentOpen(false)}
                className="text-text-secondary text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">💭</span>
                <p className="text-sm font-medium text-text-primary">
                  아직 작성된 댓글이 없습니다.
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  첫 번째 댓글을 남겨보세요!
                </p>
              </div>
            </div>

            <div className="shrink-0 border-t border-border px-4 py-3 pb-safe bg-surface flex gap-2 items-center">
              <input
                type="text"
                placeholder="댓글을 남겨보세요..."
                className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brown"
              />
              <button className="shrink-0 rounded-xl bg-brown px-4 py-2.5 text-sm font-bold text-white transition-opacity active:opacity-80">
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
