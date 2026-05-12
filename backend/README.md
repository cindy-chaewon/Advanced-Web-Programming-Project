# Hi-Five Backend

FastAPI 0.115 + SQLAlchemy 2.0 + MySQL 8.0 기반의 지도 맛집 커뮤니티 백엔드.
75개 REST 엔드포인트 (인증·식당·글·리뷰·친구·그룹·알림·해시태그·검색·AI 요약) 가 `/api/v1` 아래에 마운트되어 있습니다.
시드는 가천대 글로벌캠퍼스 기준 53개 실 식당 + 시드 USER 5명 + REVIEWS 62 / SCRAPS 33 / POSTS 10.

---

## 1. 빠른 시작

> 모든 명령은 레포 루트 `/home/young/Advanced-Web-Programming-Project` 기준입니다.
> Windows/zsh 사용자는 가상환경 활성화 명령만 환경에 맞게 바꿔주세요.

### 1.1 Python 가상환경 + 의존성

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 1.2 MySQL 설치 (Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y mysql-server
sudo systemctl enable --now mysql
mysql --version   # 8.0.x 확인
```

### 1.3 DB 사용자 생성 (mapweb / mapweb1234)

```bash
sudo mysql -e "CREATE USER IF NOT EXISTS 'mapweb'@'localhost' IDENTIFIED BY 'mapweb1234';
               GRANT ALL PRIVILEGES ON mapweb.* TO 'mapweb'@'localhost';
               FLUSH PRIVILEGES;"
```

### 1.4 Fresh setup 순서 (5단계)

처음 셋업하는 팀원은 **이 순서 그대로** 실행하세요. `cd`는 레포 루트 기준입니다.

```bash
# 1) 테이블 생성 (DROP DATABASE 포함)
sudo mysql < database/schema.sql

# 2) Phase 2-D 추가 컬럼 (영업시간·bio·points 등)
sudo mysql < database/migrations/2026-05-12_phase3_fields.sql

# 3) 기본 시드 (카테고리 + 식당 30곳 + 시드 USER + REVIEWS/SCRAPS/POSTS)
sudo mysql < database/seed.sql

# 4) 시드 좌표를 카카오맵으로 보정 (KAKAO_MAP_API_KEY 필요)
cd backend && .venv/bin/python scripts/calibrate_coords.py && cd ..

# 5) 카카오 카테고리 검색으로 실 식당 23곳 추가 → 총 53곳
sudo mysql < database/migrations/2026-05-13_kakao_seed_restaurants.sql
```

> 기존 DB가 이미 있는 팀원은 1번을 건너뛰고 2~5번만 순서대로 적용하면 됩니다.
> 모두 날리고 다시 하려면 `sudo mysql -e "DROP DATABASE mapweb;"` 후 1번부터 다시.

### 1.5 .env 설정

```bash
cd backend
cp .env.example .env
```

`.env`에서 최소한 다음 값을 채워야 합니다.

| 키 | 용도 | 발급처 |
|---|---|---|
| `DB_USER` | `mapweb` | (위에서 만든 계정) |
| `DB_PASSWORD` | `mapweb1234` | (위에서 만든 계정) |
| `JWT_SECRET` | 임의의 긴 랜덤 문자열 | `openssl rand -hex 32` |
| `KAKAO_CLIENT_ID` | 카카오 OAuth REST API 키 | https://developers.kakao.com |
| `KAKAO_CLIENT_SECRET` | (선택) 카카오 client secret | 같음 |
| `KAKAO_MAP_API_KEY` | 카카오맵 REST 키 (좌표 보정 스크립트가 사용) | 같음 |
| `GEMINI_API_KEY` | Gemini AI 요약용 | https://aistudio.google.com/app/apikey |

> 카카오/Gemini 키가 아직 없어도 서버는 켜집니다. 다만 카카오 로그인·좌표 보정·AI 요약은 그 기능 호출 시 503을 받습니다. **`cert-login`은 키 없이도 동작**하므로 키 준비 전에도 거의 모든 기능을 테스트할 수 있습니다 (FAQ 참조).

### 1.6 서버 실행

```bash
cd backend
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 1.7 테스트 (pytest)

단위 테스트 + 통합 테스트 (TestClient, 실제 MySQL 사용 — 시드 데이터 보존됨, `pytest_` prefix만 생성/정리).

```bash
cd backend
.venv/bin/pip install -r requirements.txt   # pytest, pytest-asyncio 포함
.venv/bin/pytest tests/ -v
```

> **ROS Humble이 설치된 환경에서**는 `/opt/ros/humble`의 `launch_testing` pytest11 entrypoint가 충돌합니다. 다음과 같이 환경 변수를 같이 주면 됩니다.
>
> ```bash
> PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 .venv/bin/pytest -p pytest_asyncio tests/ -v
> ```

---

## 2. 확인

서버가 켜지면 다음 URL이 200을 반환해야 합니다.

- Swagger UI: <http://localhost:8000/api/v1/docs>
- ReDoc: <http://localhost:8000/api/v1/redoc>
- 헬스체크: <http://localhost:8000/health>
- API 루트: <http://localhost:8000/>

가천대 글로벌캠퍼스 좌표 (`37.4516, 127.1306`) 기준 반경 2km 식당 검색:

```bash
curl "http://localhost:8000/api/v1/restaurants?lat=37.4516&lng=127.1306&radius=2000" | jq '.[0:3]'
```

53개 시드 식당 중 가까운 순으로 응답이 오면 정상.

---

## 3. 로그인 (개발용)

카카오 OAuth 키가 없거나 종단 연동 전이라면 **인증서 로그인(cert-login)** 으로 JWT를 받아 모든 API를 호출할 수 있습니다.

```bash
curl -X POST http://localhost:8000/api/v1/auth/cert-login \
  -H "Content-Type: application/json" \
  -d '{"ci":"TEST_CI_youngseo_001","username":"영서"}'
```

응답의 `access_token`을 다음 호출에 그대로 사용하세요.

```bash
TOKEN="여기에_access_token_붙여넣기"
curl http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
```

> `ci` 값은 USERS 테이블의 유니크 키입니다. 임의 문자열을 주면 자동으로 회원가입됩니다. 같은 `ci`로 다시 호출하면 로그인 처리.

---

## 4. 자주 쓰는 호출

다음 예시는 모두 위에서 받은 `$TOKEN`이 있다는 전제입니다.

### 4.1 내 프로필

```bash
curl http://localhost:8000/api/v1/users/me -H "Authorization: Bearer $TOKEN"
```

### 4.2 식당 등록

```bash
curl -X POST http://localhost:8000/api/v1/restaurants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 분식",
    "category_id": 1,
    "address": {"road_address":"경기도 성남시 수정구 성남대로 1342","lat":37.4516,"lng":127.1306},
    "phone": "031-000-0000",
    "tags": ["떡볶이","분식"]
  }'
```

### 4.3 글 작성 (image_urls 는 `/upload/image` 응답 URL)

```bash
curl -X POST http://localhost:8000/api/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": 100,
    "title": "라곰 점심 후기",
    "content": "매콤한 라떼볶이 강추",
    "tags": ["라곰","점심"],
    "image_urls": []
  }'
```

### 4.4 좋아요 / 좋아요 취소

```bash
curl -X POST   http://localhost:8000/api/v1/posts/1/like -H "Authorization: Bearer $TOKEN"
curl -X DELETE http://localhost:8000/api/v1/posts/1/like -H "Authorization: Bearer $TOKEN"
```

### 4.5 이미지 업로드

```bash
curl -X POST http://localhost:8000/api/v1/upload/image \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg"
# → {"url": "/uploads/2026/05/<uuid>.jpg"}
```

### 4.6 한글 키워드로 식당 검색 (URL 인코딩 주의)

```bash
curl -G http://localhost:8000/api/v1/restaurants/search \
  --data-urlencode "q=라곰" \
  -H "Authorization: Bearer $TOKEN"
```

### 4.7 AI 종합 평가 (Gemini, GEMINI_API_KEY 필요)

```bash
curl http://localhost:8000/api/v1/restaurants/100/ai-review -H "Authorization: Bearer $TOKEN"
```

---

## 5. 트러블슈팅

### `ERROR 1064 (42000) ... near 'GROUPS'`
`GROUPS`는 MySQL 8 예약어입니다. `database/schema.sql` 본체에는 backtick(`` `GROUPS` ``)이 이미 적용되어 있으니 그대로 import 하세요. 직접 짠 쿼리에서도 backtick을 빼먹지 마세요.

### `Unknown error ... ADD COLUMN IF NOT EXISTS`
MySQL 8.0은 `ADD COLUMN IF NOT EXISTS`를 지원하지 않습니다. `database/migrations/*.sql`은 **한 번만** 실행하도록 단발성으로 작성되어 있습니다. 두 번 돌리면 "Duplicate column name" 에러가 정상입니다. 무시하거나 DROP DATABASE 후 fresh setup 순서대로 다시 돌리세요.

### curl로 한글 쿼리가 404/빈배열
쉘이 한글을 raw 바이트로 박아 넣어 카카오/MySQL 쪽에서 깨집니다. `--data-urlencode` 또는 `-G`와 함께 명시적 인코딩을 사용하세요 (4.6 참조).

### 시드 식당 점수가 갑자기 떨어짐
`RESTAURANT_SCORES`는 `seed.sql`이 공식대로 계산해 미리 넣어둡니다. 그런데 글/리뷰/스크랩이 한 번이라도 mutate 되면 `score_service.recompute_restaurant_score`가 그 식당 점수를 다시 계산해 덮어씁니다. 시드의 더미 94점이 70점대로 떨어졌다면 정상 동작입니다. 데모 직전에는 mutation을 피하세요.

### 카카오 호출이 전부 403
카카오 디벨로퍼스 → 내 애플리케이션 → "앱 설정 → 플랫폼"에 도메인이 등록되어 있어야 하고, **"OPEN_MAP_AND_LOCAL"(로컬 API)** 동의항목 / 활성화가 켜져 있어야 합니다. 비활성화 상태로 `/v2/local/search/*`를 호출하면 403. 카카오 OAuth Redirect URI도 `.env`의 `KAKAO_REDIRECT_URI`와 100% 일치해야 합니다.

### `ModuleNotFoundError: google.generativeai`
`pip install -r requirements.txt`를 가상환경 활성화 상태에서 다시 실행. SDK 버전은 `google-generativeai==0.8.3` 고정입니다. 구버전 `gemini-1.5-flash`는 v1beta에서 비호환이라 코드는 `gemini-2.5-flash`를 사용합니다.

### `Access denied for user 'mapweb'@'localhost'`
1.3 단계의 GRANT를 빼먹었거나, `.env`의 `DB_PASSWORD`가 다릅니다. `sudo mysql`로 접속 후 `SELECT user FROM mysql.user;`로 사용자 확인.

---

## 6. FAQ

**Q. 아직 카카오 키 못 받았는데 작업할 수 있나요?**
네. `auth/cert-login`으로 JWT를 발급받아 75개 엔드포인트 중 카카오 OAuth(2개)와 좌표 보정 스크립트를 제외한 거의 모든 기능을 검증할 수 있습니다. AI 요약도 `GEMINI_API_KEY`만 있으면 동작합니다.

**Q. 프론트엔드는 어디서 시작하나요?**
`frontend/` 폴더는 현재 `.gitkeep`만 있는 빈 폴더입니다. **Phase 3**에서 Next.js + Bootstrap 으로 시작합니다. 카카오맵 SDK 키는 프론트에서 필요합니다 (`KAKAO_MAP_API_KEY`는 백엔드 좌표 보정용, 프론트는 JavaScript SDK 키 따로 발급).

**Q. AI 키 한도가 어떻게 되나요?**
Gemini 무료 티어 기준 **분당 15회 / 일당 1500회** 입니다. 식당 종합평은 캐시하지 않으므로 프론트에서 throttle/디바운스 권장. 글 요약은 `POSTS.ai_summary`에 캐시되며 `?force=true`로 강제 재생성.

**Q. 데이터 다 날리고 처음부터 다시 하고 싶어요.**
```bash
sudo mysql -e "DROP DATABASE IF EXISTS mapweb;"
# 그리고 1.4의 5단계를 1) → 5) 순서대로 다시 실행
```

**Q. cert-login이 진짜 본인인증인가요?**
아니요, 학교 프로젝트라 모킹입니다. CI 문자열을 그대로 받아 USERS row를 만듭니다. 실제 본인인증 연동은 범위 밖.

**Q. 업로드한 이미지는 어디에 저장되나요?**
`backend/uploads/{YYYY}/{MM}/<uuid>.<ext>`. 정적 마운트가 `/uploads/...`로 서빙합니다. 운영 배포 시 S3 등으로 이전 예정.

---

## 7. 폴더 구조

```
backend/
├── app/
│   ├── main.py              FastAPI 앱 + /uploads 정적 마운트
│   ├── core/                config, database, security(JWT), deps
│   ├── models/              20개 SQLAlchemy 모델 (schema.sql 매핑)
│   ├── schemas/             Pydantic 요청/응답 스키마
│   ├── services/            비즈니스 로직 (점수·해버사인·이미지·Gemini 등)
│   └── routers/             15개 라우터 / 75개 엔드포인트
│       ├── auth.py          5  (kakao, cert-login, me 등)
│       ├── users.py         13 (마이페이지·검색·프로필)
│       ├── categories.py    1
│       ├── restaurants.py   13 (식당·메뉴·스크랩·ai-review)
│       ├── menus.py         2
│       ├── posts.py         8  (CRUD·좋아요·AI 요약)
│       ├── reviews.py       4
│       ├── uploads.py       1
│       ├── friends.py       7  (요청·수락·삭제·색상)
│       ├── groups.py        10 (CRUD·멤버·통합지도·그룹원 글)
│       ├── notifications.py 3
│       ├── hashtags.py      4
│       ├── search.py        2
│       └── health.py        1
├── scripts/
│   ├── calibrate_coords.py        시드 식당 좌표를 카카오맵 키워드 검색으로 정확화
│   └── fetch_kakao_restaurants.py 가천대 1.5km 내 실 가게를 카테고리 검색으로 추가
├── uploads/                 이미지 업로드 폴더 (자동 생성, .gitignore)
├── .env                     로컬 비밀 (커밋 금지)
├── .env.example
├── requirements.txt
└── README.md                ← 이 파일
```

---

## 8. 참고

| 자료 | 위치 |
|---|---|
| ERD (20테이블) | [`../docs/ERD.md`](../docs/ERD.md) |
| REST API 명세 (75 엔드포인트) | [`../docs/API.md`](../docs/API.md) |
| 마이그레이션 정책 | [`../database/migrations/README.md`](../database/migrations/README.md) |
| 카카오 디벨로퍼스 | <https://developers.kakao.com> |
| Gemini API 키 발급 | <https://aistudio.google.com/app/apikey> |
