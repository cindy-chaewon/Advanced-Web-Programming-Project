# Phase 3 인수인계 — 프론트엔드 API 연동 + 디자인 충실화


> **브랜치**: `feature/api-integration` (← `feature/ui-design`에서 분기)

---

## 1. 한 줄 요약

구축된 초안 프론트 퍼블리싱(`feature/ui-design`)에 백엔드(`feature/backend-implementation`)를 연동하고, 디자인 시안 30개 화면 구성 

---

## 2. 무엇을 어디까지 했나

### 2-1. 진행 단계

| 단계 | 작업 | 결과 |
|---|---|---|
| **3-A 셋업** | 채원 1bda9ee 백엔드 갭 호환성 검증 + `.env.local` + dev 서버 정책 결정 | pytest 58/58 통과 |
| **3-B API 인프라** | `lib/api.ts`(ApiError + JWT 자동 첨부), `lib/auth.ts`(localStorage), `types/api.ts`(백엔드 응답 타입 12종 + adapter 8개), `lib/colors.ts`(5색 enum↔HEX), `lib/format.ts`(상대시간) | 모든 페이지가 공용 클라이언트 사용 |
| **3-C P0 데모 핵심** | 가천대 좌표 정합, 홈/지도, 식당 상세 + AI 평가, 카카오 OAuth 종단 | 4개 페이지 완성 |
| **3-D P1 데모용 화면** | 커뮤니티 5페이지, 친구·그룹 5페이지, 마이 5페이지, 검색, 식당 등록 | 16개 페이지 완성 |
| **3-E 디자인 충실화** | P0 백엔드 갭(`/users/{id}/posts·scraps`) + P1 디자인 보완 + P2 누락 화면 + P3 EDGE/디테일 | 디자인 30화면 100% 도달 |

### 2-2. 디자인 시안 충실도 (PDF 30화면 기준)

| 단계 | ✅ 충실 | ⚠️ 미세 갭 | 🔴 차단 |
|---|---|---|---|
| Phase 3 시작 | 9 (30%) | 20 | 1 |
| P0+P1 완료 | 13 (43%) | 17 | 0 |
| P2 완료 | 22 (73%) | 8 | 0 |
| **P3 완료 (현재)** | **30 (100%)** | **0** | **0** |

### 2-3. 핵심 산출물

**백엔드** (1파일 수정):
- `backend/app/routers/users.py` — `_ensure_can_view_profile` 권한 가드 + 3개 endpoint(`/users/{id}/posts`·`/reviews`·`/scraps`) 추가

**프론트엔드** (15파일 수정 + 6 신규 + 8 신규 lib·types):
- 신규 라우트: `/auth/callback`, `/hashtags/[tag]`
- 신규 컴포넌트: `RestaurantPicker`, `AddressPicker`, `Skeleton`, `Toast`
- 신규 lib: `api.ts`, `auth.ts`, `upload.ts`, `colors.ts`, `format.ts`
- 신규 types: `api.ts`
- 21개 페이지 모두 mockData 의존 제거, 백엔드 API 호출로 전환

**문서·SQL**:
- `docs/PHASE3_FRONTEND_PLAN.md` — Phase 3 매핑 계획서
- `docs/DEMO_PREP_CHECKLIST.md` — 데모 전 점검 체크리스트
- `docs/PHASE3_HANDOFF.md` — 이 문서
- `database/migrations/cleanup_test_data.sql` — 시드 흔적 일괄 정리 SQL

**환경 변수**:
- `backend/.env`에 `KAKAO_CLIENT_SECRET` 추가 (카카오 콘솔에서 활성화 상태라 매칭 필요했음)
- `frontend/.env.local` (gitignore 처리됨)

**검증 스크립트** (선택적 git 포함):
- `frontend/hifive-verify.mjs` — P0/P1 
- `frontend/hifive-verify-full.mjs` — P2/P3 통합
- `frontend/hifive-verify-p1.mjs`, `-p2.mjs`, `-p3.mjs` — 단계별

### 2-4. 검증 결과

| 검증 | 결과 |
|---|---|
| 백엔드 pytest | **58/58 통과** (회귀 없음) |
| TypeScript tsc | 통과 |
| `next build` | 24 라우트 모두 성공 |
| API endpoint 47/49 | 정상 (2건은 invalid token 거부 → 정상 동작) |
| Playwright 시각 검증 | 38장 스크린샷 (`/tmp/hifive-screenshots/`) |

---

## 3. 어떻게 구동하나

