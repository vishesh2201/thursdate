-- Create daily games table
CREATE TABLE IF NOT EXISTS daily_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_date DATE NOT NULL UNIQUE,
    question VARCHAR(255) NOT NULL,
    option1_text VARCHAR(100) NOT NULL,
    option1_image VARCHAR(500) NOT NULL,
    option2_text VARCHAR(100) NOT NULL,
    option2_image VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_game_date (game_date)
);

-- Create user game responses table
CREATE TABLE IF NOT EXISTS user_game_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    selected_option TINYINT NOT NULL COMMENT '1 for option1, 2 for option2',
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES daily_games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game (user_id, game_id),
    INDEX idx_user_played (user_id, played_at)
);

-- Create game stats summary table (optional - for analytics)
CREATE TABLE IF NOT EXISTS daily_game_stats (
    game_id INT PRIMARY KEY,
    total_plays INT DEFAULT 0,
    option1_count INT DEFAULT 0,
    option2_count INT DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES daily_games(id) ON DELETE CASCADE
);
