# Daily Game Feature - "This or That"

## Overview

A daily "This or That" game popup that appears once per day when users open the app. Users choose between two options and can see how others voted.

## Features

- 🎮 Daily game popup appears automatically (once per 24 hours)
- 📊 Real-time voting statistics
- 🖼️ Image-based options with percentages
- ✅ Tracks user participation
- 🎯 Can only play once per game
- 📱 Mobile-friendly popup design

## Database Schema

### Tables Created:

1. **daily_games** - Stores daily game questions and options
2. **user_game_responses** - Tracks user selections
3. **daily_game_stats** - Aggregates voting statistics

## Setup Instructions

### 1. Run Database Migration

```bash
cd backend
node run-daily-games-migration.js
```

### 2. Seed Sample Games

```bash
node seed-daily-games.js
```

This will create games for the next 7 days with questions like:

- Mountains vs. Beaches
- Coffee vs. Tea
- Dog vs. Cat
- Summer vs. Winter
- City Life vs. Country Life
- Pizza vs. Burgers
- Early Bird vs. Night Owl

### 3. Restart Backend Server

The routes are automatically registered in `server.js`

## API Endpoints

### GET `/api/daily-game/today`

Get today's game and check if user has played
**Headers:** `Authorization: Bearer <token>`
**Response:**

```json
{
  "hasGame": true,
  "hasPlayed": false,
  "game": {
    "id": 1,
    "question": "Mountains vs. Beaches",
    "option1": {
      "text": "Mountains",
      "image": "https://..."
    },
    "option2": {
      "text": "Beaches",
      "image": "https://..."
    }
  }
}
```

### POST `/api/daily-game/play`

Submit game response
**Headers:** `Authorization: Bearer <token>`
**Body:**

```json
{
  "gameId": 1,
  "selectedOption": 1 // 1 or 2
}
```

### GET `/api/daily-game/stats/:gameId`

Get voting statistics for a game
**Headers:** `Authorization: Bearer <token>`

## Frontend Components

### `DailyGamePopup.jsx`

- Located in `frontend/src/components/`
- Shows daily game with two image options
- Displays voting percentages after selection
- Auto-loads stats if already played

### Integration in `HomeTab.jsx`

- Checks localStorage for last game date
- Calls API to check if game available
- Shows popup 1 second after page load (better UX)
- Only shows if user hasn't played today's game

## User Experience Flow

1. User opens app (HomeTab)
2. After 1 second, popup appears (if game available and not played)
3. User selects one of two options
4. Popup shows voting statistics immediately
5. User can close popup or see results
6. Popup won't show again today (tracked in localStorage)

## Adding New Games

### Manual Database Insert:

```sql
INSERT INTO daily_games (game_date, question, option1_text, option1_image, option2_text, option2_image)
VALUES ('2026-02-08', 'Pasta vs. Ramen', 'Pasta', 'https://...', 'Ramen', 'https://...');
```

### Using Script:

Edit `seed-daily-games.js` and add new game objects to `sampleGames` array:

```javascript
{
  date: '2026-02-08',
  question: 'Your Question',
  option1_text: 'Option 1',
  option1_image: 'https://image-url.com',
  option2_text: 'Option 2',
  option2_image: 'https://image-url.com'
}
```

Then run: `node seed-daily-games.js`

## Image Sources

- Uses Unsplash images in sample data
- You can use any image URLs
- Recommended size: 400x400px or similar aspect ratio
- Images are displayed in rounded containers

## Testing

### Test Today's Game:

1. Run migration and seeding
2. Open app in browser
3. Login and navigate to Matches tab
4. Popup should appear after 1 second

### Test "Already Played" State:

1. Play the game once
2. Refresh the page
3. Popup should not appear (tracked in localStorage)
4. To reset: Clear localStorage or wait until tomorrow

### Test API Directly:

```bash
# Get today's game
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/daily-game/today

# Submit response
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"gameId":1,"selectedOption":1}' \
  http://localhost:5000/api/daily-game/play
```

## Customization

### Change Popup Timing:

In `HomeTab.jsx`, find:

```javascript
setTimeout(() => {
  setShowDailyGame(true);
}, 1000); // Change this value (milliseconds)
```

### Change Popup Style:

Edit `DailyGamePopup.jsx` component styles

### Disable Feature:

Comment out the popup check in `HomeTab.jsx`:

```javascript
// useEffect(() => {
//   checkDailyGame();
// }, []);
```

## Notes

- Games are tied to calendar dates (not 24-hour rolling windows)
- Uses localStorage to track if popup was shown today
- Backend ensures users can only vote once per game
- Stats are calculated in real-time when users vote
- Images should be hosted externally (Cloudinary, Unsplash, etc.)
