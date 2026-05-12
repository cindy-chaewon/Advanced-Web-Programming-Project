# Hi-Five ERD — 데이터베이스 설계서

> **출처**: `database/schema.sql` (임유빈 2026-05-08 + 영서 백틱 fix 2026-05-12) — **단일 진실의 원천**
> **DB**: MySQL 8.0 `mapweb`
> **테이블 수**: 21개 (Phase 2-F에서 COMMENTS 추가)

⚠️ `GROUPS`는 MySQL 8.0 예약어 → schema.sql에서 backtick 처리 완료.
SQLAlchemy 모델 측에서는 자동 처리되므로 `__tablename__ = "GROUPS"` 그대로 OK.

### 🗂 ID 범위 약속
- **1~89, 200+**: 실제 사용자 데이터
- **90~99**: 시드 USER (시스템 가상 사용자, `ci='system:seed_*'`)
- **100~199**: 시드 식당·주소·메뉴·리뷰 (시스템 시드)

이 문서는 `database/schema.sql`을 사람이 읽기 쉽게 정리한 것입니다.
스키마 변경은 반드시 `schema.sql`을 먼저 수정한 뒤 이 문서를 업데이트하세요.

---

## 📚 테이블 목록 (카테고리별)

### 1. 인증 & 사용자
| 테이블 | 설명 |
|---|---|
| `USERS` | 사용자 마스터 (CI/DI 기반 본인확인) |

### 2. 친구 & 그룹
| 테이블 | 설명 |
|---|---|
| `FRIENDS` | 친구 관계 (status, color) |
| `GROUPS` | 그룹 마스터 |
| `GROUP_MEMBERS` | 그룹 멤버십 (owner/member) |

### 3. 위치 & 분류
| 테이블 | 설명 |
|---|---|
| `ADDRESSES` | 주소 + 위경도 |
| `CATEGORIES` | 음식 카테고리 (한식/양식/일식/...) |

### 4. 식당
| 테이블 | 설명 |
|---|---|
| `RESTAURANTS` | 식당 마스터 |
| `RESTAURANT_SCORES` | 식당 신뢰도 점수 (캐시 테이블) |
| `MENUS` | 식당 메뉴 |

### 5. 해시태그
| 테이블 | 설명 |
|---|---|
| `TAGS` | 해시태그 마스터 |
| `RESTAURANT_TAGS` | 식당 ↔ 태그 (junction) |
| `POST_TAGS` | 블로그 글 ↔ 태그 (junction) |

### 6. 콘텐츠
| 테이블 | 설명 |
|---|---|
| `POSTS` | 블로그형 글 (AI 요약, 썸네일) |
| `REVIEWS` | 리뷰 (simple/blog 두 타입) |
| `IMAGES` | 이미지 (post 또는 review에 속함) |
| `COMMENTS` | 글 댓글 (Phase 2-F) |

### 7. 인터랙션
| 테이블 | 설명 |
|---|---|
| `POST_LIKES` | 글 좋아요 |
| `REVIEW_LIKES` | 리뷰 좋아요 |
| `SCRAPS` | 맛집 즐겨찾기 (북마크) |

### 8. 알림
| 테이블 | 설명 |
|---|---|
| `NOTIFICATIONS` | 알림 인박스 |
| `NOTIFICATION_SETTINGS` | 알림 토글 설정 |

---

## 🧱 컬럼 상세

### USERS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| user_id | INT | PK, AUTO_INCREMENT | 사용자 ID |
| username | VARCHAR(50) | NOT NULL | 닉네임 |
| email | VARCHAR(100) | UNIQUE | 이메일 |
| ci | VARCHAR(88) | UNIQUE | 인증서 연계정보 (본인확인) |
| di | VARCHAR(64) | | 중복가입 방지 식별값 |
| verified_at | TIMESTAMP | NULL | 인증 완료 시각 |
| profile_image | VARCHAR(255) | | 프로필 이미지 URL |
| bio | VARCHAR(500) | NULL | 자기소개 (Phase 2-D) |
| points | INT | NOT NULL DEFAULT 0 | 활동 포인트 (level은 동적 계산) |
| created_at | TIMESTAMP | DEFAULT NOW() | 가입일 |

