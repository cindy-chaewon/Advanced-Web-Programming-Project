# Hi-Five REST API 명세

> **출처**: 기획서 8장 + 화면 디자인 PDF
> **Base URL**: `/api/v1`
> **인증**: `Authorization: Bearer <JWT>` (카카오 OAuth 또는 인증서 로그인 후 발급)
> **응답 포맷**: JSON
> **구현 진척**: **78개 엔드포인트** (Phase 2-F~N 완료, 댓글·Rate limit·에러통일·TRIGGER·pytest 포함)

이 문서는 기획서에 명시된 REST API 표를 정리한 것입니다.

### 상태 마커
- ✅ 구현 완료 + E2E 검증
- 🚧 구현 중 / 부분 구현
- ❌ 미구현 (Phase 표시)

---

## 🔐 인증

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | POST | `/auth/kakao` | 카카오 OAuth — body `{code 또는 access_token}` → JWT 발급 |
| ✅ | GET | `/auth/kakao/callback?code=` | 백엔드 redirect_uri 패턴 |
| ✅ | POST | `/auth/cert-login` | 인증서 로그인 (CI/DI 기반) |
| ✅ | POST | `/auth/logout` | 로그아웃 (JWT는 stateless라 클라이언트가 폐기) |
| ✅ | GET | `/auth/me` | 현재 사용자 (JWT 검증용) |
| ✅ | DELETE | `/users/me` | 회원 탈퇴 (USERS CASCADE로 콘텐츠 정리, 식당은 SET NULL) |

---

## 🏠 식당 (Restaurants)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/restaurants?lat=&lng=&radius=&category_id=` | 지도 범위 내 (Haversine 거리 정렬), `distance_meters` 포함 |
| ✅ | GET | `/restaurants/search?q=&tag=&category_id=` | 이름/태그/카테고리 검색 |
| ✅ | GET | `/restaurants/:id` | 식당 상세 (점수·태그·메뉴·주소 nested) |
| ✅ | POST | `/restaurants` | 식당 등록 (auth, 주소·태그 자동 처리) |
| ✅ | PUT | `/restaurants/:id` | 식당 정보 수정 (등록자만) |
| ✅ | GET | `/restaurants/:id/score` | 식당 점수 (없으면 0으로 init) |
| ✅ | POST | `/restaurants/:id/scrap` | 스크랩 (멱등) |
| ✅ | DELETE | `/restaurants/:id/scrap` | 스크랩 취소 |
| ✅ | GET | `/restaurants/:id/ai-review` | 종합 AI 평 (Gemini 2.5-flash). 최근 리뷰 10 + 글 5 종합 |

### 🧮 점수 공식 (score_service)
```
total = avg_rating × 14 + min(reviews, 50) × 0.4 + min(scraps, 100) × 0.1
0 ~ 100점, 별점 70% / 활동량 30%
```
리뷰/스크랩 변경 시 자동 재계산.

---

## 📝 블로그 글 (Posts)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/posts?sort=latest\|popular\|nearby&lat=&lng=&radius=` | popular=좋아요순(tie=최신), nearby=Haversine 거리순 (lat/lng 필수) |
| ✅ | GET | `/posts/:id` | 글 상세 (author, restaurant, images, hashtags, is_liked) |
| ✅ | POST | `/posts` | 글 작성 (이미지·태그·자동 thumbnail) |
| ✅ | PUT | `/posts/:id` | 글 수정 (작성자만) |
| ✅ | DELETE | `/posts/:id` | 글 삭제 (작성자만) |
| ✅ | POST | `/posts/:id/summary?force=` | AI 3줄 요약 (Gemini 2.5-flash). `POSTS.ai_summary`에 캐시 |
| ✅ | POST | `/posts/:id/like` | 좋아요 (멱등) → `{is_liked, like_count}` |
| ✅ | DELETE | `/posts/:id/like` | 좋아요 취소 |

---

