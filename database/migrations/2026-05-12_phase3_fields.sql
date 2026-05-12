-- =============================================================
-- Migration: 2026-05-12 Phase 3 — 화면 디자인 갭 채우기
--
-- 추가 컬럼:
--   USERS.bio, USERS.points
--   RESTAURANTS.opening_hours, RESTAURANTS.break_time, RESTAURANTS.thumbnail_url
--   MENUS.description
--
-- 적용:
--   sudo mysql < database/migrations/2026-05-12_phase3_fields.sql
--
-- ⚠️ MySQL 8.0은 `ADD COLUMN IF NOT EXISTS` 미지원.
--    이 파일은 단발성(이미 적용된 DB에는 재실행 시 에러).
-- =============================================================

USE mapweb;

ALTER TABLE USERS
    ADD COLUMN bio    VARCHAR(500) NULL      AFTER profile_image,
    ADD COLUMN points INT NOT NULL DEFAULT 0 AFTER bio;

ALTER TABLE RESTAURANTS
    ADD COLUMN opening_hours VARCHAR(100) NULL AFTER phone,
    ADD COLUMN break_time    VARCHAR(100) NULL AFTER opening_hours,
    ADD COLUMN thumbnail_url VARCHAR(255) NULL AFTER break_time;

ALTER TABLE MENUS
    ADD COLUMN description VARCHAR(255) NULL AFTER name;
