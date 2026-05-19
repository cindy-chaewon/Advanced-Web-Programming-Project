// 백엔드 응답 타입 (snake_case) + mockData 호환 adapter.
// 기준: backend/app/schemas/* (Pydantic) — 페이지 연동하면서 필요 시 보강.

import type {
  Friend,
  Group,
  MenuItem,
  Notification,
  Post,
  Restaurant,
  RestaurantPin,
  Review,
} from "@/lib/mockData";
import { hexFromColorName, type PinColorName } from "@/lib/colors";
import { formatRelativeTime } from "@/lib/format";

// ─── 공통 ───────────────────────────────────────────────────────────────

export type UserPublicApi = {
  user_id: number;
  username: string;
  nickname?: string | null;
  profile_image?: string | null;
};

export type CategoryApi = {
  category_id: number;
  name: string;
  icon?: string | null;
};

export type AddressApi = {
  address_id?: number;
  latitude: string | number;
  longitude: string | number;
  full_address?: string | null;
  district?: string | null;
  city?: string | null;
};

// ─── Restaurant ─────────────────────────────────────────────────────────

export type RestaurantBriefApi = {
  restaurant_id: number;
  name: string;
  phone?: string | null;
  opening_hours?: string | null;
  thumbnail_url?: string | null;
  category?: CategoryApi | null;
  address?: AddressApi | null;
  hashtags?: string[];
  avg_review_score?: number | null;
  review_count?: number | null;
  scrap_count?: number | null;
  distance_meters?: number | null;
  is_scrapped?: boolean | null;
  friend_pin_color?: PinColorName | null;
};

export type MenuApi = {
  menu_id: number;
  name: string;
  price: number;
  description?: string | null;
  is_signature: boolean;
};

export type RestaurantScoreApi = {
  avg_review_score: number;
  review_count: number;
  scrap_count: number;
  total_score: number;
};

export type RestaurantReadApi = {
  restaurant_id: number;
  name: string;
  description?: string | null;
  phone?: string | null;
  opening_hours?: string | null;
  break_time?: string | null;
  thumbnail_url?: string | null;
  images?: string[];
  category?: CategoryApi | null;
  address?: AddressApi | null;
  hashtags?: string[];
  score?: RestaurantScoreApi | null;
  is_open?: boolean | null;
  is_scrapped?: boolean | null;
  friend_pin_color?: PinColorName | null;
};

export type AiReviewApi = {
  restaurant_id: number;
  review: string;
  review_count: number;
  post_count: number;
};

// ─── Post ───────────────────────────────────────────────────────────────

export type PostBriefApi = {
  post_id: number;
  type: "blog" | "simple";
  title?: string | null;
  content_preview: string;
  score?: number | null;
  thumbnail_url?: string | null;
  author: UserPublicApi;
  restaurant?: RestaurantBriefApi | null;
  hashtags?: string[];
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  created_at: string;
};

export type PostReadApi = Omit<PostBriefApi, "content_preview"> & {
  content: string;
  ai_summary?: string | null;
  images?: string[];
};

// ─── Review ─────────────────────────────────────────────────────────────

export type CommentApi = {
  comment_id: number;
  post_id: number;
  content: string;
  author: UserPublicApi;
  created_at: string;
  updated_at?: string | null;
};

export type ReviewReadApi = {
  review_id: number;
  type: "simple" | "blog";
  score: number;
  content: string;
  images?: string[];
  like_count: number;
  is_liked?: boolean;
  author: UserPublicApi;
  restaurant?: RestaurantBriefApi | null;
  created_at: string;
};

// ─── Friend ─────────────────────────────────────────────────────────────
// 백엔드 /friends 응답: status="accepted"|"pending", color: 5색 enum, username
// 친구 요청 보낸 사람 추적용 별도 필드 없음

export type FriendApi = {
  user_id: number;
  username: string;
  profile_image?: string | null;
  color: PinColorName;
  status: "accepted" | "pending";
  created_at: string;
};

export type FriendRequestApi = {
  user_id: number;
  username: string;
  profile_image?: string | null;
  created_at: string;
};

// ─── User (확장 프로필) ─────────────────────────────────────────────────

export type UserSearchApi = {
  user_id: number;
  username: string;
  profile_image?: string | null;
  bio?: string | null;
  friend_status: "accepted" | "pending" | "none";
};

export type UserDetailApi = {
  user_id: number;
  username: string;
  profile_image?: string | null;
  bio?: string | null;
  level?: number;
  points?: number;
  post_count: number;
  review_count: number;
  friend_count: number;
  friend_status: "accepted" | "pending" | "none" | "self";
};

// ─── Group ──────────────────────────────────────────────────────────────

export type GroupMemberApi = {
  user_id: number;
  username: string;
  profile_image?: string | null;
  role: "owner" | "member";
  joined_at: string;
};

export type GroupApi = {
  group_id: number;
  name: string;
  owner_id: number;
  icon: string;
  color: string;
  member_count: number;
  created_at: string;
};

// ─── Notification ───────────────────────────────────────────────────────

export type ActorBriefApi = {
  user_id: number;
  username: string;
  profile_image?: string | null;
};

export type NotificationApi = {
  notification_id: number;
  type: "friend_request" | "like" | "comment" | "group_invite";
  related_id?: number | null;
  actor?: ActorBriefApi | null;
  is_read: boolean;
  created_at: string;
};

// ─── adapter: API → mockData ────────────────────────────────────────────
// mockData를 import한 기존 페이지가 점진적으로 API로 옮겨가도록 변환만 담당.

function avatarOrFallback(profile?: string | null): string | undefined {
  return profile ?? undefined;
}

function asNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number.parseFloat(v) || 0;
}

export function toRestaurantPin(r: RestaurantBriefApi): RestaurantPin {
  return {
    id: String(r.restaurant_id),
    lat: asNumber(r.address?.latitude),
    lng: asNumber(r.address?.longitude),
    name: r.name,
    category: r.category?.name ?? "기타",
    rating: r.avg_review_score ?? 0,
    reviewCount: r.review_count ?? 0,
    address: r.address?.full_address ?? "",
    tags: r.hashtags ?? [],
    isFriend: r.friend_pin_color != null,
    friendColor: r.friend_pin_color ? hexFromColorName(r.friend_pin_color) : undefined,
  };
}

export function toMenuItem(m: MenuApi): MenuItem {
  return {
    id: String(m.menu_id),
    name: m.name,
    price: m.price,
    description: m.description ?? undefined,
    isSignature: m.is_signature,
  };
}

export function toRestaurant(r: RestaurantReadApi, menus: MenuApi[] = []): Restaurant {
  return {
    id: String(r.restaurant_id),
    lat: asNumber(r.address?.latitude),
    lng: asNumber(r.address?.longitude),
    name: r.name,
    category: r.category?.name ?? "기타",
    rating: r.score?.avg_review_score ?? 0,
    reviewCount: r.score?.review_count ?? 0,
    address: r.address?.full_address ?? "",
    tags: r.hashtags ?? [],
    isFriend: r.friend_pin_color != null,
    friendColor: r.friend_pin_color ? hexFromColorName(r.friend_pin_color) : undefined,
    phone: r.phone ?? "",
    hours: r.opening_hours ?? "",
    breakTime: r.break_time ?? undefined,
    isOpen: r.is_open ?? true,
    thumbnailUrl: r.thumbnail_url ?? "",
    images: r.images ?? [],
    description: r.description ?? undefined,
    score: r.score?.total_score ?? 0,
    scraps: r.score?.scrap_count ?? 0,
    menus: menus.map(toMenuItem),
  };
}

export function toPost(p: PostBriefApi | PostReadApi): Post {
  const content = "content" in p ? p.content : p.content_preview;
  return {
    id: String(p.post_id),
    type: p.type,
    author: {
      id: String(p.author.user_id),
      name: p.author.nickname ?? p.author.username,
      avatar: avatarOrFallback(p.author.profile_image),
    },
    restaurant: p.restaurant
      ? {
          id: String(p.restaurant.restaurant_id),
          name: p.restaurant.name,
          category: p.restaurant.category?.name ?? "",
          address: p.restaurant.address?.full_address ?? "",
        }
      : { id: "", name: "", category: "", address: "" },
    rating: p.score ?? 0,
    title: p.title ?? undefined,
    content,
    imageUrl: p.thumbnail_url ?? undefined,
    images: "images" in p ? p.images : undefined,
    hashtags: p.hashtags ?? [],
    likeCount: p.like_count,
    commentCount: p.comment_count,
    createdAt: formatRelativeTime(p.created_at),
  };
}

export function toReview(r: ReviewReadApi): Review {
  return {
    id: String(r.review_id),
    author: {
      name: r.author.nickname ?? r.author.username,
      avatar: avatarOrFallback(r.author.profile_image),
    },
    rating: r.score,
    content: r.content,
    images: r.images,
    likeCount: r.like_count,
    createdAt: formatRelativeTime(r.created_at),
  };
}

function mapFriendStatus(s: string): Friend["status"] {
  if (s === "accepted") return "friend";
  if (s === "pending") return "pending";
  return "none";
}

export function toFriend(f: FriendApi): Friend {
  return {
    id: String(f.user_id),
    name: f.username,
    username: f.username,
    avatar: avatarOrFallback(f.profile_image),
    restaurantCount: 0,
    pinColor: hexFromColorName(f.color),
    status: mapFriendStatus(f.status),
  };
}

export function toFriendFromSearch(u: UserSearchApi): Friend {
  return {
    id: String(u.user_id),
    name: u.username,
    username: u.username,
    avatar: avatarOrFallback(u.profile_image),
    restaurantCount: 0,
    pinColor: "#F472B6",
    status: mapFriendStatus(u.friend_status),
  };
}

export function toGroup(g: GroupApi, members: GroupMemberApi[] = []): Group {
  return {
    id: String(g.group_id),
    name: g.name,
    description: undefined,
    memberCount: g.member_count,
    restaurantCount: 0,
    coverEmoji: g.icon,
    coverColor: g.color,
    members: members.map((m) => ({
      id: String(m.user_id),
      name: m.username,
      avatar: avatarOrFallback(m.profile_image),
    })),
  };
}

function notificationContent(n: NotificationApi): string {
  const who = n.actor?.username ?? "누군가";
  switch (n.type) {
    case "friend_request":
      return `${who}님이 친구 요청을 보냈어요`;
    case "like":
      return `${who}님이 회원님의 글에 좋아요를 눌렀어요`;
    case "comment":
      return `${who}님이 회원님의 글에 댓글을 남겼어요`;
    case "group_invite":
      return `${who}님이 그룹에 초대했어요`;
    default:
      return "";
  }
}

export function toNotification(n: NotificationApi): Notification {
  return {
    id: String(n.notification_id),
    type: n.type,
    actor: {
      name: n.actor?.username ?? "알 수 없음",
      avatar: avatarOrFallback(n.actor?.profile_image),
    },
    content: notificationContent(n),
    isRead: n.is_read,
    createdAt: formatRelativeTime(n.created_at),
  };
}