## ⭐ 리뷰 (Reviews)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/restaurants/:id/reviews?type=simple\|blog` | 식당 리뷰 목록 |
| ✅ | POST | `/restaurants/:id/reviews` | 리뷰 작성 (body: `type, content, score(1~5), image_urls`) |
| ✅ | PUT | `/reviews/:id` | 리뷰 수정 (작성자만) |
| ✅ | DELETE | `/reviews/:id` | 리뷰 삭제 (작성자만) |
| ✅ | POST | `/reviews/:id/like` | 리뷰 좋아요 |
| ✅ | DELETE | `/reviews/:id/like` | 리뷰 좋아요 취소 |

⚠️ 리뷰 CRUD 시 식당 `total_score` 자동 재계산.

---

## 🔖 스크랩 (Scraps)

식당 섹션 참고 (`/restaurants/:id/scrap`). 두 엔드포인트 모두 ✅ 구현 완료.

---

## 👥 친구 (Friends)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/friends` | 내 친구 목록 (color/status/상대방 정보 포함) |
| ✅ | GET | `/friends/requests` | 받은 친구 요청 (보낸 사람 정보) |
| ✅ | POST | `/friends/request` | 친구 요청 (자동으로 `friend_request` 알림 생성) |
| ✅ | POST | `/friends/accept` | 친구 수락 (status → accepted) |
| ✅ | POST | `/friends/reject` | 친구 요청 거절 (row 삭제) |
| ✅ | DELETE | `/friends/:friend_user_id` | 친구 삭제 (양방향 row 제거) |
| ✅ | PATCH | `/friends/:friend_user_id` | 핀 색상 변경 (pink/blue/green/purple/coral). 단일 컬럼이라 양쪽 친구가 색 공유 |

---

## 🧑‍🤝‍🧑 그룹 (Groups)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/groups` | 내 그룹 목록 (member_count 포함) |
| ✅ | POST | `/groups` | 그룹 생성 (color/icon + invite_user_ids로 즉시 초대 + 자동 알림) |
| ✅ | GET | `/groups/:id` | 그룹 상세 (멤버만) |
| ✅ | PUT | `/groups/:id` | 그룹 정보 수정 (방장만) |
| ✅ | DELETE | `/groups/:id` | 그룹 삭제 (방장만) |
| ✅ | GET | `/groups/:id/members` | 멤버 목록 (role 포함) |
| ✅ | POST | `/groups/:id/members` | 멤버 초대 (방장만, 자동 알림) |
| ✅ | DELETE | `/groups/:id/members/:userId` | 추방(방장) / 본인 탈퇴 — 방장 자기 탈퇴는 차단 |
| ✅ | GET | `/groups/:id/restaurants` | **그룹 통합 지도** — 멤버들 등록 식당 모음 |
| ✅ | GET | `/groups/:id/posts` | 그룹원들 글 모음 |

---

## 🏷 해시태그 (Hashtags)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/hashtags/popular?limit=` | 인기 해시태그 — `RESTAURANT_TAGS + POST_TAGS` 사용량 합산 |
| ✅ | GET | `/hashtags/search?q=` | 해시태그 자동완성 (이름 LIKE) |
| ✅ | GET | `/hashtags/:tag_name/posts` | 태그별 글 (인코딩 필요 — 한글) |
| ✅ | GET | `/hashtags/:tag_name/restaurants` | 태그별 식당 |

---

## 🔎 검색 (Search)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/search/suggestions` | 추천 검색어 (인기 태그 5 + 전체 카테고리 8) |
| ✅ | GET | `/search/autocomplete?q=` | 자동완성 (식당명 + 해시태그 묶음 응답) |

---