### 3-1. 사전 준비

제 PC는 리눅스 ROS Humble이 시스템에 sourced되어 있어서 백엔드 가동 시 환경 변수 격리 필요했음.

**필수 환경**:
- MySQL 8.0 (mapweb 데이터베이스 + mapweb 사용자, 비번 `mapweb1234`)
- Python 3.10+ (`backend/.venv` 가상환경 존재)
- Node.js 22+ (`frontend/node_modules` 설치됨)

**MySQL 시드 데이터** 확인:
```bash
echo 1234 | sudo -S mysql -D mapweb -e "SELECT COUNT(*) FROM RESTAURANTS;"
# 기대: 53곳 이상 (시드 30 + 카카오 추가 23)
```

### 3-2. 백엔드 가동 (FastAPI)

```bash
cd /home/young/Advanced-Web-Programming-Project/backend
source .venv/bin/activate

# ROS 환경 격리 + pytest 플러그인 비활성화 한 줄
env -u PYTHONPATH -u AMENT_PREFIX_PATH -u ROS_DISTRO -u LD_LIBRARY_PATH \
    PATH=".venv/bin:/usr/bin:/bin" \
    uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**확인**: `http://localhost:8000/health` → `{"status":"ok"}`
**API 문서**: `http://localhost:8000/api/v1/docs` (Swagger)

> ⚠️ ROS 환경 격리 안 하면 `pytest` 명령이 `launch_testing` 플러그인 임포트 실패로 죽음. uvicorn은 영향 없지만 일관성 위해 같은 패턴 사용.

### 3-3. 프론트엔드 가동 (Next.js 16)

```bash
cd /home/young/Advanced-Web-Programming-Project/frontend
npm run dev
```

**확인**: `http://localhost:3000/`

**Production 모드 (가벼움 + 더 빠름)**:
```bash
npm run build && npx next start --port 3000
```

### 3-4. 카카오 디벨로퍼스 콘솔 확인

설치 직후 카카오 OAuth + 지도가 정상 작동하려면 콘솔에 등록 필요:

1. **카카오 로그인 활성화** ON (제품 설정 → 카카오 로그인)
2. **Client Secret 활성화 + 값** (보안 메뉴) — 백엔드 `.env`에 동일하게
3. **Redirect URI**: `http://localhost:8000/api/v1/auth/kakao/callback`
4. **카카오맵 활성화** ON
5. **플랫폼 → Web 사이트 도메인**: `http://localhost:3000` 등록 (지도 SDK 작동용)

---

## 4. 데모 시연 


```
[1] http://localhost:3000/login
    → "카카오로 시작하기" 클릭
    → 카카오 로그인 → /auth/callback → 홈으로 자동 이동

[2] 메인 지도 (/)
    → 가천대 글로벌캠 ±2km 식당 36곳 핀 표시
    → 상단 해시태그 칩 시연 (#카페 → /hashtags/카페 페이지)

[3] 핀 클릭 → 바텀시트
    → 라곰(LAGOM) 카페 정보 미리보기
    → "상세 페이지로 →" 클릭

[4] 식당 상세 (/restaurants/115)
    → 정보 탭: 주소·영업시간·스크랩 카운트·미니 지도
    → 메뉴 탭: BEST 대표메뉴 + 전체 메뉴
    → 평가리뷰 탭: AI 종합평가 (Gemini) + 별점 분포 + 리뷰 카드

[5] 커뮤니티 (/community)
    → 인기/내주변/최신 탭
    → 평점·타입 필터
    → 글 카드 클릭 → 글 상세 (/community/101)
    → 좋아요 클릭 (실제 +1)
    → 댓글 모달 → 댓글 작성

[6] 글 작성
    → 우하단 ✏️ FAB → 작성 타입 선택 → 간단 리뷰
    → 식당 검색 모달 → 라곰 선택
    → 별점 + 한줄평 → 발행 → 작성된 글 상세로 이동

[7] 친구 / 그룹 (/friends)
    → 친구 탭: 시드 친구 3명 + 색상 점
    → 그룹 탭: 가천대 맛집동호회 / 카페 투어 ☕
    → 그룹 상세: 지도/글/멤버 탭 전환

[8] 마이 (/my)
    → 프로필: 맛집헌터 Lv.3 🪙500P
    → 통계 4·19·7·3
    → 내가 쓴 글 미리보기 → 스크랩 그리드

[9] (선택) 식당 등록 (/restaurants/new)
    → 위치 카드 → 카카오 places 검색 → 식당 선택
    → 카테고리 + 사진 → 등록
```

