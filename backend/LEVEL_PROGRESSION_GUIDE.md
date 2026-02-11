# Level Progression System - Quick Reference

## 🎯 Core Rules (MANDATORY)

1. **Level 2 triggers at 5 messages** (no prerequisites)
2. **Level 3 triggers at 5 messages AFTER both users accept Level 2**
3. **Message counting for Level 3 PAUSES if Level 2 consent is pending/declined**
4. **Counter resets to 0 when both users accept Level 2**

---

## 📊 Message Counters

### Database Fields (`match_levels` table)

| Field | Purpose | When Incremented |
|-------|---------|------------------|
| `level2_message_count` | Counts toward Level 2 unlock | Every message (no prerequisites) |
| `level3_message_count` | Counts toward Level 3 unlock | Only when BOTH users have `level2_*_consent_state = 'ACCEPTED'` |

### Consent States (ENUM)

- `PENDING` - User hasn't responded yet
- `ACCEPTED` - User clicked "Yes"
- `DECLINED_TEMPORARY` - User clicked "No" (not permanent!)

---

## 🔄 Message Flow

```
┌─────────────────────────────────────────────────┐
│  New Message Sent                               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  incrementMessageCount(conversationId)          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Level 1: Increment level2_message_count        │
│  If count === 5 → Trigger Level 2 popup         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Check: Both users accepted Level 2?            │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    ✅ YES              ❌ NO
        │                   │
        │             BLOCK: Don't count
        │             toward Level 3
        │
        ▼
Increment level3_message_count
If count === 5 → Trigger Level 3 popup
```

---

## 🎮 Example Scenarios

### Scenario A: Smooth Progression
```
1. Send 5 messages        → level2_count = 5, level3_count = 0
2. Level 2 popup appears  → User clicks "YES" (both)
3. Send 5 more messages   → level2_count = 5, level3_count = 5
4. Level 3 popup appears  → ✅
```

### Scenario B: Declined Then Accepted
```
1. Send 5 messages        → level2_count = 5, level3_count = 0
2. Level 2 popup appears  → User clicks "NO"
3. Send 100 messages      → level2_count = 5, level3_count = 0 (BLOCKED!)
4. User clicks "YES"      → level3_count RESET to 0
5. Send 5 more messages   → level2_count = 5, level3_count = 5
6. Level 3 popup appears  → ✅
```

### Scenario C: One User Blocks
```
1. Send 5 messages        → level2_count = 5
2. User A: "YES"          → user1_consent = ACCEPTED
3. User B: "NO"           → user2_consent = DECLINED_TEMPORARY
4. Send 100 messages      → level3_count = 0 (BLOCKED - both must accept!)
5. User B: "YES"          → user2_consent = ACCEPTED, level3_count RESET to 0
6. Send 5 more messages   → level3_count = 5
7. Level 3 popup appears  → ✅
```

---

## 🛠️ Key Functions

### `incrementMessageCount(conversationId)`
**Location:** `backend/services/profileLevelService.js`

**What it does:**
- Checks current level and consent states
- Increments appropriate counter (level2 or level3)
- Triggers popup if threshold reached
- **BLOCKS Level 3 if Level 2 not accepted by both**

**Returns:**
```javascript
{
    newLevel: number,        // Current level (1, 2, or 3)
    shouldNotify: boolean,   // True if threshold reached
    threshold: string,       // 'LEVEL_2' or 'LEVEL_3' or null
    messageCount: number     // Total counted messages
}
```

### `setLevel2Consent(conversationId, userId, consent)`
**Location:** `backend/services/profileLevelService.js`

**What it does:**
- Updates user's consent state (ACCEPTED or DECLINED_TEMPORARY)
- If both users accept → **RESETS level3_message_count to 0**
- Sets current_level to 2

**CRITICAL:** This function ensures fresh start for Level 3 progression!

---

## 🐛 Debugging

### Check Message Counters
```sql
SELECT 
    conversation_id,
    current_level,
    level2_message_count,
    level3_message_count,
    level2_user1_consent_state,
    level2_user2_consent_state
FROM match_levels
WHERE conversation_id = ?;
```

### Check Consent States
```sql
SELECT 
    level2_user1_consent_state,
    level2_user2_consent_state,
    level3_user1_consent_state,
    level3_user2_consent_state
FROM match_levels
WHERE conversation_id = ?;
```

### Reset for Testing
```sql
UPDATE match_levels
SET 
    current_level = 1,
    level2_message_count = 0,
    level3_message_count = 0,
    level2_user1_consent_state = 'PENDING',
    level2_user2_consent_state = 'PENDING'
WHERE conversation_id = ?;
```

---

## ⚠️ Common Pitfalls

### ❌ DON'T:
- Don't use `conversations.message_count` for level triggers (old system)
- Don't increment `level3_message_count` before checking consent
- Don't forget to reset counter when both users accept Level 2

### ✅ DO:
- Always check BOTH users' consent states before counting toward Level 3
- Use per-level message counters (`level2_message_count`, `level3_message_count`)
- Reset `level3_message_count = 0` when both users accept Level 2
- Log blocking events for debugging

---

## 📞 Support

If Level 3 triggers without Level 2 consent:
1. Check `level2_user1_consent_state` and `level2_user2_consent_state`
2. Verify both are `ACCEPTED` before Level 3 triggered
3. Check `level3_message_count` - should be 0 if consent not granted
4. Run `node test-blocking-progression.js` to verify logic

**Last Updated:** February 3, 2026
