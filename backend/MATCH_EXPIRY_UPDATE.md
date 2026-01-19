# Match Expiry System - Updated Behavior

## Overview
The 7-day match timer has been modified to create urgency without blocking communication.

## Previous Behavior ❌
- After 7 days without messages → Users automatically unmatched
- `user_actions` table records changed to 'unmatch'
- Chat access blocked permanently
- Matches removed from horizontal section

## New Behavior ✅

### 1. **No Auto-Unmatch**
- Matches remain valid indefinitely
- `user_actions` records stay as 'like'
- Chat access never blocked based on time

### 2. **Horizontal Section Visibility**
- Profiles shown in horizontal section during 7-day window
- After 7 days with no messages → Profile removed from horizontal section ONLY
- Match still valid, just not prominently displayed

### 3. **Chat Permissions**
- Users can ALWAYS chat with matched users
- Even after 7-day timer expires
- Existing conversations remain accessible
- New messages can be sent at any time

### 4. **Message-Based Removal** (Unchanged)
- First message sent → Profile removed from sender's horizontal section
- Reply received → Profile removed from both users' horizontal sections
- Conversation moves to chat list below

## Technical Changes

### Modified Files

#### 1. `backend/services/matchExpiry.js`
**Function: `expireOldMatches()`**
- Removed: Changing `user_actions` to 'unmatch'
- Kept: Marking `conversations.match_expired = TRUE`
- Effect: UI-only flag, doesn't affect match validity

**Function: `expireMatch()`**
- Removed: Unmatching users
- Kept: Marking conversation as expired
- Effect: Manual expiry also UI-only

**Function: `checkMutualMatch()`** (in chat.js)
- Already correct: Only checks for 'like' actions
- Doesn't check expiry flags
- Ensures chat access works regardless of timer

#### 2. `backend/cleanup-expired-matches.js`
- Updated comments to clarify UI-only behavior
- Updated log messages to indicate chat still enabled

#### 3. `backend/match-expiry-scheduler.js`
- Updated comments to clarify UI-only behavior
- Updated log messages to indicate chat still enabled

### Unchanged Files (Already Correct)

#### 1. `backend/routes/chat.js`
- `checkMutualMatch()`: Only checks mutual 'like' actions
- `GET /conversations`: Returns all conversations (no expiry check)
- `POST /conversations`: Creates conversation for any matched users
- `GET /conversations/:id/messages`: Accesses messages (no expiry check)
- `POST /conversations/:id/messages`: Sends messages (no expiry check)

#### 2. `backend/services/matchExpiry.js`
- `getMatchedProfilesForUser()`: Already filters correctly
  - `match_expired = FALSE` → Shows in horizontal section
  - `match_expires_at > NOW()` → Within 7-day window
  - Perfect for UI filtering

## Database Schema

### `conversations` Table
```sql
match_created_at    -- When match was created
match_expires_at    -- 7 days from match_created_at
match_expired       -- TRUE = remove from horizontal section
                    -- FALSE = show in horizontal section
first_message_at    -- When first message was sent
reply_at            -- When reply was received
```

### `user_actions` Table
```sql
action_type         -- 'like' = matched (NEVER changed to 'unmatch' by timer)
                    -- 'skip' = not interested
```

## Flow Examples

### Example 1: Match within 7 days
```
Day 0: Users match
  → Appear in horizontal section
  → Can chat

Day 3: User A sends message
  → Removed from User A's horizontal section
  → Still in User B's horizontal section
  → Can chat

Day 4: User B replies
  → Removed from both horizontal sections
  → Moves to chat list
  → Can chat
```

### Example 2: Match after 7 days
```
Day 0: Users match
  → Appear in horizontal section
  → Can chat

Day 8: Timer expires (no messages)
  → match_expired = TRUE
  → Removed from horizontal section
  → Match still valid
  → Can still chat (if they find each other's profile or have conversation)

Day 10: User A opens chat
  → Can send message
  → User B receives notification
  → Can reply
  → Conversation works normally
```

## Benefits

✅ **Urgency**: 7-day timer creates sense of urgency  
✅ **No Pressure**: Users not penalized for being busy  
✅ **Flexibility**: Communication always possible  
✅ **Professional**: Industry-standard dating app behavior  
✅ **User-Friendly**: Doesn't block legitimate connections  

## Cron Job

The scheduler (`match-expiry-scheduler.js`) can still run:
- Marks conversations as expired (UI-only)
- Does NOT unmatch users
- Does NOT block chat access
- Only affects horizontal section visibility

Run with: `node match-expiry-scheduler.js`

Or integrate into `server.js` for automatic scheduling.
