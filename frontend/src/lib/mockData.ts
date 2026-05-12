export type RestaurantPin = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  tags: string[];
  isFriend?: boolean;
  friendColor?: string;
};

export type Restaurant = RestaurantPin & {
  phone: string;
  hours: string;
  breakTime?: string;
  isOpen: boolean;
  thumbnailUrl: string;
  images: string[];
  description?: string;
  score: number;
  scraps: number;
  menus: MenuItem[];
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
  isSignature: boolean;
};

export type Post = {
  id: string;
  type: "simple" | "blog";
  author: { id: string; name: string; avatar?: string };
  restaurant: { id: string; name: string; category: string; address: string };
  rating: number;
  title?: string;
  content: string;
  imageUrl?: string;
  images?: string[];
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export type Review = {
  id: string;
  author: { name: string; avatar?: string };
  rating: number;
  content: string;
  images?: string[];
  likeCount: number;
  createdAt: string;
};

export type Friend = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  restaurantCount: number;
  pinColor: string;
  status: "friend" | "pending" | "none";
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  restaurantCount: number;
  coverEmoji: string;
  coverColor: string;
  members: { id: string; name: string; avatar?: string }[];
};

export type Notification = {
  id: string;
  type: "friend_request" | "like" | "comment" | "group_invite";
  actor: { name: string; avatar?: string };
  content: string;
  isRead: boolean;
  createdAt: string;
};

// ─── Sample Pins (Seoul) ───────────────────────────────────────────────

export const SAMPLE_PINS: RestaurantPin[] = [
  {
    id: "r1",
    lat: 37.4979,
    lng: 127.0276,
    name: "우동가조쿠",
    category: "일식",
    rating: 4.6,
    reviewCount: 128,
    address: "서울 강남구 역삼동 123-45",
    tags: ["#혼밥", "#가성비", "#점심"],
  },
  {
    id: "r2",
    lat: 37.5004,
    lng: 127.0247,
    name: "파스타 부오노",
    category: "양식",
    rating: 4.8,
    reviewCount: 210,
    address: "서울 강남구 강남대로 210",
    tags: ["#데이트", "#파스타", "#분위기"],
    isFriend: true,
    friendColor: "#F472B6",
  },
  {
    id: "r3",
    lat: 37.4963,
    lng: 127.03,
    name: "장인의 빽반",
    category: "한식",
    rating: 4.4,
    reviewCount: 67,
    address: "서울 강남구 논현동 45",
    tags: ["#혼밥", "#점심그릇"],
    isFriend: true,
    friendColor: "#60A5FA",
  },
  {
    id: "r4",
    lat: 37.4945,
    lng: 127.0258,
    name: "스시 오마카세 다이",
    category: "일식",
    rating: 4.5,
    reviewCount: 94,
    address: "서울 강남구 역삼동 234",
    tags: ["#오마카세", "#특별한날"],
    isFriend: true,
    friendColor: "#34D399",
  },
  {
    id: "r5",
    lat: 37.4988,
    lng: 127.033,
    name: "홈대 카페 디저트",
    category: "카페",
    rating: 4.5,
    reviewCount: 182,
    address: "서울 강남구 학동로 15",
    tags: ["#카페", "#디저트", "#데이트"],
  },
  {
    id: "r6",
    lat: 37.4975,
    lng: 127.0315,
    name: "트라토리아 안나",
    category: "양식",
    rating: 4.5,
    reviewCount: 111,
    address: "서울 강남구 도산대로 88",
    tags: ["#이탈리안", "#파인다이닝"],
    isFriend: true,
    friendColor: "#F472B6",
  },
  {
    id: "r7",
    lat: 37.4935,
    lng: 127.0285,
    name: "올리브 키친",
    category: "양식",
    rating: 4.3,
    reviewCount: 56,
    address: "서울 강남구 언주로 34",
    tags: ["#점심", "#파스타"],
  },
];

// 현재 위치 기준으로 mock 핀들을 근처에 배치 (약 200~900m 반경)
const PIN_OFFSETS = [
  { lat:  0.0030, lng:  0.0020 },
  { lat: -0.0020, lng:  0.0040 },
  { lat:  0.0010, lng: -0.0030 },
  { lat: -0.0040, lng: -0.0010 },
  { lat:  0.0050, lng:  0.0010 },
  { lat: -0.0010, lng: -0.0050 },
  { lat:  0.0020, lng: -0.0025 },
];

export function getNearbyPins(baseLat: number, baseLng: number): RestaurantPin[] {
  return SAMPLE_PINS.map((pin, i) => ({
    ...pin,
    lat: baseLat + PIN_OFFSETS[i % PIN_OFFSETS.length].lat,
    lng: baseLng + PIN_OFFSETS[i % PIN_OFFSETS.length].lng,
  }));
}

