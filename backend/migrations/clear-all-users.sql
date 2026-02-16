-- ============================================
-- Script to delete all users and related data
-- ============================================
-- 
-- WARNING: This will permanently delete ALL users and associated data
-- USE WITH CAUTION!
--
-- To run this script:
-- 1. Using Node.js: node clear-all-users.js
-- 2. Using MySQL client: mysql -u username -p database_name < migrations/clear-all-users.sql
--

-- Delete from tables with foreign keys first
DELETE FROM daily_game_scores;
DELETE FROM user_reports;
DELETE FROM blocks;
DELETE FROM user_actions;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM match_expiry_tracking;

-- Finally delete all users
DELETE FROM users;

-- Reset auto-increment counters (optional)
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE conversations AUTO_INCREMENT = 1;
ALTER TABLE messages AUTO_INCREMENT = 1;
ALTER TABLE user_actions AUTO_INCREMENT = 1;
ALTER TABLE blocks AUTO_INCREMENT = 1;
ALTER TABLE user_reports AUTO_INCREMENT = 1;
ALTER TABLE daily_game_scores AUTO_INCREMENT = 1;
