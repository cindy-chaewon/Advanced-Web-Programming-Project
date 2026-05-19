# 데모 전 최종 점검 체크리스트

> **작성일**: 2026-05-19
> **데모 D-day**: 2026-05-26 (D-7)

---

## 🔐 API 키 재발급 (채팅·.env에 노출된 키들)

데이터/접근 권한이 외부에 알려졌으므로 데모 전 모두 재발급 권장.

### 1. 카카오 디벨로퍼스 (https://developers.kakao.com)
- [ ] **REST API 키**: `015f076e5275b5e448e8cb6f1057574f` → 재발급
- [ ] **Client Secret**: `wX2jAIP4TBmnWkDOYA6JPf6YBteHMgmp` → 재발급 또는 비활성화
- [ ] **JavaScript 키**: `3708a6131c84906c529e250e5e6304e4` → 재발급
- [ ] redirect URI에 데모 도메인이 별도 있으면 추가 등록

### 2. Google AI Studio (https://aistudio.google.com/app/apikey)
- [ ] **Gemini API 키**: `AIzaSyBO2h451lJYXty02lZobO9BQ69d407SJPQ` → 재발급
- [ ] 새 키 사용량 제한·과금 확인

### 3. JWT_SECRET (`backend/.env`)
- [ ] 운영 배포 시 재생성 권장: `openssl rand -hex 64`
- [ ] 로컬 데모만이면 그대로 두어도 OK

재발급 후 두 파일 갱신:
- `backend/.env`
- `frontend/.env.local`

---

## 🗑 시드 흔적 데이터 정리

검증 + pytest 누적으로 생긴 흔적 28개+:

| 흔적 | 개수 | 정리 방법 |
|---|---|---|
| `pytest_*` RESTAURANTS | 6 | SQL 자동 |
| `pytest_*` / `test_*` TAGS | 3 | SQL 자동 |
| cert-login 검증용 USERS (user_id > 95) | 28 | SQL 자동 |
| Phase 3 검증용 댓글 (id=126) | 1 | SQL 자동 |

**정리 실행:**
```bash
sudo mysql < /home/young/Advanced-Web-Programming-Project/database/migrations/cleanup_test_data.sql
```

정리 후 확인 쿼리 결과로 잔여 0건 확인.

---

## 📦 시드 백업 (정리 후 데모 직전)

```bash
mysqldump -u root mapweb > database/backups/seed_demo_$(date +%Y%m%d).sql
```

데모 도중 데이터 망가지면 복구 가능하게.

---

## 🎬 데모 시연 골든패스

영서가 GUI에서 한 번 돌려봐야 할 시나리오 (P0 + P1):

1. **로그인**: `/login` → 카카오 버튼 → 카카오 로그인 → `/auth/callback` → 홈
2. **홈 지도**: 가천대 핀 36개, 카카오맵 정상 렌더 확인
3. **식당 상세**: 라곰(id=115) → 정보/메뉴/평가리뷰 탭 + AI 종합평
4. **글 목록**: `/community` 인기 탭, 시드 글 4개 표시
5. **글 상세**: id=101 → 좋아요 클릭 → 댓글 모달
6. **글 작성**: `/community/write/simple` → 식당 검색(라곰) → 별점 + 내용 → 발행
7. **내 페이지**: 통계 4/19/7/3, 내 글/스크랩 미리보기
8. **로그아웃**

---

## ⚠️ 알려진 잔여 갭 (데모 전 결정)

| 갭 | 영향 | 대응 |
|---|---|---|
| 댓글 DELETE endpoint 미구현 | 작성 후 삭제 불가, 데모 시연 안 함 | 데모 후 추가 |
| `is_open` 응답에 없음 | 영업중 배지 항상 true | UI 명세 그대로 둠 |
| 식당 등록 후 좌표가 가천대 fallback | 카카오 지오코더 SDK ?libraries=services 로드 필요 | KakaoMap 컴포넌트에 services 옵션 추가 또는 데모용 fallback 유지 |
| FriendItem `variant="search"` 분기 UI | 검색 결과 화면에서 "친구 추가" 버튼은 페이지에서 처리, 컴포넌트는 친구 화면과 동일 | 의도된 동작 |
| 시드 NOTIFICATIONS actor_id NULL | 알림 화면에서 "알 수 없음" | 신규 알림(데모 중 발생)부터는 정상 |
| pytest로 dev 서버에 시드 흔적 누적 | 데모 직전 SQL 정리로 해결 | 위 정리 SQL |

---

## ✅ 푸시 전 마지막 확인

```bash
# 1. 정리 SQL 실행
sudo mysql < database/migrations/cleanup_test_data.sql

# 2. 키 재발급 + .env 갱신

# 3. .env가 .gitignore에 포함됨 확인
git check-ignore backend/.env frontend/.env.local

# 4. 백엔드 pytest 마지막 통과 확인 (ROS 환경 격리)
cd backend && source .venv/bin/activate
env -u PYTHONPATH -u AMENT_PREFIX_PATH -u ROS_DISTRO -u LD_LIBRARY_PATH \
    PATH=".venv/bin:/usr/bin:/bin" \
    pytest -p no:launch_testing -p no:launch_pytest -q

# 5. 프론트 빌드 통과 확인
cd ../frontend && npm run build

# 6. git status + git diff main..HEAD 검토 후 푸시 결정
git status
git log main..HEAD --oneline
```