export const SAMPLE_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    lat: 37.4979,
    lng: 127.0276,
    name: "우동가조쿠",
    category: "일식",
    rating: 4.6,
    reviewCount: 128,
    address: "서울 강남구 역삼동 123-45",
    tags: ["#혼밥", "#가성비", "#점심"],
    phone: "02-1234-5678",
    hours: "매일 11:00 - 22:00",
    breakTime: "15:00 - 17:00",
    isOpen: true,
    thumbnailUrl: "https://placehold.co/400x300/FFC107/895129?text=우동가조쿠",
    images: [
      "https://placehold.co/400x300/FFC107/895129?text=사진1",
      "https://placehold.co/400x300/F9E076/895129?text=사진2",
      "https://placehold.co/400x300/FFF3C4/895129?text=사진3",
    ],
    score: 92,
    scraps: 542,
    description: "국물이 진하고 면이 쫄깃한 우동 전문점. 봇카케 우동의 츄유 향이 일품.",
    menus: [
      { id: "m1", name: "봇카케 우동", price: 9500, description: "시원한 츠유와 쫄깃한 우동의 만남", isSignature: true },
      { id: "m2", name: "에비텐 우동", price: 12000, description: "통새우튀김 2마리가 올라간 든든한 그릇", isSignature: true },
      { id: "m3", name: "카케 우동", price: 7500, isSignature: false },
      { id: "m4", name: "키츠네 우동", price: 8500, isSignature: false },
      { id: "m5", name: "자루 소바", price: 9000, isSignature: false },
      { id: "m6", name: "치킨 카츠동", price: 10500, isSignature: false },
    ],
  },
  {
    id: "r2",
    lat: 37.5004,
    lng: 127.0247,
    name: "파스타 부오노",
    category: "양식",
    rating: 4.8,
    reviewCount: 210,
    address: "서울 강남구 강남대로 210",
    tags: ["#데이트", "#파스타", "#분위기"],
    phone: "02-2345-6789",
    hours: "11:30 - 21:30",
    isOpen: true,
    thumbnailUrl: "https://placehold.co/400x300/FFC107/895129?text=파스타부오노",
    images: ["https://placehold.co/400x300/FFC107/895129?text=파스타1"],
    score: 88,
    scraps: 321,
    menus: [
      { id: "m1", name: "트러플 크림 파스타", price: 18000, isSignature: true },
      { id: "m2", name: "까르보나라", price: 15000, isSignature: false },
    ],
  },
];

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: "rv1",
    author: { name: "미식가흠" },
    rating: 5,
    content: "역삼동 가성비 우동집 인정. 면이 정말 잘 살아있고 츄유가 깊은 맛이에요. 봇카케 시키면 후회 없음...",
    images: [
      "https://placehold.co/120x120/FFC107/895129?text=음식1",
      "https://placehold.co/120x120/F9E076/895129?text=음식2",
    ],
    likeCount: 24,
    createdAt: "2일 전",
  },
  {
    id: "rv2",
    author: { name: "파스타러버" },
    rating: 4,
    content: "점심에 갔는데 줄이 길어서 15분 기다렸어요. 기다릴 만한 맛!",
    likeCount: 8,
    createdAt: "1주일 전",
  },
  {
    id: "rv3",
    author: { name: "강남맛탐" },
    rating: 5,
    content: "혼밥하기 딱 좋은 곳. 카운터 자리에 앉으면 혼자 와도 어색하지 않아요.",
    likeCount: 12,
    createdAt: "2주일 전",
  },
];

export const SAMPLE_POSTS: Post[] = [
  {
    id: "p1",
    type: "blog",
    author: { id: "u1", name: "파스타러버", avatar: undefined },
    restaurant: { id: "r2", name: "파스타 부오노", category: "양식", address: "강남구" },
    rating: 5,
    title: "강남역 인생 파스타집 다녀온 후기 🍝",
    content: "트러플 크림 파스타가 진짜 미쳤어요. 분위기도 좋고 데이트 코스로 강추 딱 맞아요...",
    imageUrl: "https://placehold.co/400x240/FFC107/895129?text=파스타",
    hashtags: ["#강남맛집", "#파스타", "#데이트"],
    likeCount: 142,
    commentCount: 23,
    createdAt: "3시간 전",
  },
  {
    id: "p2",
    type: "simple",
    author: { id: "u2", name: "미식가흠" },
    restaurant: { id: "r1", name: "우동가조쿠", category: "일식", address: "역삼동" },
    rating: 5,
    content: "봇카케 우동 맛있어요. 면이 정말 쫄깃하고 츄유가 깊은 맛 강추!",
    hashtags: ["#혼밥", "#점심", "#가성비"],
    likeCount: 58,
    commentCount: 8,
    createdAt: "5시간 전",
  },
  {
    id: "p3",
    type: "blog",
    author: { id: "u3", name: "강남푸디" },
    restaurant: { id: "r4", name: "스시 오마카세 다이", category: "일식", address: "역삼동" },
    rating: 5,
    title: "친구 생일 기념으로 찾은 오마카세 후기",
    content: "특별한 날을 위한 선택으로 완벽했어요. 셰프님의 설명과 함께하는 코스가 인상적...",
    imageUrl: "https://placehold.co/400x240/F9E076/895129?text=오마카세",
    hashtags: ["#오마카세", "#특별한날", "#강남"],
    likeCount: 89,
    commentCount: 15,
    createdAt: "어제",
  },
  {
    id: "p4",
    type: "simple",
    author: { id: "u4", name: "채원맛집" },
    restaurant: { id: "r5", name: "홈대 카페 디저트", category: "카페", address: "학동로" },
    rating: 4,
    content: "디저트가 너무 예쁘고 맛있어요! 사진도 잘 나오는 카페 추천🍰",
    hashtags: ["#카페", "#디저트", "#데이트"],
    likeCount: 201,
    commentCount: 31,
    createdAt: "2일 전",
  },
];

