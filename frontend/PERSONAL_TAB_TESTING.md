# Personal Tab Locking Feature - Testing Guide

## ✅ Backend Tests: PASSED
All automated backend tests passed successfully. See `backend/test-personal-tab-locking.js` for details.

## 📋 Manual Frontend Testing Scenarios

### Scenario 1: Level 1 or 2 - Personal Tab Locked
**Setup:**
- Two users with a conversation
- Message count < 10

**Expected Behavior:**
- ✅ "Personal" tab shows lock icon 🔒
- ✅ Clicking Personal tab shows lock screen
- ✅ Lock screen displays:
  - Lock icon in rounded circle
  - "Personal Photos Locked" heading
  - Message: "Personal photos unlock once you both reach Level 3 and agree to share more."
  - Progress indicator (e.g., "5/10 messages")
- ✅ No personal photos loaded in network tab
- ✅ "Lifestyle" tab remains accessible and shows all content

---

### Scenario 2: Level 3 Threshold Reached, Only One User Consented
**Setup:**
- Message count >= 10
- ONLY one user has `level3_questions_completed = TRUE`
- OR only one user has consented to Level 3

**Expected Behavior:**
- ✅ "Personal" tab STILL shows lock icon 🔒
- ✅ Lock screen still displayed
- ✅ No personal photos accessible
- ✅ Backend returns `personalTabUnlocked: false`

---

### Scenario 3: Level 3 Fully Unlocked - Both Users Consented
**Setup:**
- Message count >= 10
- BOTH users have `level3_questions_completed = TRUE`
- BOTH users consented to Level 3 (`level3_user1_consent` AND `level3_user2_consent`)

**Expected Behavior:**
- ✅ "Personal" tab shows NO lock icon
- ✅ Clicking Personal tab shows 2-column photo grid
- ✅ All `face_photos` from user profile displayed
- ✅ Photos have `rounded-2xl` styling with borders
- ✅ Backend returns `personalTabUnlocked: true`

---

### Scenario 4: Tab Switching
**Expected Behavior:**
- ✅ Switching between Lifestyle and Personal tabs works smoothly
- ✅ Active tab has darker background (`bg-gray-300 dark:bg-gray-700`)
- ✅ Inactive tab has lighter background (`bg-gray-200 dark:bg-gray-800`)
- ✅ Chat messages remain visible below
- ✅ No state loss when switching tabs

---

### Scenario 5: Persistence After Refresh
**Setup:**
- Level 3 unlocked (personal tab accessible)
- Refresh browser

**Expected Behavior:**
- ✅ Personal tab remains unlocked
- ✅ Photos still load correctly
- ✅ No re-lock on page reload

---

## 🔍 How to Test Manually

### Using Browser DevTools:

1. **Network Tab Check (Locked State):**
   ```
   - Open browser DevTools (F12)
   - Go to Network tab
   - Filter by "Images"
   - Click on Personal tab (locked)
   - ✅ Verify: NO photo requests made
   ```

2. **Network Tab Check (Unlocked State):**
   ```
   - Same setup as above
   - Click on Personal tab (unlocked)
   - ✅ Verify: Photo requests made for each face_photo
   ```

3. **Inspect API Response:**
   ```
   - Network tab → find request to `/api/user/profile/:userId?conversationId=X`
   - Check Response JSON
   - ✅ Verify: `personalTabUnlocked: true/false` exists
   ```

4. **Console Check:**
   ```javascript
   // In browser console, check user object:
   console.log('Personal Tab Unlocked:', user?.personalTabUnlocked);
   ```

---

## 🗄️ Database States for Testing

### Lock State (Personal Tab Locked):
```sql
-- Conversation at Level 2 (not enough messages)
UPDATE conversations SET 
  message_count = 5,
  level2_user1_consent = TRUE,
  level2_user2_consent = TRUE,
  level3_user1_consent = FALSE,
  level3_user2_consent = FALSE
WHERE id = <conversation_id>;

UPDATE users SET level3_questions_completed = FALSE WHERE id IN (<user1>, <user2>);
```

### Partial Unlock State (Only One User Consented):
```sql
-- 10+ messages but only user1 consented
UPDATE conversations SET 
  message_count = 10,
  level3_user1_consent = TRUE,
  level3_user2_consent = FALSE  -- ❌ User2 hasn't consented
WHERE id = <conversation_id>;

UPDATE users SET level3_questions_completed = TRUE WHERE id = <user1>;
UPDATE users SET level3_questions_completed = FALSE WHERE id = <user2>;
```

### Unlock State (Personal Tab Unlocked):
```sql
-- Both users reached Level 3
UPDATE conversations SET 
  message_count = 10,
  level3_user1_consent = TRUE,
  level3_user2_consent = TRUE
WHERE id = <conversation_id>;

UPDATE users SET level3_questions_completed = TRUE WHERE id IN (<user1>, <user2>);
```

---

## ✅ Verification Checklist

- [ ] Lock icon appears on Personal tab when locked
- [ ] Lock screen displays friendly message when locked
- [ ] No photos load in network tab when locked
- [ ] Personal tab unlocks when all 4 conditions met
- [ ] Both users see same unlock state (symmetry)
- [ ] Tab switching works smoothly
- [ ] State persists after page refresh
- [ ] Backend returns correct `personalTabUnlocked` boolean
- [ ] Frontend conditionally renders based on backend flag
- [ ] Lifestyle tab remains accessible at all times

---

## 🐛 Common Issues to Watch For

1. **Photos loading when locked:**
   - Check: `{viewMode === 'personal' && user.personalTabUnlocked && ...}`
   - Photos should ONLY render when BOTH conditions true

2. **Lock icon not appearing:**
   - Check: `{!user?.personalTabUnlocked && <LockIcon />}`
   - Should render when flag is `false` or missing

3. **Tab not switching:**
   - Check: `viewMode` state updates on button click
   - Verify: `setViewMode('lifestyle')` and `setViewMode('personal')` called correctly

4. **Backend returns 0/1 instead of true/false:**
   - Already fixed with `!!` boolean conversion
   - But verify API response is clean boolean

---

## 📊 Expected Test Results

- **Automated Tests:** ✅ All 5 tests passing
- **Manual Tests:** Follow scenarios above
- **UI/UX:** Smooth transitions, clear messaging
- **Security:** No data leakage when locked

---

**Last Updated:** $(date)
**Status:** ✅ Ready for Testing
