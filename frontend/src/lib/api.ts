import { getToken, removeToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = (() => {
  try { return new URL(BASE).origin; } catch { return "http://localhost:8000"; }
})();

// ─── 유틸 ────────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주일 전`;
  return date.toLocaleDateString("ko-KR");
}

// ─── 기본 fetch ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("인증이 필요합니다.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "요청에 실패했습니다.");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API 응답 타입 ────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  profile_image: string | null;
  is_new: boolean;
}

export interface UserPublic {
  user_id: number;
  username: string;
  email: string | null;
  profile_image: string | null;
}

export interface UserMeOut {
  user_id: number;
  username: string;
  email: string | null;
  profile_image: string | null;
  bio: string | null;
  points: number;
  level: number;
  created_at: string;
}

export interface UserStatsOut {
  post_count: number;
  review_count: number;
  scrap_count: number;
  friend_count: number;
}

export interface UserSearchHit {
  user_id: number;
  username: string;
  profile_image: string | null;
  bio: string | null;
  friend_status: string;
}

export interface CategoryOut {
  category_id: number;
  name: string;
}

export interface AddressOut {
  address_id: number;
  full_address: string | null;
  district: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
}

export interface RestaurantBrief {
  restaurant_id: number;
  name: string;
  phone: string | null;
  opening_hours: string | null;
  category: CategoryOut | null;
  address: AddressOut | null;
  hashtags: string[];
  avg_review_score: number;
  review_count: number;
  scrap_count: number;
  distance_meters: number | null;
  thumbnail_url: string | null;
}

export interface RestaurantScoreOut {
  restaurant_id: number;
  avg_review_score: number;
  review_count: number;
  scrap_count: number;
  total_score: number;
}

export interface RestaurantRead {
  restaurant_id: number;
  name: string;
  description: string | null;
  phone: string | null;
  opening_hours: string | null;
  break_time: string | null;
  thumbnail_url: string | null;
  images: string[];
  category: CategoryOut | null;
  address: AddressOut | null;
  hashtags: string[];
  score: RestaurantScoreOut | null;
  registered_by: number | null;
  created_at: string;
}

