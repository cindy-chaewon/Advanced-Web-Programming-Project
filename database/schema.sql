CREATE DATABASE mapweb;
USE mapweb;

-- 1. 사용자
CREATE TABLE USERS (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) UNIQUE,
    ci            VARCHAR(88)  UNIQUE,          -- 인증서 연계정보 (본인확인)
    di            VARCHAR(64),                  -- 중복가입 방지 식별값
    verified_at   TIMESTAMP    NULL,
    profile_image VARCHAR(255),
    bio           VARCHAR(500) NULL,            -- 자기소개 (마이페이지)
    points        INT          NOT NULL DEFAULT 0, -- 활동 포인트 (level은 동적 계산)
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 2. 친구
CREATE TABLE FRIENDS (
    user_id    INT,
    friend_id  INT,
    status     ENUM('pending', 'accepted') NOT NULL DEFAULT 'pending',
    color      VARCHAR(20) DEFAULT 'pink',       -- 지도 핀 색상 (pink/blue/green/purple/coral)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id)   REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- 3. 그룹/ 그룹멤버
-- NOTE: `GROUPS`는 MySQL 8.0 예약어이므로 backtick 필수.
CREATE TABLE `GROUPS` (
    group_id   INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    owner_id   INT          NOT NULL,
    color      VARCHAR(20)  DEFAULT 'blue',      -- 그룹 대표 색상
    icon       VARCHAR(10),                      -- 이모지 아이콘
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

CREATE TABLE GROUP_MEMBERS (
    group_id   INT,
    user_id    INT,
    role       ENUM('owner', 'member') NOT NULL DEFAULT 'member',
    joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES `GROUPS`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES USERS(user_id)    ON DELETE CASCADE
);

-- 4. 주소
CREATE TABLE ADDRESSES (
    address_id   INT AUTO_INCREMENT PRIMARY KEY,
    full_address VARCHAR(200),
    district     VARCHAR(50),
    city         VARCHAR(50),
    latitude     DECIMAL(10, 7) NOT NULL,
    longitude    DECIMAL(10, 7) NOT NULL
);

-- 5. 카테고리
CREATE TABLE CATEGORIES (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL             -- 한식/양식/일식/중식/카페/술집/디저트/기타
);

-- 6. 식당
CREATE TABLE RESTAURANTS (
    restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    opening_hours VARCHAR(100) NULL,             -- 영업시간 텍스트 (예: 매일 11:00 - 22:00)
    break_time    VARCHAR(100) NULL,             -- 브레이크타임 (예: 15:00 - 17:00)
    thumbnail_url VARCHAR(255) NULL,             -- 카드 리스트 대표 이미지
    address_id    INT,
    category_id   INT,
    registered_by INT,                           -- 최초 등록 사용자
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id)    REFERENCES ADDRESSES(address_id),
    FOREIGN KEY (category_id)   REFERENCES CATEGORIES(category_id),
    FOREIGN KEY (registered_by) REFERENCES USERS(user_id) ON DELETE SET NULL
);

-- 7. 식당 점수
--    복합 점수 = avg_review_score 가중치 + review_count + scrap_count
-- ============================================================
CREATE TABLE RESTAURANT_SCORES (
    restaurant_id    INT PRIMARY KEY,
    avg_review_score FLOAT DEFAULT 0,
    review_count     INT   DEFAULT 0,
    scrap_count      INT   DEFAULT 0,
    total_score      FLOAT DEFAULT 0,            -- 최종 복합 점수
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);

-- 8. 메뉴
CREATE TABLE MENUS (
    menu_id       INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT          NOT NULL,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(255) NULL,             -- 메뉴 한 줄 설명
    price         INT,
    is_signature  BOOLEAN DEFAULT FALSE,         -- BEST 메뉴 인지
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);

-- 9. 해시태그 (TAGS / RESTAURANT_TAGS)
CREATE TABLE TAGS (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name   VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE RESTAURANT_TAGS (
    restaurant_id INT,
    tag_id        INT,
    PRIMARY KEY (restaurant_id, tag_id),
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)        REFERENCES TAGS(tag_id)               ON DELETE CASCADE
);

-- 10. 블로그 글 
CREATE TABLE POSTS (
    post_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,
    restaurant_id INT,
    title         VARCHAR(200),
    content       TEXT,
    ai_summary    TEXT         NULL,             -- AI 3줄 요약
    thumbnail_url VARCHAR(255) NULL,             -- 카드 리스트 대표 이미지
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)       REFERENCES USERS(user_id)             ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);

CREATE TABLE POST_TAGS (
    post_id INT,
    tag_id  INT,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES POSTS(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)  REFERENCES TAGS(tag_id)   ON DELETE CASCADE
);

-- 11. 리뷰
CREATE TABLE REVIEWS (
    review_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,
    restaurant_id INT,
    type          ENUM('simple', 'blog') DEFAULT 'simple', -- 간단 리뷰 / 블로그형 리뷰
    content       TEXT,
    score         TINYINT CHECK (score BETWEEN 1 AND 5),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)       REFERENCES USERS(user_id)             ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);

-- 12. 이미지
CREATE TABLE IMAGES (
    image_id  INT AUTO_INCREMENT PRIMARY KEY,
    url       VARCHAR(255) NOT NULL,
    post_id   INT NULL,
    review_id INT NULL,
    FOREIGN KEY (post_id)   REFERENCES POSTS(post_id)     ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES REVIEWS(review_id) ON DELETE CASCADE
);

-- 13. 좋아요 하트
CREATE TABLE POST_LIKES (
    user_id    INT,
    post_id    INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES POSTS(post_id) ON DELETE CASCADE
);

CREATE TABLE REVIEW_LIKES (
    user_id    INT,
    review_id  INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, review_id),
    FOREIGN KEY (user_id)   REFERENCES USERS(user_id)     ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES REVIEWS(review_id) ON DELETE CASCADE
);

-- 14. 스크랩
CREATE TABLE SCRAPS (
    user_id       INT,
    restaurant_id INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, restaurant_id),
    FOREIGN KEY (user_id)       REFERENCES USERS(user_id)             ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);

-- 15. 알림
CREATE TABLE NOTIFICATIONS (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,                -- 알림 수신 대상
    type            ENUM(
                        'friend_request',
                        'like',
                        'group_invite',
                        'mention',
                        'comment'
                    ) NOT NULL,
    related_id      INT NULL,                    -- 관련 엔티티 ID (post_id, group_id 등)
    is_read         BOOLEAN   DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- 17. 댓글
CREATE TABLE COMMENTS (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id    INT  NOT NULL,
    user_id    INT  NULL,                        -- 작성자 탈퇴 시 NULL 보존
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES POSTS(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL,
    INDEX idx_comments_post (post_id),
    INDEX idx_comments_user (user_id)
);

-- 16. 알림 설정 
CREATE TABLE NOTIFICATION_SETTINGS (
    user_id        INT PRIMARY KEY,
    friend_request BOOLEAN DEFAULT TRUE,
    likes          BOOLEAN DEFAULT TRUE,
    group_invite   BOOLEAN DEFAULT TRUE,
    marketing      BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);