## 👤 마이페이지 & 프로필 (Users)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/users/me` | 내 정보 (user_id, username, email, profile_image, **bio, points, level**, created_at) |
| ✅ | PUT | `/users/me` | 프로필 수정 (username/profile_image/bio). 닉네임 중복 체크 |
| ✅ | DELETE | `/users/me` | 회원 탈퇴 (영구) |
| ✅ | GET | `/users/me/posts` | 내 작성 글 |
| ✅ | GET | `/users/me/reviews` | 내 작성 리뷰 |
| ✅ | GET | `/users/me/scraps` | 내 스크랩 식당 |
| ✅ | GET | `/users/me/stats` | 통계 (post/review/scrap/friend 카운트) |
| ✅ | GET | `/users/me/notifications` | 알림 4종 설정 조회 (없으면 자동 생성) |
| ✅ | PATCH | `/users/me/notifications` | 알림 토글 (friend_request/likes/group_invite/marketing) |
| ✅ | GET | `/users/search?nickname=` | 닉네임 LIKE 검색 (인증 시 `friend_status` 포함) |
| ✅ | GET | `/users/check-nickname?q=` | 닉네임 중복 확인 (본인 닉네임은 사용 가능) |
| ✅ | GET | `/users/:user_id` | 다른 사용자 프로필 + 통계 + `friend_status` |

### friend_status 5종
`self / accepted / pending_sent / pending_received / none`

---

## 📷 이미지 업로드

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | POST | `/upload/image` | multipart → `{url, filename, size_bytes}`. `uploads/{YYYY}/{MM}/<uuid>.<ext>` 저장 |

- 허용 형식: jpg/jpeg/png/webp/gif
- 최대 5MB (`.env MAX_UPLOAD_SIZE`)
- 반환된 URL을 글/리뷰의 `image_urls`에 포함

---

## 🍴 카테고리

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/categories` | 8개 (한식/양식/일식/중식/카페/술집/디저트/기타) |

---

## 🍜 메뉴 (Menus)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/restaurants/:id/menus` | 메뉴 목록 (is_signature 우선 정렬) |
| ✅ | POST | `/restaurants/:id/menus` | 메뉴 추가 (등록자만) |
| ✅ | PUT | `/menus/:id` | 메뉴 수정 (등록자만) |
| ✅ | DELETE | `/menus/:id` | 메뉴 삭제 (등록자만) |

---

## 💬 댓글 (Comments) — Phase 2-F

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/posts/:post_id/comments` | 글 댓글 목록 (생성순) |
| ✅ | POST | `/posts/:post_id/comments` | 댓글 작성 (자동 알림 → 글 작성자) |
| ✅ | PUT | `/comments/:comment_id` | 댓글 수정 (작성자만) |
| ✅ | DELETE | `/comments/:comment_id` | 댓글 삭제 (작성자만) |

**알림 hook**: 댓글 작성 시 `notification_service.create_notification(type="comment")` 자동 호출. NOTIFICATION_SETTINGS.likes 토글에 통합 (좋아요·댓글 같이 ON/OFF). 자기 자신 댓글에는 알림 X.

**POSTS 응답에 `comment_count` 포함** — PostBrief / PostRead 둘 다.

---

## 🤖 AI (Gemini)

식당/글 섹션의 AI 엔드포인트 묶어서 보기:

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | POST | `/posts/:id/summary?force=` | 글 본문 → 3줄 요약. `POSTS.ai_summary`에 캐시. `force=true`면 재생성 |
| ✅ | GET | `/restaurants/:id/ai-review` | 식당 최근 리뷰 10 + 글 5 → 종합평. 캐시 없음 |

### 응답 예
```json
// POST /posts/1/summary
{
  "post_id": 1,
  "summary": "라곰 카페 (가천대 본관 1층), 분위기 매우 좋음.\n아메리카노 가성비 최고, 인생샷 명소.\n빈백 좌석이 명당, 공부/휴식에 추천.",
  "cached": false
}
```

```json
// GET /restaurants/115/ai-review
{
  "restaurant_id": 115,
  "review": "가천대 내 라곰은 ...\n이런 분께 추천: ...",
  "review_count": 1,
  "post_count": 2
}
```

### 모델 & 제약
- **모델**: `gemini-2.5-flash` (2026-05 안정 최신)
- **무료 tier 제한**: 분당 15 요청, 일일 1,500 요청 (프론트에서 throttle 권장)
- **본문 비어있는 글** → 400
- **리뷰·글 모두 없는 식당** → 404
- **Gemini 호출 실패 / 안전 필터 / 빈 응답** → 502
- **`GEMINI_API_KEY` 미설정** → 503

---

## 🔔 알림 (Notifications)

| 상태 | Method | Endpoint | 설명 |
|---|---|---|---|
| ✅ | GET | `/notifications?unread_only=` | 알림 목록 (최신순). 현재 type: `friend_request`, `group_invite` |
| ✅ | PATCH | `/notifications/:notification_id/read` | 개별 읽음 |
| ✅ | POST | `/notifications/read-all` | 모두 읽음 |

### 자동 hook (mutation → 알림 자동 생성)
- 친구 요청 → 받는 사람에게 `friend_request` (related_id = 요청자 user_id)
- 그룹 초대 → 초대받은 사람에게 `group_invite` (related_id = group_id)
- **글/리뷰 좋아요 → 작성자**에게 `like` (related_id = post_id/review_id)
- 모든 hook은 수신자의 `NOTIFICATION_SETTINGS.<type>` 토글 OFF면 자동 차단
- ❌ 댓글 (댓글 기능 자체 미구현)

---

## 📐 응답 포맷 규칙 (제안)

### 성공
응답 body는 엔드포인트별 스키마 그대로 반환 (Pydantic). 목록은 배열, 단일은 객체.

### 에러 (✅ Phase 2-J 통일)
```json
{
  "error": {
    "code": "HTTP_404",
    "message": "식당을 찾을 수 없습니다."
  }
}
```

Validation 에러 (422)는 fields 배열 추가:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 본문이 유효하지 않습니다.",
    "fields": [
      {"loc": ["body","ci"], "msg": "String should have at least 4 characters", "type": "string_too_short"}
    ]
  }
}
```