export interface PostBrief {
  post_id: number;
  type: string;
  title: string | null;
  content_preview: string;
  score: number | null;
  thumbnail_url: string | null;
  author: UserPublic;
  restaurant: RestaurantBrief | null;
  hashtags: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface PostRead {
  post_id: number;
  type: string;
  title: string | null;
  content: string | null;
  score: number | null;
  ai_summary: string | null;
  thumbnail_url: string | null;
  author: UserPublic;
  restaurant: RestaurantBrief | null;
  images: string[];
  hashtags: string[];
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CommentOut {
  comment_id: number;
  post_id: number;
  content: string;
  author: UserPublic | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReviewOut {
  review_id: number;
  type: string;
  content: string | null;
  score: number | null;
  author: UserPublic;
  restaurant_id: number;
  restaurant_name?: string | null;
  images: string[];
  like_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface FriendOut {
  user_id: number;
  username: string;
  profile_image: string | null;
  color: string;
  status: string;
  created_at: string;
}

export interface FriendRequestOut {
  from_user_id: number;
  from_username: string;
  from_profile_image: string | null;
  created_at: string;
}

export interface GroupOut {
  group_id: number;
  name: string;
  owner_id: number;
  color: string | null;
  icon: string | null;
  member_count: number;
  created_at: string;
}

export interface GroupMemberOut {
  user_id: number;
  username: string;
  profile_image: string | null;
  role: string;
  joined_at: string;
}

export interface NotificationOut {
  notification_id: number;
  type: string;
  related_id: number | null;
  actor: { user_id: number; username: string; profile_image: string | null } | null;
  is_read: boolean;
  created_at: string;
}

export interface TagOut {
  tag_id: number;
  name: string;
}

/** 카카오맵 핀 표시용 경량 타입 */
export interface MapPin {
  restaurant_id: number;
  name: string;
  lat: number;
  lng: number;
  category: string;
  avg_review_score: number;
  review_count: number;
  address: string;
  hashtags: string[];
  thumbnail_url: string | null;
}

export function toMapPin(r: RestaurantBrief): MapPin {
  return {
    restaurant_id: r.restaurant_id,
    name: r.name,
    lat: r.address?.latitude ?? 0,
    lng: r.address?.longitude ?? 0,
    category: r.category?.name ?? "",
    avg_review_score: r.avg_review_score,
    review_count: r.review_count,
    address: r.address?.full_address ?? "",
    hashtags: r.hashtags,
    thumbnail_url: r.thumbnail_url,
  };
}

// ─── Auth ────────────────────────────────────────────────────

export function kakaoLoginUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? "";
  const redirectUri = `${BASE}/auth/kakao/callback`;
  return `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
}

export function googleLoginUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const redirectUri = `${BASE}/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
}

export function certLogin(ci: string, username?: string, email?: string) {
  return apiFetch<TokenResponse>("/auth/cert-login", {
    method: "POST",
    body: JSON.stringify({ ci, username, email }),
  });
}

export function getMe() {
  return apiFetch<UserMeOut>("/users/me");
}

export function logout() {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

// ─── Users ────────────────────────────────────────────────────

export function getMyStats() {
  return apiFetch<UserStatsOut>("/users/me/stats");
}

export function getMyPosts(params?: { limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  return apiFetch<PostBrief[]>(`/users/me/posts?${qs}`);
}

export function getMyScraps() {
  return apiFetch<RestaurantBrief[]>("/users/me/scraps");
}

export function getMyReviews(params?: { limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  return apiFetch<ReviewOut[]>(`/users/me/reviews?${qs}`);
}

export function updateProfile(body: { username?: string; profile_image?: string; bio?: string }) {
  return apiFetch<UserMeOut>("/users/me", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function searchUsers(nickname: string) {
  return apiFetch<UserSearchHit[]>(`/users/search?nickname=${encodeURIComponent(nickname)}`);
}

// ─── Restaurants ────────────────────────────────────────────────────

export function getNearbyRestaurants(lat: number, lng: number, radius = 2000) {
  return apiFetch<RestaurantBrief[]>(
    `/restaurants?lat=${lat}&lng=${lng}&radius=${radius}`,
  );
}

export function searchRestaurants(params: { q?: string; tag?: string; category_id?: number }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.tag) qs.set("tag", params.tag);
  if (params.category_id) qs.set("category_id", String(params.category_id));
  return apiFetch<RestaurantBrief[]>(`/restaurants/search?${qs}`);
}

export function getRestaurant(id: number | string) {
  return apiFetch<RestaurantRead>(`/restaurants/${id}`);
}

export function scrapRestaurant(id: number | string) {
  return apiFetch<{ scrapped: boolean }>(`/restaurants/${id}/scrap`, { method: "POST" });
}

export function unscrapRestaurant(id: number | string) {
  return apiFetch<void>(`/restaurants/${id}/scrap`, { method: "DELETE" });
}

export interface CreateRestaurantInput {
  name: string;
  description?: string;
  phone?: string;
  opening_hours?: string;
  category_id: number;
  address: {
    full_address?: string;
    latitude: number;
    longitude: number;
    district?: string;
    city?: string;
  };
  thumbnail_url?: string;
  image_urls?: string[];
  hashtags?: string[];
  group_ids?: number[];
}

export function createRestaurant(body: CreateRestaurantInput) {
  return apiFetch<RestaurantRead>("/restaurants", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─── Posts ────────────────────────────────────────────────────

export function getPosts(params?: {
  sort?: string;
  type?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.type) qs.set("type", params.type);
  if (params?.lat !== undefined) qs.set("lat", String(params.lat));
  if (params?.lng !== undefined) qs.set("lng", String(params.lng));
  if (params?.radius !== undefined) qs.set("radius", String(params.radius));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  return apiFetch<PostBrief[]>(`/posts?${qs}`);
}

export function getPost(id: number | string) {
  return apiFetch<PostRead>(`/posts/${id}`);
}

export function createPost(body: {
  type: "blog" | "simple";
  restaurant_id: number;
  title?: string;
  content: string;
  score?: number;
  hashtags?: string[];
  image_urls?: string[];
  thumbnail_url?: string;
}) {
  return apiFetch<PostRead>("/posts", { method: "POST", body: JSON.stringify(body) });
}

export function likePost(id: number | string) {
  return apiFetch<{ liked: boolean }>(`/posts/${id}/like`, { method: "POST" });
}

export function unlikePost(id: number | string) {
  return apiFetch<void>(`/posts/${id}/like`, { method: "DELETE" });
}

// ─── Comments ────────────────────────────────────────────────────

export function getComments(postId: number | string, limit = 50) {
  return apiFetch<CommentOut[]>(`/posts/${postId}/comments?limit=${limit}`);
}

export function createComment(postId: number | string, content: string) {
  return apiFetch<CommentOut>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// ─── Reviews ────────────────────────────────────────────────────

export function getReviews(restaurantId: number | string) {
  return apiFetch<ReviewOut[]>(`/restaurants/${restaurantId}/reviews`);
}

export function createReview(restaurantId: number | string, body: {
  type?: "simple" | "blog";
  content: string;
  score: number;
  image_urls?: string[];
}) {
  return apiFetch<ReviewOut>(`/restaurants/${restaurantId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ type: "simple", ...body }),
  });
}

// ─── Friends ────────────────────────────────────────────────────

export function getFriends() {
  return apiFetch<FriendOut[]>("/friends");
}

export function getFriendRequests() {
  return apiFetch<FriendRequestOut[]>("/friends/requests");
}

export function requestFriend(targetUserId: number) {
  return apiFetch<{ message: string }>("/friends/request", {
    method: "POST",
    body: JSON.stringify({ target_user_id: targetUserId }),
  });
}

export function acceptFriend(fromUserId: number) {
  return apiFetch<{ message: string }>("/friends/accept", {
    method: "POST",
    body: JSON.stringify({ from_user_id: fromUserId }),
  });
}

export function rejectFriend(fromUserId: number) {
  return apiFetch<{ message: string }>("/friends/reject", {
    method: "POST",
    body: JSON.stringify({ from_user_id: fromUserId }),
  });
}

// ─── Groups ────────────────────────────────────────────────────

export function getGroups() {
  return apiFetch<GroupOut[]>("/groups");
}

export function createGroup(body: { name: string; icon?: string; color?: string; invite_user_ids?: number[] }) {
  return apiFetch<GroupOut>("/groups", { method: "POST", body: JSON.stringify(body) });
}

export function getGroup(id: number | string) {
  return apiFetch<GroupOut>(`/groups/${id}`);
}

export function getGroupMembers(id: number | string) {
  return apiFetch<GroupMemberOut[]>(`/groups/${id}/members`);
}

export function getGroupRestaurants(id: number | string) {
  return apiFetch<RestaurantBrief[]>(`/groups/${id}/restaurants`);
}

export function inviteGroupMembers(id: number | string, userIds: number[]) {
  return apiFetch<{ message: string }>(`/groups/${id}/members`, {
    method: "POST",
    body: JSON.stringify({ user_ids: userIds }),
  });
}

// ─── Notifications ────────────────────────────────────────────────────

export function getNotifications(unreadOnly = false) {
  return apiFetch<NotificationOut[]>(`/notifications?unread_only=${unreadOnly}`);
}

export function markNotificationRead(id: number) {
  return apiFetch<{ message: string }>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiFetch<{ updated: number }>("/notifications/read-all", { method: "POST" });
}

// ─── Hashtags ────────────────────────────────────────────────────

export function getPopularTags(limit = 20) {
  return apiFetch<TagOut[]>(`/hashtags/popular?limit=${limit}`);
}

// ─── Categories ────────────────────────────────────────────────────

export function getCategories() {
  return apiFetch<CategoryOut[]>("/categories");
}

// ─── AI ────────────────────────────────────────────────────

export interface AiReviewOut {
  restaurant_id: number;
  review: string;
  review_count: number;
  post_count: number;
}

export function getAiReview(id: number | string) {
  return apiFetch<AiReviewOut>(`/restaurants/${id}/ai-review`);
}

// ─── Upload ────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch<{ url: string }>("/upload/image", { method: "POST", body: form });
  const url = res.url.startsWith("http") ? res.url : `${BACKEND_ORIGIN}${res.url}`;
  return { url };
}