export const SAMPLE_FRIENDS: Friend[] = [
  { id: "f1", name: "유빈공주", username: "@yubin_p", restaurantCount: 42, pinColor: "#F472B6", status: "friend" },
  { id: "f2", name: "영서먹방", username: "@yeongseo", restaurantCount: 28, pinColor: "#60A5FA", status: "friend" },
  { id: "f3", name: "혜연디저트", username: "@hyeyeon", restaurantCount: 67, pinColor: "#34D399", status: "friend" },
  { id: "f4", name: "민지가즈아", username: "@minji_go", restaurantCount: 15, pinColor: "#F97316", status: "friend" },
  { id: "f5", name: "박세창", username: "@sechang_park", restaurantCount: 33, pinColor: "#A78BFA", status: "pending" },
];

export const SAMPLE_GROUPS: Group[] = [
  {
    id: "g1",
    name: "우리과 회식러버",
    description: "맛있는 거 먹고 싶을 때 모여요",
    memberCount: 8,
    restaurantCount: 47,
    coverEmoji: "🍻",
    coverColor: "#FFC107",
    members: [
      { id: "f1", name: "유빈공주" },
      { id: "f2", name: "영서먹방" },
      { id: "f3", name: "혜연디저트" },
    ],
  },
  {
    id: "g2",
    name: "카페 투어 모임",
    description: "서울 카페를 정복하자!",
    memberCount: 12,
    restaurantCount: 89,
    coverEmoji: "☕",
    coverColor: "#895129",
    members: [
      { id: "f2", name: "영서먹방" },
      { id: "f3", name: "혜연디저트" },
      { id: "f4", name: "민지가즈아" },
    ],
  },
  {
    id: "g3",
    name: "건강식 모임",
    description: "건강하게 먹어요",
    memberCount: 5,
    restaurantCount: 18,
    coverEmoji: "🥗",
    coverColor: "#34D399",
    members: [{ id: "f1", name: "유빈공주" }, { id: "f4", name: "민지가즈아" }],
  },
];

export const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "friend_request",
    actor: { name: "박세창" },
    content: "님이 친구 요청을 보냈어요",
    isRead: false,
    createdAt: "5분 전",
  },
  {
    id: "n2",
    type: "like",
    actor: { name: "유빈공주" },
    content: "님이 회원님의 글을 좋아해요 · \"강남역 인생 파스타집...\"",
    isRead: false,
    createdAt: "1시간 전",
  },
  {
    id: "n3",
    type: "comment",
    actor: { name: "미식가흠" },
    content: "님이 댓글을 남겼어요 · \"저도 먹어봤는데 진짜 맛있더라...\"",
    isRead: false,
    createdAt: "2시간 전",
  },
  {
    id: "n4",
    type: "group_invite",
    actor: { name: "혜연디저트" },
    content: "님이 그룹에 초대했어요 · \"디카로 투어 모임\"",
    isRead: true,
    createdAt: "어제",
  },
  {
    id: "n5",
    type: "like",
    actor: { name: "민지가즈아" },
    content: "님 외 3명이 좋아해요",
    isRead: true,
    createdAt: "어제",
  },
];

export const SAMPLE_HASHTAGS = [
  "#혼밥", "#데이트", "#가성비", "#뷰맛집", "#카페", "#술집", "#분위기", "#야경맛집",
  "#점심", "#저녁", "#브런치", "#디저트", "#파스타", "#오마카세", "#고기", "#해산물",
];

export const CATEGORIES = [
  { id: "korean", name: "한식", emoji: "🍚" },
  { id: "western", name: "양식", emoji: "🍝" },
  { id: "japanese", name: "일식", emoji: "🍣" },
  { id: "chinese", name: "중식", emoji: "🥢" },
  { id: "cafe", name: "카페", emoji: "☕" },
  { id: "pub", name: "술집", emoji: "🍺" },
  { id: "dessert", name: "디저트", emoji: "🍰" },
  { id: "etc", name: "기타", emoji: "🍴" },
];