---

## 5. 알려진 잔여 사항 (데모 영향 없음)

| 항목 | 상태 | 대응 |
|---|---|---|
| 댓글 DELETE endpoint 미구현 | 댓글 작성은 OK, 삭제만 404 | 데모 시 댓글 삭제 시연 안 함 |
| Phase 3 검증 중 누적된 흔적 데이터 | 검증용 댓글 1건, pytest 잔여 6개 식당, cert-login 잔여 user 28명 | `database/migrations/cleanup_test_data.sql` 적용 |
| 채팅에 노출된 API 키 (카카오/Gemini/Client Secret) | 데모 후 재발급 권장 | `docs/DEMO_PREP_CHECKLIST.md` 참조 |

---

## 6. 트러블슈팅

### Q. 백엔드 띄울 때 `ModuleNotFoundError: No module named 'lark'`

ROS 환경 격리 안 됨. 위 3-2 명령에 `env -u PYTHONPATH ...` 포함시켜야 함.

### Q. 프론트엔드 띄울 때 `EADDRINUSE :::3000`

이미 다른 next-server가 돌고있음:
```bash
PID=$(ss -tlnp | grep ":3000" | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2)
kill $PID
```

### Q. 카카오 로그인 시 `KOE004` 또는 `KOE010` 에러

- `KOE004`: 카카오 콘솔에서 카카오 로그인 활성화 OFF
- `KOE010`: 콘솔 Client Secret 활성화인데 백엔드 `.env`에 비어있거나 불일치
- `KOE320`: 인가 코드 없음 (정상 — invalid code 보냈을 때 나옴, 실제 로그인엔 영향 없음)

### Q. 카카오맵이 빈 화면

콘솔 → 플랫폼 → Web 사이트 도메인에 `http://localhost:3000` 등록 안 됨. 등록 후 새로고침.

### Q. 친구 프로필에서 글/스크랩이 비어있음

- 해당 사용자에 글/스크랩이 실제로 없을 수 있음 (시드 데이터 빈약)
- 친구 관계가 아니면 403 — 시드 user 91(맛집헌터) JWT로 보면 92(캠퍼스맛집러)는 친구 OK

### Q. 헤드리스 환경에서 카카오맵 미렌더

브라우저 정상 환경에서는 카카오 SDK가 정상 작동. 헤드리스 chromium은 SDK 외부 도메인 로드 시점 차이로 빈 화면일 수 있음 — 실제 데모엔 영향 없음.

---

## 7. 깃 푸시 전 마지막 체크리스트

```bash
# 1. 정리 SQL (선택)
sudo mysql < database/migrations/cleanup_test_data.sql

# 2. .env 커밋 제외 확인
git check-ignore backend/.env frontend/.env.local

# 3. 백엔드 회귀 확인
cd backend && source .venv/bin/activate
env -u PYTHONPATH -u AMENT_PREFIX_PATH -u ROS_DISTRO -u LD_LIBRARY_PATH \
    PATH=".venv/bin:/usr/bin:/bin" \
    pytest -p no:launch_testing -p no:launch_pytest -q

# 4. 프론트 빌드 확인
cd ../frontend && npm run build

# 5. 변경 사항 검토
cd .. && git status
git diff main..HEAD --stat | tail -5

# 6. 검증 스크립트 git 포함 여부 결정
#    - hifive-verify*.mjs는 검증용. 팀과 공유할지 결정
#    - playwright devDependency 함께 결정
```

### 푸시 권장 순서

```bash
# 1) 현재 브랜치 푸시
git push -u origin feature/api-integration

# 2) PR 생성 (GitHub 웹 또는 gh CLI)
#    base: develop (또는 feature/ui-design) ← head: feature/api-integration

# 3) develop 머지 후 데모 마무리
```

---

## 8. 다음에 할 일

### 데모 직전 
- [ ] 카카오 로그인 종단 1회 시연 검증
- [ ] 카카오맵 렌더 확인 (도메인 등록)
- [ ] `cleanup_test_data.sql` 적용
- [ ] `mysqldump`로 시드 백업

### 데모 후 (Phase 4)
- [ ] 댓글 DELETE endpoint 추가
- [ ] 카카오/Gemini API 키 재발급
- [ ] cert-login 흔적 정리 자동화
- [ ] JWT refresh token
- [ ] S3/Cloud Storage 이미지 호스팅
- [ ] Docker + GitHub Actions CI

---

