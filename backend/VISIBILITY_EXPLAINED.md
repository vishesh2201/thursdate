# Level Visibility System - How It Works

## Before Fix (BROKEN) ❌

```
Conversation:
┌─────────────────────────────────────────┐
│ ID: 36                                  │
│ user_id_1: 16 (Sarah)                   │
│ user_id_2: 22 (Akash)                   │
│ level2_user1_consent: TRUE              │
│ level2_user2_consent: FALSE             │
└─────────────────────────────────────────┘

Users:
Sarah (16): level2_questions_completed: TRUE
Akash (22): level2_questions_completed: FALSE

┌──────────────────────────────────────────────────────────────┐
│ OLD BUGGY LOGIC                                              │
├──────────────────────────────────────────────────────────────┤
│ When Akash (22) views Sarah (16):                           │
│                                                              │
│ CASE WHEN user_id_1 = viewerId                               │
│      THEN level2_user1_consent                               │
│      ELSE level2_user2_consent                               │
│                                                              │
│ CASE WHEN user_id_1 = 22 → FALSE                             │
│      → viewer_consent = level2_user2_consent = FALSE         │
│                                                              │
│ CASE WHEN user_id_1 = profileOwnerId                         │
│      THEN level2_user2_consent  ← WRONG!                     │
│      ELSE level2_user1_consent                               │
│                                                              │
│ CASE WHEN user_id_1 = 16 → TRUE                              │
│      → owner_consent = level2_user2_consent = FALSE ← WRONG! │
│         Should be level2_user1_consent = TRUE                │
│                                                              │
│ Result: Level 2 NOT granted (accidentally correct)           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ When Sarah (16) views Akash (22):                           │
│                                                              │
│ CASE WHEN user_id_1 = 16 → TRUE                              │
│      → viewer_consent = level2_user1_consent = TRUE          │
│                                                              │
│ CASE WHEN user_id_1 = 22 → FALSE                             │
│      → owner_consent = level2_user1_consent = TRUE ← WRONG!  │
│         Should be level2_user2_consent = FALSE               │
│                                                              │
│ Result: Level 2 GRANTED ← WRONG! Akash hasn't completed!    │
└──────────────────────────────────────────────────────────────┘

PROBLEM: Sarah can see Akash's info even though he hasn't filled it! ❌
```

## After Fix (CORRECT) ✅

```
Conversation:
┌─────────────────────────────────────────┐
│ ID: 36                                  │
│ user_id_1: 16 (Sarah)                   │
│ user_id_2: 22 (Akash)                   │
│ level2_user1_consent: TRUE              │
│ level2_user2_consent: FALSE             │
└─────────────────────────────────────────┘

Users:
Sarah (16): level2_questions_completed: TRUE
Akash (22): level2_questions_completed: FALSE

┌──────────────────────────────────────────────────────────────┐
│ NEW CORRECT LOGIC                                            │
├──────────────────────────────────────────────────────────────┤
│ When Akash (22) views Sarah (16):                           │
│                                                              │
│ viewerIsUser1 = (user_id_1 === viewerId)                     │
│                = (16 === 22) = FALSE                         │
│                                                              │
│ ownerIsUser1 = (user_id_1 === profileOwnerId)                │
│               = (16 === 16) = TRUE                           │
│                                                              │
│ viewer_consent = viewerIsUser1                               │
│                  ? level2_user1_consent                      │
│                  : level2_user2_consent                      │
│                = level2_user2_consent = FALSE ✅              │
│                                                              │
│ owner_consent = ownerIsUser1                                 │
│                 ? level2_user1_consent                       │
│                 : level2_user2_consent                       │
│               = level2_user1_consent = TRUE ✅                │
│                                                              │
│ viewer_completed = FALSE (Akash)                             │
│ owner_completed = TRUE (Sarah)                               │
│                                                              │
│ Check: viewer_consent AND owner_consent                      │
│        AND viewer_completed AND owner_completed              │
│      = FALSE AND TRUE AND FALSE AND TRUE = FALSE             │
│                                                              │
│ Result: Level 2 NOT granted ✅                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ When Sarah (16) views Akash (22):                           │
│                                                              │
│ viewerIsUser1 = (16 === 16) = TRUE                           │
│ ownerIsUser1 = (16 === 22) = FALSE                           │
│                                                              │
│ viewer_consent = level2_user1_consent = TRUE ✅               │
│ owner_consent = level2_user2_consent = FALSE ✅               │
│                                                              │
│ viewer_completed = TRUE (Sarah)                              │
│ owner_completed = FALSE (Akash)                              │
│                                                              │
│ Check: TRUE AND FALSE AND TRUE AND FALSE = FALSE             │
│                                                              │
│ Result: Level 2 NOT granted ✅                                │
└──────────────────────────────────────────────────────────────┘

RESULT: Neither user can see Level 2 info because Akash hasn't 
        completed his questions. This is CORRECT! ✅
```

## Mutual Consent Matrix

| Sarah Completed | Akash Completed | Sarah Consent | Akash Consent | Visibility |
|----------------|----------------|---------------|---------------|------------|
| ❌ | ❌ | - | - | Level 1 |
| ✅ | ❌ | - | - | Level 1 |
| ❌ | ✅ | - | - | Level 1 |
| ✅ | ✅ | ❌ | - | Level 1 |
| ✅ | ✅ | - | ❌ | Level 1 |
| ✅ | ✅ | ❌ | ✅ | Level 1 |
| ✅ | ✅ | ✅ | ❌ | Level 1 |
| ✅ | ✅ | ✅ | ✅ | **Level 2** ✅ |

**Key Takeaway**: Level 2 is ONLY visible when ALL four conditions are met:
1. Sarah completed ✅
2. Akash completed ✅
3. Sarah consented ✅
4. Akash consented ✅

Missing ANY ONE of these → Level 1 only!
