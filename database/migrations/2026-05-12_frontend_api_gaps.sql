-- 프론트엔드 API 갭 보완 마이그레이션
-- 적용 명령: sudo mysql < database/migrations/2026-05-12_frontend_api_gaps.sql
--             또는: mysql -u mapweb -p mapweb < database/migrations/2026-05-12_frontend_api_gaps.sql
--
-- 변경 내용:
--   1. POSTS: type (blog/simple), score (별점 1-5) 컬럼 추가
--   2. RESTAURANTS: description 컬럼 추가
--   3. IMAGES: restaurant_id FK 추가 (식당 갤러리 이미지)
--   4. NOTIFICATIONS: actor_id FK 추가 (알림 발신자)

USE mapweb;

-- ────────────────────────────────────────────────────────────────
-- 1. POSTS: type + score
-- ────────────────────────────────────────────────────────────────
ALTER TABLE POSTS
    ADD COLUMN type  ENUM('blog', 'simple') NOT NULL DEFAULT 'blog'
        COMMENT '글 유형: blog=맛집 블로그, simple=간단 리뷰'
        AFTER restaurant_id,
    ADD COLUMN score TINYINT NULL
        COMMENT '별점 1-5 (simple 타입에서만 사용)'
        AFTER type,
    ADD CONSTRAINT ck_post_score
        CHECK (score IS NULL OR (score BETWEEN 1 AND 5));

-- ────────────────────────────────────────────────────────────────
-- 2. RESTAURANTS: description
-- ────────────────────────────────────────────────────────────────
ALTER TABLE RESTAURANTS
    ADD COLUMN description TEXT NULL
        COMMENT '식당 설명'
        AFTER name;

-- ────────────────────────────────────────────────────────────────
-- 3. IMAGES: restaurant_id
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IMAGES
    ADD COLUMN restaurant_id INT NULL
        COMMENT '식당에 속하는 갤러리 이미지'
        AFTER review_id,
    ADD CONSTRAINT fk_images_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE;

-- ────────────────────────────────────────────────────────────────
-- 4. NOTIFICATIONS: actor_id
-- ────────────────────────────────────────────────────────────────
ALTER TABLE NOTIFICATIONS
    ADD COLUMN actor_id INT NULL
        COMMENT '알림 발신자 (좋아요 누른 사람, 친구 요청 보낸 사람 등)'
        AFTER related_id,
    ADD CONSTRAINT fk_notifications_actor
        FOREIGN KEY (actor_id) REFERENCES USERS(user_id) ON DELETE SET NULL;
