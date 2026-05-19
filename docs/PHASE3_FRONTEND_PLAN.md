# Phase 3 — 프론트엔드 API 연동 계획

> **작성일**: 2026-05-19
> **작업자**: 지영서 + Claude Code
> **데모 D-day**: 2026-05-26 (D-7)
> **현재 브랜치**: `feature/api-integration` (← `feature/ui-design`에서 분기)
> **기준 문서**: `docs/API.md` (78 엔드포인트), `frontend/src/lib/mockData.ts` (8 타입)

---

## 0. 한눈에 보기

| 지표 | 수치 |
|---|---|
| 프론트 페이지 | 21개 (App Router) |
| 프론트 컴포넌트 | 30개 (layout/ui/map/restaurant/community/friends/my/search) |
| mockData 의존 페이지 | **18 / 21** (login·write·edit·settings 4개 제외) |
| 실제 `fetch()` 호출 | **0건** — API 연동 0% |
| 백엔드 엔드포인트 | 78개 (✅ 전부 구현 완료) |
| 핵심 갭 | (1) 좌표 가천대 아님 (2) JWT/auth 레이어 없음 (3) 이미지 업로드 UI 없음 |

---

## 1. mockData 타입 ↔ 백엔드 응답 매핑

| mockData 타입 | 백엔드 Pydantic 스키마 (예상) | 차이/갭 |
|---|---|---|
| `RestaurantPin` | `RestaurantBrief` (with `distance_meters`) | `id` 문자열 vs DB는 `int` → 프론트에서 캐스팅 |
| `Restaurant` | `RestaurantRead` + 메뉴 nested | `hours`/`breakTime` → DB는 `opening_hours`/`break_time` (snake) |
| `MenuItem` | `MenuRead` | `isSignature` → `is_signature` |
| `Post` | `PostRead` | `author.id` 문자열, `restaurant.id` 문자열 → int 캐스팅. `createdAt` "3시간 전" → ISO 8601 |
| `Review` | `ReviewRead` | `rating` → `score` (백엔드 명칭) |
| `Friend` | `FriendRead` | `pinColor` 5가지 enum (pink/blue/green/purple/coral) 매핑. `status` = `friend_status` |
| `Group` | `GroupRead` | `coverEmoji`/`coverColor` → 백엔드 `icon`/`color` |
| `Notification` | `NotificationRead` | `actor` 객체 → 백엔드 `actor_id` (채원 1bda9ee 추가) |

**작업**: `frontend/src/types/api.ts`에 snake_case 응답 타입 정의 + adapter 함수로 mockData 타입으로 변환 (점진 마이그레이션 용).

---

## 2. 페이지별 매핑표 (21 페이지)

### 2-1. 인증

| 페이지 | mockData 사용 | 매칭 엔드포인트 | 우선순위 |
|---|---|---|---|
| `/login` | ❌ (정적) | `POST /auth/kakao`, `POST /auth/cert-login` | **P0** |

UI 상태: 카카오 버튼·인증서 버튼만. OAuth flow·콜백 페이지 신설 필요 (`app/auth/kakao/callback/page.tsx`).

---

### 2-2. 탭 5개 (`(tabs)/`)

| 페이지 | mockData 사용 | 매칭 엔드포인트 | 우선순위 |
|---|---|---|---|
| `/` (홈/지도) | `SAMPLE_PINS`, `getNearbyPins()` | `GET /restaurants?lat=&lng=&radius=&category_id=` | **P0** |
| `/search` | `SAMPLE_PINS`, `SAMPLE_HASHTAGS`, `CATEGORIES` | `GET /search/suggestions`, `/search/autocomplete?q=`, `/categories`, `/hashtags/popular` | **P2** |
| `/community` | `SAMPLE_POSTS` (type 필터) | `GET /posts?sort=latest&type=blog|simple` (※ type 필터 채원 추가) | **P1** |
| `/friends` | `SAMPLE_FRIENDS`, `SAMPLE_GROUPS` | `GET /friends`, `/friends/requests`, `/groups` | **P2** |
| `/my` | `SAMPLE_FRIENDS`, `SAMPLE_PINS`, `SAMPLE_POSTS` | `GET /users/me`, `/users/me/stats`, `/users/me/posts`, `/users/me/scraps`, `/friends` | **P2** |

---

### 2-3. 식당