⚠️ `level`은 DB 컬럼 없음. ORM 프로퍼티로 `max(1, points // 250 + 1)` 계산.

---

### FRIENDS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| user_id | INT | PK, FK→USERS, ON DEL CASCADE | 요청자 |
| friend_id | INT | PK, FK→USERS, ON DEL CASCADE | 친구 |
| status | ENUM | NOT NULL, DEFAULT 'pending' | pending / accepted |
| color | VARCHAR(20) | DEFAULT 'pink' | 지도 핀 색상 |
| created_at | TIMESTAMP | DEFAULT NOW() | 요청일 |

**color 값**: pink / blue / green / purple / coral

---

### GROUPS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| group_id | INT | PK, AUTO_INCREMENT | 그룹 ID |
| name | VARCHAR(100) | NOT NULL | 그룹명 |
| owner_id | INT | NOT NULL, FK→USERS, ON DEL CASCADE | 방장 |
| color | VARCHAR(20) | DEFAULT 'blue' | 그룹 대표 색상 |
| icon | VARCHAR(10) | | 이모지 아이콘 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일 |

---

### GROUP_MEMBERS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| group_id | INT | PK, FK→GROUPS, ON DEL CASCADE | 그룹 |
| user_id | INT | PK, FK→USERS, ON DEL CASCADE | 멤버 |
| role | ENUM | NOT NULL, DEFAULT 'member' | owner / member |
| joined_at | TIMESTAMP | DEFAULT NOW() | 가입일 |

---

### ADDRESSES
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| address_id | INT | PK, AUTO_INCREMENT | 주소 ID |
| full_address | VARCHAR(200) | | 전체 주소 문자열 |
| district | VARCHAR(50) | | 구/군 |
| city | VARCHAR(50) | | 시 |
| latitude | DECIMAL(10,7) | NOT NULL | 위도 |
| longitude | DECIMAL(10,7) | NOT NULL | 경도 |

---

### CATEGORIES
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| category_id | INT | PK, AUTO_INCREMENT | 카테고리 ID |
| name | VARCHAR(50) | NOT NULL | 카테고리명 |

**값 (8종)**: 한식 / 양식 / 일식 / 중식 / 카페 / 술집 / 디저트 / 기타

---

### RESTAURANTS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| restaurant_id | INT | PK, AUTO_INCREMENT | 식당 ID |
| name | VARCHAR(100) | NOT NULL | 식당명 |
| phone | VARCHAR(20) | | 전화번호 |
| opening_hours | VARCHAR(100) | NULL | 영업시간 (예: 매일 11:00 - 22:00) (Phase 2-D) |
| break_time | VARCHAR(100) | NULL | 브레이크타임 (Phase 2-D) |
| thumbnail_url | VARCHAR(255) | NULL | 카드 리스트 대표 이미지 (Phase 2-D) |
| address_id | INT | FK→ADDRESSES | 주소 |
| category_id | INT | FK→CATEGORIES | 카테고리 |
| registered_by | INT | FK→USERS, ON DEL SET NULL | 최초 등록자 |
| created_at | TIMESTAMP | DEFAULT NOW() | 등록일 |

---

### RESTAURANT_SCORES
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| restaurant_id | INT | PK, FK→RESTAURANTS, ON DEL CASCADE | 식당 |
| avg_review_score | FLOAT | DEFAULT 0 | 리뷰 평균 별점 |
| review_count | INT | DEFAULT 0 | 리뷰 수 |
| scrap_count | INT | DEFAULT 0 | 스크랩 수 |
| total_score | FLOAT | DEFAULT 0 | 최종 복합 점수 |
| updated_at | TIMESTAMP | DEFAULT NOW(), ON UPDATE NOW() | 갱신일 |

**점수 공식**: 리뷰 평균 별점 가중치 + 리뷰 수 + 스크랩 수 (구체 가중치는 서비스 레이어에서 결정)

---

### MENUS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| menu_id | INT | PK, AUTO_INCREMENT | 메뉴 ID |
| restaurant_id | INT | NOT NULL, FK→RESTAURANTS, ON DEL CASCADE | 식당 |
| name | VARCHAR(100) | NOT NULL | 메뉴명 |
| description | VARCHAR(255) | NULL | 메뉴 한 줄 설명 (Phase 2-D) |
| price | INT | | 가격 (원) |
| is_signature | BOOLEAN | DEFAULT FALSE | BEST 메뉴 여부 |

