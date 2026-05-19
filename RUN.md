# 빠른 구동 카드 - *리눅스 환경에서 진행한거라, 약간 다를 수 있습니다!*

> 자세한 설명은 `docs/PHASE3_HANDOFF.md` 참고

## 1. 백엔드 (터미널 1)

```bash
cd backend && source .venv/bin/activate
env -u PYTHONPATH -u AMENT_PREFIX_PATH -u ROS_DISTRO -u LD_LIBRARY_PATH \
    PATH=".venv/bin:/usr/bin:/bin" \
    uvicorn app.main:app --host 127.0.0.1 --port 8000
```

확인: http://localhost:8000/health → `{"status":"ok"}`

## 2. 프론트엔드 (터미널 2)

```bash
cd frontend && npm run dev
```

확인: http://localhost:3000/

## 3. 종료

```bash
pkill -f "uvicorn app.main:app"
pkill -f "next dev"
```

## 4. pytest 회귀 검증

```bash
cd backend && source .venv/bin/activate
env -u PYTHONPATH -u AMENT_PREFIX_PATH -u ROS_DISTRO -u LD_LIBRARY_PATH \
    PATH=".venv/bin:/usr/bin:/bin" \
    pytest -p no:launch_testing -p no:launch_pytest -q
# 기대: 58 passed
```

## 5. 카카오 콘솔 필수 등록

| 메뉴 | 설정 |
|---|---|
| 제품 설정 → 카카오 로그인 | **활성화 ON** |
| 보안 → Client Secret | (활성화 시) 코드 → `backend/.env` `KAKAO_CLIENT_SECRET` |
| 카카오 로그인 → Redirect URI | `http://localhost:8000/api/v1/auth/kakao/callback` |
| 플랫폼 → Web 사이트 도메인 | `http://localhost:3000` |
| 제품 설정 → 카카오맵 | 활성화 ON |