| 페이지 | mockData 사용 | 매칭 엔드포인트 | 우선순위 |
|---|---|---|---|
| `/restaurants/[id]` | `SAMPLE_RESTAURANTS`, `SAMPLE_REVIEWS` | `GET /restaurants/:id`, `/menus`, `/reviews`, `POST/DELETE /scrap`, **`GET /ai-review`** | **P0** |
| `/restaurants/new` | ❌ (폼) | `POST /restaurants`, `POST /upload/image` | **P3** |

---

### 2-4. 커뮤니티

| 페이지 | mockData 사용 | 매칭 엔드포인트 | 우선순위 |
|---|---|---|---|
| `/community/[id]` | `SAMPLE_POSTS` | `GET /posts/:id`, `POST/DELETE /like`, `POST /posts/:id/summary`, 댓글 4개 | **P1** |
| `/community/write` | ❌ (라우터 선택) | (분기만) | **P1** |
| `/community/write/blog` | ❌ (폼) | `POST /posts` (`type=blog`), `POST /upload/image` | **P1** |
| `/community/write/simple` | ❌ (폼) | `POST /posts` (`type=simple` + `score`) | **P1** |

---

### 2-5. 친구·그룹

| 페이지 | mockData 사용 | 매칭 엔드포인트 | 우선순위 |
|---|---|---|---|
| `/friends/[id]` | `SAMPLE_FRIENDS`, `SAMPLE_PINS`, `SAMPLE_POSTS` | `GET /users/:user_id`, `/users/:user_id/posts`, `/users/:user_id/scraps`, `PATCH /friends/:id` (색상) | **P2** |
| `/friends/search` | `SAMPLE_FRIENDS` | `GET /users/search?nickname=`, `POST /friends/request` | **P2** |
| `/friends/groups/[id]` | `SAMPLE_GROUPS`, `SAMPLE_PINS` | `GET /groups/:id`, `/members`, `/restaurants`, `/posts` | **P2** |
| `/friends/groups/new` | `SAMPLE_FRIENDS` | `POST /groups` (invite_user_ids 포함) | **P2** |

---

### 2-6. 마이페이지

| 페이지 | mockData 사용 | 매칭 엔드포인트 | 우선순위 |
|---|---|---|---|
| `/my/edit` | ❌ (폼) | `PUT /users/me`, `GET /users/check-nickname` | **P2** |
| `/my/activity` | `SAMPLE_PINS`, `SAMPLE_POSTS` | `GET /users/me/posts`, `/reviews`, `/scraps` | **P2** |
| `/my/notifications` | `SAMPLE_NOTIFICATIONS` | `GET /notifications`, `PATCH /:id/read`, `POST /read-all` | **P2** |
| `/my/settings` | ❌ (메뉴) | `DELETE /users/me` (탈퇴), `POST /auth/logout` | **P3** |
| `/my/settings/notifications` | ❌ (토글) | `GET/PATCH /users/me/notifications` (4종 토글) | **P3** |

---

## 3. 우선순위 정의 (D-7 기준)

- **P0** = 데모 골든패스 핵심. 안 되면 데모 불가능. (홈·식당 상세·로그인)
- **P1** = 데모에 보여줄 화면. (커뮤니티 4개)
- **P2** = 자연스러운 흐름을 위해 필요. (친구·그룹·마이·검색)
- **P3** = 시간 남으면. (식당 등록·설정 토글)

---

## 4. 발견된 갭 (조치 필요)

### 4-1. 좌표 정합 ⚠️ (가장 시급)
- `app/(tabs)/page.tsx:12` — `DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }` (서울시청)
- `mockData.ts:97~256` — 모든 SAMPLE 좌표가 강남 일대 (37.49xx, 127.02xx)
- **백엔드 시드**: 가천대 글로벌캠 (37.4516, 127.1306) 53곳
- **조치**: Task #7 (`DEFAULT_CENTER` 가천대로). mockData는 어차피 API 연동되면 제거되니 우선순위 낮음.

### 4-2. 인증/JWT 레이어 없음
- 프론트에 토큰 저장·첨부 코드 0건
- **조치**: Task #5 (`lib/auth.ts` localStorage 단순화 — 발표 후 보안 강화)

### 4-3. 채원의 1bda9ee 백엔드 변경 미검증
- POSTS.type/score, RESTAURANTS.description, IMAGES.restaurant_id, NOTIFICATIONS.actor_id
- 영서 모델/스키마/라우터 13파일 수정됨 — 영서 기존 로직과 충돌 없는지 확인 필요
- **조치**: Task #2 (호환성 검증)

