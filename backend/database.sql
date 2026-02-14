-- Use existing thursdate database
USE thursdate;

-- Drop existing users table if it exists
DROP TABLE IF EXISTS users;

-- Create users table with all required fields
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  gender VARCHAR(50),
  dob DATE,
  current_location VARCHAR(100),
  favourite_travel_destination TEXT, -- ✅ SWAPPED: Now JSON array (3+ destinations)
  last_holiday_places VARCHAR(255), -- ✅ SWAPPED: Now single string
  favourite_places_to_go TEXT,
  profile_pic_url VARCHAR(500),
  intent TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_email ON users(email); 