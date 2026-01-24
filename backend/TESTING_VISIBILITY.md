# Testing the Level Visibility Fix

## Quick Test Commands

### 1. Check current visibility between two users

```bash
node debug-consent-values.js
```

This will show the current state of all conversations including:
- Message count
- Level 2/3 completion status
- Level 2/3 consent status
- Current visibility level

### 2. Test a specific scenario

```javascript
// In Node.js console or a test script:
const profileLevelService = require('./services/profileLevelService');

// Replace with actual IDs from your database
const conversationId = 36;
const viewerId = 22; // Akash
const profileOwnerId = 16; // Sarah

const visibility = await profileLevelService.getVisibilityLevel(
    conversationId,
    viewerId,
    profileOwnerId
);

console.log('Visibility level:', visibility.level);
// Should be 1 unless BOTH users completed AND consented
```

### 3. Manual testing workflow

1. **Setup**: Two users with a match and 5+ messages
2. **Test Case 1**: Neither user fills Level 2 info
   - Expected: Both see Level 1 only
3. **Test Case 2**: User A fills Level 2 info
   - Expected: Both still see Level 1 only (User B hasn't filled yet)
4. **Test Case 3**: User B also fills Level 2 info, but doesn't consent
   - Expected: Both still see Level 1 only (User B hasn't consented)
5. **Test Case 4**: User B consents
   - Expected: Both see Level 2 (both completed AND both consented)

## Key Database Tables

### conversations
```sql
SELECT 
    id, user_id_1, user_id_2, message_count,
    level2_user1_consent, level2_user2_consent,
    level3_user1_consent, level3_user2_consent
FROM conversations 
WHERE id = ?;
```

### users
```sql
SELECT 
    id, first_name, 
    level2_questions_completed, level2_completed_at,
    level3_questions_completed
FROM users 
WHERE id IN (?, ?);
```

## Expected Behavior

### Level 2 Visibility Rules
✅ Visible ONLY when ALL of these are true:
1. Message count >= 5
2. Viewer has completed Level 2 questions (`level2_questions_completed = TRUE`)
3. Owner has completed Level 2 questions (`level2_questions_completed = TRUE`)
4. Viewer has consented for this match (`level2_user1_consent` or `level2_user2_consent = TRUE`)
5. Owner has consented for this match (`level2_user1_consent` or `level2_user2_consent = TRUE`)

### Level 3 Visibility Rules
✅ Visible ONLY when ALL of these are true:
1. Message count >= 10
2. Viewer has completed Level 3 questions (`level3_questions_completed = TRUE`)
3. Owner has completed Level 3 questions (`level3_questions_completed = TRUE`)
4. Viewer has consented for this match (`level3_user1_consent` or `level3_user2_consent = TRUE`)
5. Owner has consented for this match (`level3_user1_consent` or `level3_user2_consent = TRUE`)

## Common Issues to Check

❌ **Problem**: User A can see User B's info, but User B hasn't filled it
✅ **Solution**: Check that BOTH users have `level2_questions_completed = TRUE`

❌ **Problem**: Both users filled info but can't see each other
✅ **Solution**: Check that BOTH users have given consent for this specific match

❌ **Problem**: Asymmetric visibility (A sees B's info but B doesn't see A's)
✅ **Solution**: This should NOT happen after the fix. Check the console logs for position mapping

## Console Log Interpretation

Look for these log entries when a user views another profile:

```
[Visibility] Conv 36: messages=10
[Visibility] Viewer=22 (isUser1=false), Owner=16 (isUser1=true)
[Visibility] Level 2 - viewer_consent=1, owner_consent=1, viewer_completed=1, owner_completed=1
[Visibility] ✅ Level 2 visibility GRANTED
[Visibility] Final visible level: 2
```

Key things to verify:
- `Viewer` and `Owner` IDs are correct
- `isUser1` flags correctly identify positions
- `viewer_consent` and `owner_consent` match the actual consent status
- `viewer_completed` and `owner_completed` match actual completion status