### 4-4. 이미지 업로드 UI
- 백엔드 `POST /upload/image` 존재 (PIL 검증)
- 프론트엔드: 식당 등록·글 작성 폼에 업로드 input 없음 (현재 mockData는 placeholder URL)
- **조치**: Task #15 (식당 등록 + 업로드 같이)

### 4-5. 시간 표시 포맷
- mockData: `createdAt: "3시간 전"` (포맷된 문자열)
- 백엔드: ISO 8601 (`2026-05-12T14:20:00`)
- **조치**: `lib/format.ts`에 `formatRelativeTime()` 유틸 추가

### 4-6. id 타입
- mockData: `id: "r1"`, `"p1"`, `"u1"` (문자열)
- 백엔드: `int` (1, 2, 3...)
- **조치**: types/api.ts에 `number` 타입으로 정의. URL 라우팅에서 `Number(id)` 캐스팅.

### 4-7. friend pinColor enum
- mockData: HEX (`#F472B6` 등)
- 백엔드: 5가지 이름 (`pink/blue/green/purple/coral`)
- **조치**: `lib/colors.ts`에 enum → HEX 매핑

### 4-8. 알림 type 매칭
- mockData: `friend_request | like | comment | group_invite` (4종)
- 백엔드: 동일 4종 + `comment` (Phase 2-F) — 일치 ✅
- 단 백엔드는 `actor_id` 필드로 발신자 (FK), 프론트는 `actor` 객체 — adapter 필요

---

## 5. 작업 순서 (#1~17 Todo 기준)

```
┌─────────────────────────────────────────┐
│ 3-A: 파악·셋업 (5/19)                    │
│  #1 매핑표 (← 지금 작성 중)              │
│  #2 채원 백엔드 호환성                   │
│  #3 dev 서버 기동                        │
│  #4 .env.local                           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3-B: API 인프라 (5/20)                  │
│  #5 lib/api.ts + lib/auth.ts            │
│  #6 types/api.ts                        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3-C: 데모 핵심 P0 (5/20~21)             │
│  #7 가천대 좌표 정합                    │
│  #8 홈/지도 연동                        │
│  #9 식당 상세 + AI                      │
│  #10 카카오 OAuth 종단                  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3-D: P1~P2 페이지 (5/21~24)             │
│  #11 커뮤니티 4개                       │
│  #12 친구·그룹 5개                      │
│  #13 마이페이지 + 알림                  │
│  #14 검색·해시태그                      │
│  #15 식당 등록 + 업로드                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3-E: 발표 준비 (5/25~26)                │
│  #16 골든패스 리허설                    │
│  #17 키 재발급·정리                     │
└─────────────────────────────────────────┘
```

---

## 6. 페이지별 mockData 제거 체크리스트

| 페이지 | mockData import 제거 시점 | 대응 Task |
|---|---|---|
| `(tabs)/page.tsx` | API 연동 후 | #7, #8 |
| `(tabs)/community/page.tsx` | API 연동 후 | #11 |
| `(tabs)/friends/page.tsx` | API 연동 후 | #12 |
| `(tabs)/my/page.tsx` | API 연동 후 | #13 |
| `(tabs)/search/page.tsx` | API 연동 후 | #14 |
| `community/[id]/page.tsx` | API 연동 후 | #11 |
| `friends/[id]/page.tsx` | API 연동 후 | #12 |
| `friends/groups/[id]/page.tsx` | API 연동 후 | #12 |
| `friends/groups/new/page.tsx` | 친구 목록 API 연동 후 | #12 |
| `friends/search/page.tsx` | API 연동 후 | #12 |
| `my/activity/page.tsx` | API 연동 후 | #13 |
| `my/notifications/page.tsx` | API 연동 후 | #13 |
| `restaurants/[id]/page.tsx` | API 연동 후 | #9 |

최종 산출물: `mockData.ts` 파일 자체는 **삭제**. types만 `types/api.ts`로 이주.

---

## 7. 추정·임시 표시 (영서 작업 스타일)

- 우선순위(P0~P3)는 **추정** — 영서 결정으로 조정 가능
- 작업 소요 시간 추정치 미포함 — Task별 in_progress로 들어갈 때 추정
- "mockData 18페이지" 카운트는 직접 grep 검증 ✅
- "78엔드포인트" 카운트는 영서 `docs/API.md` 신뢰
- 채원의 1bda9ee 변경이 영서 기존 로직과 충돌 없는지는 **미검증** — Task #2에서 확인

---

**End of plan** · 2026-05-19 작성 · Hi-Five 팀
