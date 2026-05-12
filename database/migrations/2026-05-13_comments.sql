-- =============================================================
-- Migration: 2026-05-13 댓글 기능 (Phase 2-F)
--
-- 추가:
--   1) COMMENTS 테이블 (post_id, user_id, content)
--   2) NOTIFICATIONS.type ENUM에 'comment' 추가
--
-- 적용:
--   sudo mysql < database/migrations/2026-05-13_comments.sql
-- =============================================================

USE mapweb;

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS COMMENTS (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id    INT  NOT NULL,
    user_id    INT  NULL,                          -- 작성자 탈퇴 시 NULL
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES POSTS(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    INDEX idx_comments_post (post_id),
    INDEX idx_comments_user (user_id)
);

-- NOTIFICATIONS.type ENUM에 'comment' 추가
ALTER TABLE NOTIFICATIONS
    MODIFY COLUMN type ENUM(
        'friend_request',
        'like',
        'group_invite',
        'mention',
        'comment'
    ) NOT NULL;
