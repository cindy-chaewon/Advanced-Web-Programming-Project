"use client";

import PageHeader from "@/components/layout/PageHeader";
import StarRating from "@/components/restaurant/StarRating";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { ApiError, api } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/mockData";
import type { CommentApi, PostReadApi } from "@/types/api";
import { toPost } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [postRaw, setPostRaw] = useState<PostReadApi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [comments, setComments] = useState<CommentApi[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isScrapped, setIsScrapped] = useState(false);
  const [friendStatus, setFriendStatus] = useState<
    "self" | "friend" | "pending" | "none"
  >("none");
  const [friendRequested, setFriendRequested] = useState(false);

  // 글 상세 로드
  useEffect(() => {
    const ac = new AbortController();
    setLoadError(null);
    api
      .get<PostReadApi>(`/posts/${id}`, { auth: false, signal: ac.signal })
      .then((data) => {
        setPostRaw(data);
        setPost(toPost(data));
        setLikeCount(data.like_count);
        setCommentCount(data.comment_count);
        setIsLiked(Boolean(data.is_liked));
        // 작성자 친구 상태 / 식당 스크랩 상태 추가 fetch (실패 허용)
        if (isLoggedIn()) {
          api
            .get<{ friend_status: string }>(`/users/${data.author.user_id}`, {
              signal: ac.signal,
            })
            .then((u) => {
              if (u.friend_status === "accepted") setFriendStatus("friend");
              else if (u.friend_status === "pending") setFriendStatus("pending");
              else if (u.friend_status === "self") setFriendStatus("self");
              else setFriendStatus("none");
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadError(err instanceof ApiError ? err.message : "글을 불러오지 못했어요");
      });
    return () => ac.abort();
  }, [id]);

  // 댓글 모달 열 때 댓글 로드 (한 번만)
  useEffect(() => {
    if (!isCommentOpen || commentsLoaded) return;
    const ac = new AbortController();
    api
      .get<CommentApi[]>(`/posts/${id}/comments`, { auth: false, signal: ac.signal })
      .then((data) => {
        setComments(data);
        setCommentsLoaded(true);
      })
      .catch(() => {});
    return () => ac.abort();
  }, [id, isCommentOpen, commentsLoaded]);

  const handleLike = async () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        await api.post(`/posts/${id}/like`);
      } else {
        await api.delete(`/posts/${id}/like`);
      }
    } catch {
      // 실패 시 롤백
      setIsLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const handleRequestFriend = async () => {
    if (!post || !isLoggedIn()) {
      router.push("/login");
      return;
    }
    try {
      await api.post("/friends/request", {
        target_user_id: Number(post.author.id),
      });
      setFriendRequested(true);
      setFriendStatus("pending");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "요청 실패");
    }
  };

  const handleScrapToggle = async () => {
    if (!post || !isLoggedIn()) {
      router.push("/login");
      return;
    }
    const restaurantId = post.restaurant.id;
    if (!restaurantId) return;
    const next = !isScrapped;
    setIsScrapped(next);
    try {
      if (next) {
        await api.post(`/restaurants/${restaurantId}/scrap`);
      } else {
        await api.delete(`/restaurants/${restaurantId}/scrap`);
      }
    } catch {
      setIsScrapped(!next);
    }
  };

  const handleSubmitComment = async () => {
    const content = commentInput.trim();
    if (!content) return;
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    setPosting(true);
    try {
      const created = await api.post<CommentApi>(`/posts/${id}/comments`, { content });
      setComments((prev) => [...prev, created]);
      setCommentCount((c) => c + 1);
      setCommentInput("");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "댓글 작성에 실패했어요");
    } finally {
      setPosting(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-text-secondary">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!post || !postRaw) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader leftAction="back" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <PageHeader leftAction="back" />

      <div className="flex-1 overflow-y-auto">
        {post.imageUrl && (
          <div className="flex h-52 items-center justify-center bg-surface text-6xl">
            🍽️
          </div>
        )}

        <div className="px-4 py-5 pb-6">
          <div className="mb-3 flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                href={`/hashtags/${encodeURIComponent(tag)}`}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-brown transition-colors hover:bg-primary/20 active:opacity-70"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {post.title && (
            <h1 className="mb-4 text-2xl font-bold text-text-primary">
              {post.title}
            </h1>
          )}

          <div className="mb-3 flex items-center gap-2">
            <Badge variant="primary">{post.restaurant.category}</Badge>
            <Link
              href={`/restaurants/${post.restaurant.id}`}
              className="text-sm font-medium text-brown underline-offset-2 hover:underline"
            >
              {post.restaurant.name}
            </Link>
            {post.rating > 0 && <StarRating value={post.rating} size={13} />}
          </div>

          <div className="flex items-center gap-2">
            <Avatar name={post.author.name} src={post.author.avatar} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                {post.author.name}
              </p>
              <p className="text-xs text-text-disabled">{post.createdAt}</p>
            </div>
            {friendStatus === "none" && !friendRequested && (
              <button
                type="button"
                onClick={handleRequestFriend}
                className="rounded-full bg-brown px-3 py-1 text-xs font-bold text-white"
              >
                + 친구
              </button>
            )}
            {(friendStatus === "pending" || friendRequested) && (
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
                요청 중
              </span>
            )}
            {friendStatus === "friend" && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-brown">
                친구
              </span>
            )}
          </div>

          <hr className="my-5 border-border" />

          <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">
            {post.content}
          </p>

          {postRaw.ai_summary && (
            <div className="mt-5 rounded-2xl bg-primary/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span className="text-sm font-bold text-brown">AI 3줄 요약</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">
                {postRaw.ai_summary}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-white px-4 py-3 pb-safe flex gap-6 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm transition-opacity active:opacity-60"
        >
          <span className="text-lg">{isLiked ? "❤️" : "🤍"}</span>
          <span
            className={`font-medium ${isLiked ? "text-red-500" : "text-text-secondary"}`}
          >
            {likeCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsCommentOpen(true)}
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-opacity active:opacity-60"
        >
          <span className="text-lg">💬</span>
          <span className="font-medium">{commentCount}</span>
        </button>
        <button
          type="button"
          onClick={handleScrapToggle}
          className="ml-auto flex items-center gap-1.5 text-sm transition-opacity active:opacity-60"
          aria-label="식당 스크랩"
        >
          <span className="text-lg">{isScrapped ? "🔖" : "📑"}</span>
          <span
            className={`font-medium ${isScrapped ? "text-brown" : "text-text-secondary"}`}
          >
            {isScrapped ? "스크랩됨" : "스크랩"}
          </span>
        </button>
      </div>

      {isCommentOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40">
          <div className="flex-1" onClick={() => setIsCommentOpen(false)} />

          <div className="flex h-3/4 flex-col rounded-t-2xl bg-white animate-slide-up shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <h3 className="text-base font-bold text-text-primary">
                댓글 <span className="text-brown">{commentCount}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCommentOpen(false)}
                className="text-text-secondary text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!commentsLoaded ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="text-4xl mb-3">💭</span>
                  <p className="text-sm font-medium text-text-primary">
                    아직 작성된 댓글이 없습니다.
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    첫 번째 댓글을 남겨보세요!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {comments.map((c) => (
                    <div key={c.comment_id} className="flex gap-3">
                      <Avatar
                        name={c.author.username}
                        src={c.author.profile_image ?? undefined}
                        size="xs"
                      />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-text-primary">
                            {c.author.username}
                          </span>
                          <span className="text-xs text-text-disabled">
                            {formatRelativeTime(c.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm leading-relaxed text-text-primary">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border px-4 py-3 pb-safe bg-surface flex gap-2 items-center">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                placeholder="댓글을 남겨보세요..."
                className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brown"
                disabled={posting}
              />
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={posting || !commentInput.trim()}
                className="shrink-0 rounded-xl bg-brown px-4 py-2.5 text-sm font-bold text-white transition-opacity active:opacity-80 disabled:opacity-40"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