---

### TAGS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| tag_id | INT | PK, AUTO_INCREMENT | 태그 ID |
| name | VARCHAR(50) | UNIQUE, NOT NULL | 태그명 (#제외) |

---

### RESTAURANT_TAGS / POST_TAGS
양쪽 다 구조 동일한 junction:
| 컬럼 | 타입 | 제약 |
|---|---|---|
| (restaurant_id 또는 post_id) | INT | PK, FK, ON DEL CASCADE |
| tag_id | INT | PK, FK→TAGS, ON DEL CASCADE |

⚠️ **주의**: REVIEW_TAGS 테이블은 schema.sql에 없습니다. 리뷰 해시태그가 필요하면 별도 논의 필요.

---

### POSTS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| post_id | INT | PK, AUTO_INCREMENT | 글 ID |
| user_id | INT | FK→USERS, ON DEL CASCADE | 작성자 |
| restaurant_id | INT | FK→RESTAURANTS, ON DEL CASCADE | 연결된 식당 |
| title | VARCHAR(200) | | 제목 |
| content | TEXT | | 본문 |
| ai_summary | TEXT | NULL | AI 3줄 요약 |
| thumbnail_url | VARCHAR(255) | NULL | 카드 리스트 대표 이미지 |
| created_at | TIMESTAMP | DEFAULT NOW() | 작성일 |
| updated_at | TIMESTAMP | NULL, ON UPDATE NOW() | 수정일 |

---

### REVIEWS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| review_id | INT | PK, AUTO_INCREMENT | 리뷰 ID |
| user_id | INT | FK→USERS, ON DEL CASCADE | 작성자 |
| restaurant_id | INT | FK→RESTAURANTS, ON DEL CASCADE | 대상 식당 |
| type | ENUM | DEFAULT 'simple' | simple / blog |
| content | TEXT | | 본문 |
| score | TINYINT | CHECK 1~5 | 별점 |
| created_at | TIMESTAMP | DEFAULT NOW() | 작성일 |
| updated_at | TIMESTAMP | NULL, ON UPDATE NOW() | 수정일 |

---

### IMAGES
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| image_id | INT | PK, AUTO_INCREMENT | 이미지 ID |
| url | VARCHAR(255) | NOT NULL | 이미지 URL |
| post_id | INT | NULL, FK→POSTS, ON DEL CASCADE | 글에 속함 |
| review_id | INT | NULL, FK→REVIEWS, ON DEL CASCADE | 또는 리뷰에 속함 |

**제약**: post_id 또는 review_id 둘 중 하나에만 속함 (애플리케이션 레벨에서 검증)

---

### POST_LIKES / REVIEW_LIKES
| 컬럼 | 타입 | 제약 |
|---|---|---|
| user_id | INT | PK, FK→USERS, ON DEL CASCADE |
| (post_id 또는 review_id) | INT | PK, FK, ON DEL CASCADE |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### SCRAPS
| 컬럼 | 타입 | 제약 |
|---|---|---|
| user_id | INT | PK, FK→USERS, ON DEL CASCADE |
| restaurant_id | INT | PK, FK→RESTAURANTS, ON DEL CASCADE |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### NOTIFICATIONS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| notification_id | INT | PK, AUTO_INCREMENT | 알림 ID |
| user_id | INT | NOT NULL, FK→USERS, ON DEL CASCADE | 수신자 |
| type | ENUM | NOT NULL | friend_request / like / group_invite / mention |
| related_id | INT | NULL | 관련 엔티티 ID (post_id, group_id 등) |
| is_read | BOOLEAN | DEFAULT FALSE | 읽음 여부 |
| created_at | TIMESTAMP | DEFAULT NOW() | 발생일 |

---

### NOTIFICATION_SETTINGS
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| user_id | INT | PK, FK→USERS, ON DEL CASCADE | 사용자 |
| friend_request | BOOLEAN | DEFAULT TRUE | 친구 요청 알림 |
| likes | BOOLEAN | DEFAULT TRUE | 좋아요·댓글 알림 |
| group_invite | BOOLEAN | DEFAULT TRUE | 그룹 초대 알림 |
| marketing | BOOLEAN | DEFAULT FALSE | 마케팅 알림 |

---

## 🔗 외래키 정책 요약

| 관계 | ON DELETE | 이유 |
|---|---|---|
| USERS → 콘텐츠 전반 (POSTS, REVIEWS, LIKES, SCRAPS, ...) | CASCADE | 탈퇴 시 정리 |
| RESTAURANTS.registered_by → USERS | **SET NULL** | 등록자 탈퇴해도 식당 보존 |
| RESTAURANTS → ADDRESSES, CATEGORIES | (DEFAULT RESTRICT) | 마스터 데이터 보호 |
| GROUPS.owner_id → USERS | CASCADE | 방장 탈퇴 시 그룹 해체 |
| FRIENDS, GROUP_MEMBERS 양방향 | CASCADE | junction 자동 정리 |
| POSTS/REVIEWS → USERS, RESTAURANTS | CASCADE | 같이 정리 |
| IMAGES → POSTS/REVIEWS | CASCADE | 콘텐츠 삭제 시 이미지 정리 |

---

## 🎨 핀 색상 매핑

| 핀 출처 | 색상 결정 | 비고 |
|---|---|---|
| 일반 식당 | 기본 (옐로우) | 카카오맵 기본 |
| 친구가 등록 | `FRIENDS.color` | 친구별 5색 |
| 그룹원이 등록 | `GROUPS.color` | 그룹별 색 |
| HOT 식당 | 별도 마킹 (디자인 참조) | "HOT" 라벨 |

---

## 🚫 폐기된 설계 (혼동 주의)

- ❌ `create_database.sql` (루트) — 11테이블 초안. 무시.
- ❌ Notion ERD v2 "18테이블 + 폴리모픽 LIKES" — schema.sql과 다름. 폐기.
- ❌ "HASHTAGS / FRIENDSHIPS / IMAGES JSON 컬럼" 명명 — 실제는 TAGS / FRIENDS / IMAGES 테이블.

---

## 📝 변경 이력

| 날짜 | 변경 | 작성자 |
|---|---|---|
| 2026-04-07 | `create_database.sql` 초안 (11테이블) | 임유빈 |
| 2026-05-08 | `database/schema.sql` 신버전 (20테이블) | 임유빈 |
| 2026-05-11 | 이 문서 작성 (schema.sql 정리) | 영서 |
| 2026-05-12 | `GROUPS` backtick fix, seed.sql에 카테고리 + 가천대 맛집 15곳 추가 | 영서 |
| 2026-05-12 | Phase 2-B 도메인 활용 패턴 정리 (친구 양방향, 그룹 통합지도, 알림 자동 hook). 스키마 자체 변경은 없음. | 영서 |
| 2026-05-12 | Phase 2-C — `POSTS.ai_summary` 컬럼 실사용 (Gemini로 생성·캐시). 스키마 변경 없음. | 영서 |
| 2026-05-12 | Phase 2-D — **컬럼 6개 추가**: USERS.bio/points, RESTAURANTS.opening_hours/break_time/thumbnail_url, MENUS.description. `database/migrations/2026-05-12_phase3_fields.sql` 신설. | 영서 |
| 2026-05-12 | Phase 2-E — 시드 식당 30→53곳, 카카오맵 좌표 보정 24곳. 마이그레이션 2개 추가 (`2026-05-12_calibrated_coords.sql`, `2026-05-13_kakao_seed_restaurants.sql`). 스키마 자체는 변경 없음. | 영서 |
| 2026-05-12 | Phase 2-F — **COMMENTS 테이블 신설** (post_id/user_id/content). NOTIFICATIONS.type ENUM에 `comment` 추가. 마이그레이션 `2026-05-13_comments.sql`. | 영서 |
| 2026-05-12 | Phase 2-M — **MySQL TRIGGER 5개 + procedure** (`2026-05-13_score_triggers.sql`). REVIEWS/SCRAPS 변경 시 RESTAURANT_SCORES 자동 재계산. Python recompute는 이중 안전망으로 유지. | 영서 |

---

## ✅ schema.sql 적용 방법

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p mapweb < database/seed.sql
```