코드 매핑: `HTTP_400`, `HTTP_401`, `HTTP_403`, `HTTP_404`, `HTTP_409`, `HTTP_422` (VALIDATION_ERROR), `HTTP_429` (Rate limit), `HTTP_500` (INTERNAL_ERROR, DEBUG=false에서만 wrap).

### Rate limit (✅ Phase 2-L)
- **기본**: 60 req/min per IP
- **AI** (`/posts/:id/summary`, `/restaurants/:id/ai-review`): 5 req/min per IP
- **인증** (`/auth/kakao`, `/auth/cert-login`): 10 req/min per IP
- 한도 초과 시 HTTP 429 + `{"error":"Rate limit exceeded: ..."}`

### HTTP 상태 코드
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict
- 500 Internal Server Error

---

## 🔐 인증 헤더

모든 인증 필요 API:
```
Authorization: Bearer <JWT>
```

JWT 페이로드 (안):
```json
{
  "sub": "user_id",
  "exp": 1730000000,
  "iat": 1729996400
}
```

---

## 📋 TODO

- [x] 카카오 OAuth + JWT 발급
- [x] 인증서 로그인 (CI/DI 기반)
- [x] 이미지 업로드 제약 (5MB, jpg/png/webp/gif)
- [x] 점수 자동 재계산 공식
- [x] 좋아요/스크랩 멱등 응답 (`{is_liked|is_scrapped, *_count}`)
- [x] 친구·그룹·알림·해시태그·검색 (Phase 2-B)
- [x] 친구 요청/그룹 초대 자동 알림 hook
- [x] 그룹 통합 지도 (멤버들 등록 식당 모음)
- [x] AI 요약 프롬프트 + 식당 종합평 (Phase 2-C, gemini-2.5-flash)
- [x] 좋아요 알림 hook (Phase 2-D, 댓글은 댓글 기능 미구현이라 보류)
- [x] popular/nearby 정렬 (Phase 2-D)
- [x] DELETE /users/me, PUT /users/me, PATCH /users/me/notifications, GET /users/:id (Phase 2-D)
- [x] PATCH /friends/:friend_user_id (색상 변경, Phase 2-D)
- [ ] 페이지네이션 정책 (현재 offset/limit 단순) — cursor 전환 검토
- [ ] Rate limit 정책
- [ ] 에러 코드 카탈로그 (현재는 detail 문자열만)
- [ ] 카카오 OAuth 키 발급 후 종단 테스트
- [ ] 시드 좌표 카카오맵 보정 스크립트 (Phase 3 일부)
