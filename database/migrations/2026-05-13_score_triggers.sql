-- =============================================================
-- Migration: 2026-05-13 RESTAURANT_SCORES 자동 재계산 트리거
--
-- 목적:
--   REVIEWS / SCRAPS 변경 시 RESTAURANT_SCORES를 DB 레벨에서 자동 갱신.
--   기존 Python (app/services/score_service.recompute_restaurant_score)
--   호출은 이중 안전망으로 유지 (멱등이라 안전).
--
-- 추가:
--   1) PROCEDURE recompute_restaurant_score(rid INT)
--      - REVIEWS·SCRAPS 집계 → RESTAURANT_SCORES INSERT ... ON DUPLICATE KEY UPDATE
--      - compute_total_score 공식:
--          total = avg * 14 + min(reviews, 50) * 0.4 + min(scraps, 100) * 0.1
--          cap 100, 소수점 1자리 반올림
--   2) TRIGGER 5개:
--      - trg_reviews_ai  (REVIEWS AFTER INSERT)
--      - trg_reviews_au  (REVIEWS AFTER UPDATE)
--      - trg_reviews_ad  (REVIEWS AFTER DELETE)
--      - trg_scraps_ai   (SCRAPS  AFTER INSERT)
--      - trg_scraps_ad   (SCRAPS  AFTER DELETE)
--      (SCRAPS의 UPDATE는 PK 변경이라 거의 없음 — 생략)
--
-- 적용:
--   sudo mysql < database/migrations/2026-05-13_score_triggers.sql
-- =============================================================

USE mapweb;

-- ---------- 기존 객체 정리 (재실행 가능하도록) ----------
DROP TRIGGER IF EXISTS trg_reviews_ai;
DROP TRIGGER IF EXISTS trg_reviews_au;
DROP TRIGGER IF EXISTS trg_reviews_ad;
DROP TRIGGER IF EXISTS trg_scraps_ai;
DROP TRIGGER IF EXISTS trg_scraps_ad;
DROP PROCEDURE IF EXISTS recompute_restaurant_score;

-- ---------- 저장 프로시저 ----------
DELIMITER //

CREATE PROCEDURE recompute_restaurant_score(IN rid INT)
proc_label: BEGIN
    DECLARE v_avg   FLOAT DEFAULT 0;
    DECLARE v_review INT  DEFAULT 0;
    DECLARE v_scrap  INT  DEFAULT 0;
    DECLARE v_total FLOAT DEFAULT 0;

    IF rid IS NULL THEN
        -- 식당이 없는 변경 (예: cascade delete 후) 은 무시
        LEAVE proc_label;
    END IF;

    SELECT COALESCE(AVG(score), 0), COUNT(*)
      INTO v_avg, v_review
      FROM REVIEWS
     WHERE restaurant_id = rid
       AND score IS NOT NULL;

    SELECT COUNT(*) INTO v_scrap
      FROM SCRAPS
     WHERE restaurant_id = rid;

    SET v_total = LEAST(100, ROUND(
        v_avg * 14
        + LEAST(v_review, 50) * 0.4
        + LEAST(v_scrap, 100) * 0.1,
        1
    ));

    INSERT INTO RESTAURANT_SCORES
        (restaurant_id, avg_review_score, review_count, scrap_count, total_score)
    VALUES
        (rid, ROUND(v_avg, 2), v_review, v_scrap, v_total)
    ON DUPLICATE KEY UPDATE
        avg_review_score = ROUND(v_avg, 2),
        review_count     = v_review,
        scrap_count      = v_scrap,
        total_score      = v_total;
END proc_label//

-- ---------- REVIEWS 트리거 ----------
CREATE TRIGGER trg_reviews_ai
AFTER INSERT ON REVIEWS
FOR EACH ROW
BEGIN
    CALL recompute_restaurant_score(NEW.restaurant_id);
END//

CREATE TRIGGER trg_reviews_au
AFTER UPDATE ON REVIEWS
FOR EACH ROW
BEGIN
    -- restaurant_id가 바뀌는 경우는 거의 없지만, 양쪽 모두 재계산
    CALL recompute_restaurant_score(NEW.restaurant_id);
    IF NOT (OLD.restaurant_id <=> NEW.restaurant_id) THEN
        CALL recompute_restaurant_score(OLD.restaurant_id);
    END IF;
END//

CREATE TRIGGER trg_reviews_ad
AFTER DELETE ON REVIEWS
FOR EACH ROW
BEGIN
    CALL recompute_restaurant_score(OLD.restaurant_id);
END//

-- ---------- SCRAPS 트리거 ----------
CREATE TRIGGER trg_scraps_ai
AFTER INSERT ON SCRAPS
FOR EACH ROW
BEGIN
    CALL recompute_restaurant_score(NEW.restaurant_id);
END//

CREATE TRIGGER trg_scraps_ad
AFTER DELETE ON SCRAPS
FOR EACH ROW
BEGIN
    CALL recompute_restaurant_score(OLD.restaurant_id);
END//

DELIMITER ;
