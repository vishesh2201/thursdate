# Like/Dislike Match System Implementation

This document describes the like/dislike matching system implementation for the dating app.

## Overview

The system allows users to:

- Like or skip potential matches
- Get notified when there's a mutual match (both users liked each other)
- View their mutual matches
- See who has liked them

## Database Schema

### `user_actions` Table

Stores all user interactions (likes, skips).

```sql
CREATE TABLE user_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,              -- User who performed the action
  target_user_id INT NOT NULL,       -- User who received the action
  action_type ENUM('like', 'skip', 'unmatch') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_action (user_id, target_user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_target_user_id (target_user_id),
  INDEX idx_action_type (action_type)
);
```

**Key Features:**

- `UNIQUE KEY` ensures a user can only have one action per target user
- If a user changes their mind, the action is updated
- Foreign keys ensure data integrity

### `mutual_matches` View

A view that makes it easy to query mutual matches:

```sql
CREATE OR REPLACE VIEW mutual_matches AS
SELECT
    a1.user_id as user1_id,
    a1.target_user_id as user2_id,
    a1.created_at as user1_liked_at,
    a2.created_at as user2_liked_at,
    GREATEST(a1.created_at, a2.created_at) as match_created_at
FROM user_actions a1
JOIN user_actions a2
    ON a1.user_id = a2.target_user_id
    AND a1.target_user_id = a2.user_id
WHERE a1.action_type = 'like'
    AND a2.action_type = 'like';
```

## Backend API Endpoints

### 1. Record Match Action

**Endpoint:** `POST /user/matches/action`

Records a like or skip action and checks for mutual matches.

**Request Body:**

```json
{
  "targetUserId": 123,
  "actionType": "like" // or "skip"
}
```

**Response:**

```json
{
  "success": true,
  "action": "like",
  "isMutualMatch": true,
  "matchData": {
    "userId": 123,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2. Get Mutual Matches

**Endpoint:** `GET /user/matches/mutual`

Returns all users who have mutually liked each other.

**Response:**

```json
{
  "matches": [
    {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "age": 25,
      "profilePicUrl": "...",
      "matchedAt": "2025-12-23T10:30:00Z",
      ...
    }
  ]
}
```

### 3. Get Likes Received

**Endpoint:** `GET /user/matches/likes-received`

Returns all users who have liked the current user.

**Response:**

```json
{
  "likes": [
    {
      "id": 456,
      "firstName": "Jane",
      "lastName": "Smith",
      "age": 24,
      "profilePicUrl": "...",
      "likedAt": "2025-12-23T09:15:00Z"
    }
  ]
}
```

## Frontend Implementation

### API Functions (`frontend/src/utils/api.js`)

```javascript
// Record a like or skip action
userAPI.recordMatchAction(targetUserId, "like"); // or 'skip'

// Get mutual matches
userAPI.getMutualMatches();

// Get users who liked you
userAPI.getLikesReceived();
```

### HomeTab Component

The HomeTab component handles:

- Displaying potential matches
- Like/skip buttons with API integration
- Match notification modal when there's a mutual match
- Swipe gestures and card animations

**Key Features:**

- When user likes someone, the API is called
- If it's a mutual match, a celebration modal appears
- User can choose to "Keep Swiping" or "Send Message"
- Actions are recorded even if the API temporarily fails (graceful degradation)

## Installation & Setup

### 1. Run the Migration

```bash
cd backend
node migrations/run-user-actions-migration.js
```

This will:

- Create the `user_actions` table
- Create the `mutual_matches` view
- Set up all necessary indexes and constraints

### 2. Restart Backend Server

```bash
cd backend
npm start
```

### 3. Test the System

1. Log in as User A
2. Browse potential matches
3. Like a few users
4. Log in as User B (one of the users A liked)
5. Like User A back
6. User A should see a match notification!

## Usage Flow

1. **User browses matches** → `GET /user/matches/potential`
2. **User likes someone** → `POST /user/matches/action` with `{ targetUserId, actionType: 'like' }`
3. **Backend checks for mutual match** → If both users liked each other, returns `isMutualMatch: true`
4. **Frontend shows celebration modal** → "It's a Match! 🎉"
5. **User can view all matches** → `GET /user/matches/mutual`

## Database Queries Explained

### Check for Mutual Match

```sql
SELECT * FROM user_actions
WHERE user_id = ? AND target_user_id = ? AND action_type = 'like'
```

### Get All Mutual Matches for a User

```sql
SELECT DISTINCT u.*
FROM user_actions a1
JOIN user_actions a2
  ON a1.user_id = a2.target_user_id
  AND a1.target_user_id = a2.user_id
JOIN users u ON u.id = a1.target_user_id
WHERE a1.user_id = ?
  AND a1.action_type = 'like'
  AND a2.action_type = 'like'
```

## Future Enhancements

- [ ] Add "unmatch" functionality
- [ ] Add "undo" last action
- [ ] Implement match expiration (matches expire after X days without message)
- [ ] Add super likes (limited premium feature)
- [ ] Implement match filters (by location, age, etc.)
- [ ] Add analytics (match rate, most popular profiles, etc.)

## Testing Checklist

- [ ] User can like a potential match
- [ ] User can skip a potential match
- [ ] Mutual match notification appears when both users like each other
- [ ] Mutual matches appear in matches list
- [ ] Likes received shows users who liked you
- [ ] Can't like the same user twice (action updates instead)
- [ ] Database constraints prevent invalid data
- [ ] Error handling works when API fails
- [ ] Mock mode works correctly for testing

## Security Considerations

- ✅ All endpoints require authentication (`auth` middleware)
- ✅ Users can only like approved users
- ✅ Foreign key constraints prevent orphaned records
- ✅ Unique constraint prevents duplicate actions
- ✅ Input validation on action type
- ✅ SQL injection protection (parameterized queries)

---

**Created:** December 23, 2025  
**Last Updated:** December 23, 2025
