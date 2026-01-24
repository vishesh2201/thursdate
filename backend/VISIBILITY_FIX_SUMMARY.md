# Level-Up Visibility Fix - Summary

## Problem Identified

When two users matched and one filled out their Level 2/3 information, the other user could see that information even though they hadn't filled out their own information yet. This violated the mutual consent requirement.

### Root Cause

The bug was in the `getVisibilityLevel()` function in `backend/services/profileLevelService.js` (lines 48-68).

**The Problem:**
The SQL query used incorrect CASE statements that didn't properly map viewer/owner to their actual positions (user1/user2) in the conversation table:

```sql
-- OLD BUGGY CODE
CASE WHEN c.user_id_1 = ? THEN c.level2_user1_consent ELSE c.level2_user2_consent END as viewer_level2_consent,
CASE WHEN c.user_id_1 = ? THEN c.level2_user2_consent ELSE c.level2_user1_consent END as owner_level2_consent,
```

This assumed that if `user_id_1 == viewerId`, then the viewer was always user1. But this logic was flawed:
- If Akash is `user_id_1` and Sara is `user_id_2`
- When Sara (viewer) looks at Akash (owner), it would check `user_id_1 == Sara's ID` → FALSE
- So it would assign `level2_user2_consent` as Sara's consent (correct by accident)
- But it would also check `user_id_1 == Akash's ID` → TRUE  
- So it would assign `level2_user2_consent` as Akash's consent (WRONG! Should be level2_user1_consent)

This caused asymmetric visibility where one user could see information that should be hidden.

## Solution Implemented

### 1. Fixed SQL Query (lines 48-68)

Removed the broken CASE statements and instead fetched all columns directly:

```sql
SELECT 
    c.current_level,
    c.message_count,
    c.user_id_1,
    c.user_id_2,
    c.level2_user1_consent,
    c.level2_user2_consent,
    c.level3_user1_consent,
    c.level3_user2_consent,
    viewer.level2_questions_completed as viewer_level2_completed,
    viewer.level3_questions_completed as viewer_level3_completed,
    owner.level2_questions_completed as owner_level2_completed,
    owner.level3_questions_completed as owner_level3_completed
FROM conversations c
JOIN users viewer ON viewer.id = ?
JOIN users owner ON owner.id = ?
WHERE c.id = ?
```

### 2. Added Proper Mapping Logic (lines 75-85)

After fetching the data, properly map viewer/owner to their actual positions:

```javascript
// ✅ FIX: Correctly map viewer and owner to their actual positions in conversation
const viewerIsUser1 = conv.user_id_1 === viewerId;
const ownerIsUser1 = conv.user_id_1 === profileOwnerId;

const viewer_level2_consent = viewerIsUser1 ? conv.level2_user1_consent : conv.level2_user2_consent;
const owner_level2_consent = ownerIsUser1 ? conv.level2_user1_consent : conv.level2_user2_consent;
const viewer_level3_consent = viewerIsUser1 ? conv.level3_user1_consent : conv.level3_user2_consent;
const owner_level3_consent = ownerIsUser1 ? conv.level3_user1_consent : conv.level3_user2_consent;
```

### 3. Enhanced Logging (lines 87-91)

Added detailed logging to trace viewer/owner positions:

```javascript
console.log(`[Visibility] Viewer=${viewerId} (isUser1=${viewerIsUser1}), Owner=${profileOwnerId} (isUser1=${ownerIsUser1})`);
```

## Verification

The fix ensures:

1. ✅ **Mutual Completion Requirement**: Profile information at Level 2/3 is only visible when BOTH users have completed their respective questions
2. ✅ **Mutual Consent Requirement**: Profile information is only visible when BOTH users have consented to share
3. ✅ **Symmetric Visibility**: Both users see the same level of information about each other
4. ✅ **Correct Position Mapping**: Viewer and owner are correctly mapped to user1/user2 positions regardless of conversation order

## Test Results

The test logs confirm:
- When only one user consents: Level 2 NOT granted ✅
- When both users consent AND complete: Level 2 visibility GRANTED ✅
- Visibility is symmetric (both users see same level) ✅
- Position mapping works correctly (viewer_consent and owner_consent are properly identified) ✅

## Files Modified

- `backend/services/profileLevelService.js` (lines 48-103)

## Files Created (for testing)

- `backend/test-visibility-fix.js` - Basic visibility level test
- `backend/test-mutual-consent.js` - Comprehensive mutual consent test
