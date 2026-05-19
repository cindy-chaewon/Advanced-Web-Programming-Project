-- 데모 직전 시드 정리 (영서 직접 실행)
-- 적용: sudo mysql < database/migrations/cleanup_test_data.sql
--   또는: mysql -u mapweb -p mapweb < database/migrations/cleanup_test_data.sql
--
-- 목적:
--   1. cert-login pytest 잔여 USERS 정리
--   2. pytest 잔여 RESTAURANTS / TAGS 정리
--   3. Phase 3 API 연동 검증 시 생성된 댓글/글 정리
--
-- 정상 시드 ID 범위 (보호 대상):
--   USERS  : 91~95 (시드 user 5명)
--   POSTS  : 101~120 (시드 글 20개 한도)
--   COMMENTS: 101~125 (시드 댓글 25개 한도)
--   RESTAURANTS: 100~199 (시드 식당)
--   GROUPS : 901~999 (시드 그룹)

USE mapweb;

-- 외래키 안전 모드
SET FOREIGN_KEY_CHECKS = 1;

-- ────────────────────────────────────────────────────────────────
-- 1. pytest 잔여 식당 + 연결 데이터 (CASCADE)
-- ────────────────────────────────────────────────────────────────
DELETE FROM RESTAURANTS
  WHERE name LIKE 'pytest_%' OR name LIKE 'TEST_CI_%';

-- ────────────────────────────────────────────────────────────────
-- 2. pytest 잔여 태그
-- ────────────────────────────────────────────────────────────────
DELETE FROM TAGS
  WHERE name LIKE 'pytest_%' OR name LIKE 'test_%';

-- ────────────────────────────────────────────────────────────────
-- 3. Phase 3 검증 시 생성된 흔적 (시드 ID 범위 밖)
-- ────────────────────────────────────────────────────────────────
-- 검증용 댓글 (시드 범위 101~125 보호, 그 외는 삭제)
DELETE FROM COMMENTS WHERE comment_id > 125;

-- 검증용 글 (시드 범위 101~120 보호)
DELETE FROM POSTS WHERE post_id > 120;

-- ────────────────────────────────────────────────────────────────
-- 4. cert-login 잔여 USER (시드 91~95 보호, 그 외 cert ci 가진 신규 가입자만)
-- ────────────────────────────────────────────────────────────────
DELETE FROM USERS
  WHERE user_id > 95
    AND (ci LIKE 'TEST_CI_%' OR username LIKE 'pytest_%' OR ci IS NULL);

-- ────────────────────────────────────────────────────────────────
-- 5. 점수 재계산 (TRIGGER가 자동 처리하긴 하지만 명시적으로)
-- ────────────────────────────────────────────────────────────────
CALL recompute_all_restaurant_scores();

-- 확인 쿼리 (실행 후 결과 확인)
SELECT 'remaining pytest_* restaurants' AS check_, COUNT(*) AS n FROM RESTAURANTS WHERE name LIKE 'pytest_%'
UNION ALL SELECT 'remaining pytest_* tags', COUNT(*) FROM TAGS WHERE name LIKE 'pytest_%'
UNION ALL SELECT 'remaining test users', COUNT(*) FROM USERS WHERE ci LIKE 'TEST_CI_%'
UNION ALL SELECT 'seed users (91-95)', COUNT(*) FROM USERS WHERE user_id BETWEEN 91 AND 95
UNION ALL SELECT 'seed posts (101-120)', COUNT(*) FROM POSTS WHERE post_id BETWEEN 101 AND 120
UNION ALL SELECT 'seed comments (101-125)', COUNT(*) FROM COMMENTS WHERE comment_id BETWEEN 101 AND 125;
