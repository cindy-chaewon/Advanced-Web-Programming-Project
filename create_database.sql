create Database mapweb;
use mapweb;
CREATE TABLE USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    ci VARCHAR(88) UNIQUE,
    di VARCHAR(64),
    verified_at TIMESTAMP NULL,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE FRIENDS (
    user_id INT,
    friend_id INT,
    status ENUM('pending', 'accepted'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);
CREATE TABLE ADDRESSES (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    full_address VARCHAR(200),
    district VARCHAR(50),
    city VARCHAR(50),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7)
);
CREATE TABLE CATEGORIES (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50)
);
CREATE TABLE RESTAURANTS (
    restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    address_id INT,
    category_id INT,
    avg_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES ADDRESSES(address_id),
    FOREIGN KEY (category_id) REFERENCES CATEGORIES(category_id)
);
CREATE TABLE TAGS (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);
CREATE TABLE RESTAURANT_TAGS (
    restaurant_id INT,
    tag_id INT,
    PRIMARY KEY (restaurant_id, tag_id),
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES TAGS(tag_id) ON DELETE CASCADE
);
CREATE TABLE POSTS (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    restaurant_id INT,
    title VARCHAR(200),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);
CREATE TABLE REVIEWS (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    restaurant_id INT,
    content TEXT,
    score TINYINT CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);
CREATE TABLE LIKES (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    post_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES POSTS(post_id) ON DELETE CASCADE
);