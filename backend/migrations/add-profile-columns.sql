-- Migration: Add matchable profile columns for hybrid approach
-- Date: 2025-11-16
-- Purpose: Extract frequently queried fields from JSON to indexed columns for fast matching

-- Add new columns for matchable fields
ALTER TABLE users 
ADD COLUMN interests TEXT COMMENT 'JSON array of user interests for matching',
ADD COLUMN pets VARCHAR(50) COMMENT 'Pet preference for matching',
ADD COLUMN drinking VARCHAR(50) COMMENT 'Drinking habits for matching',
ADD COLUMN smoking VARCHAR(50) COMMENT 'Smoking habits for matching',
ADD COLUMN height INT COMMENT 'Height in cm for matching',
ADD COLUMN religious_level VARCHAR(50) COMMENT 'Religious level: not, moderately, deeply',
ADD COLUMN kids_preference VARCHAR(50) COMMENT 'Thoughts on kids for matching',
ADD COLUMN food_preference VARCHAR(50) COMMENT 'Food preference for matching',
ADD COLUMN relationship_status VARCHAR(50) COMMENT 'Current relationship status',
ADD COLUMN from_location VARCHAR(100) COMMENT 'Original/hometown location',
ADD COLUMN instagram VARCHAR(100) COMMENT 'Instagram username',
ADD COLUMN linkedin VARCHAR(255) COMMENT 'LinkedIn profile URL',
ADD COLUMN face_photos TEXT COMMENT 'JSON array of face photo URLs';

-- Create indexes for fast matching queries
CREATE INDEX idx_pets ON users(pets);
CREATE INDEX idx_drinking ON users(drinking);
CREATE INDEX idx_smoking ON users(smoking);
CREATE INDEX idx_religious_level ON users(religious_level);
CREATE INDEX idx_height ON users(height);
CREATE INDEX idx_kids_preference ON users(kids_preference);
CREATE INDEX idx_food_preference ON users(food_preference);

-- Migration complete
SELECT 'Migration completed: Added profile columns and indexes' AS status;
