# Chat System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │ MessagesTab  │    │ChatConversation│   │  HomeTab     │             │
│  │              │    │                │   │  (Matches)   │             │
│  │ - List convos│───▶│ - Real-time   │◀──│ - Send Msg   │             │
│  │ - Unread     │    │ - Typing      │   │ - Create     │             │
│  │ - Search     │    │ - Read rcpt   │   │   convo      │             │
│  └──────┬───────┘    └───────┬────────┘   └──────────────┘             │
│         │                    │                                          │
│         │                    │                                          │
│  ┌──────▼────────────────────▼──────────────────────────────┐          │
│  │              API Service (api.js)                         │          │
│  │  - chatAPI.getConversations()                            │          │
│  │  - chatAPI.createConversation()                          │          │
│  │  - chatAPI.getMessages()                                 │          │
│  │  - chatAPI.sendMessage()                                 │          │
│  │  - chatAPI.markAsRead()                                  │          │
│  └───────────────────────────┬──────────────────────────────┘          │
│                              │                                          │
│  ┌───────────────────────────▼──────────────────────────────┐          │
│  │           Socket.IO Client (socket.js)                    │          │
│  │  - connect(token)           ┌──────────────────┐         │          │
│  │  - onNewMessage()           │ Events Listened: │         │          │
│  │  - startTyping()            │  • new_message   │         │          │
│  │  - stopTyping()             │  • user_typing   │         │          │
│  │  - markMessagesAsRead()     │  • messages_read │         │          │
│  └───────────────────────────┬┴──────────────────┴─────────┘          │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
                               │ WebSocket (Socket.IO)
                               │ + REST API (HTTP)
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │              server.js (Main Entry)                       │          │
│  │  - Express App                                            │          │
│  │  - Socket.IO Server                                       │          │
│  │  - JWT Auth Middleware                                    │          │
│  └───────┬──────────────────────────┬───────────────────────┘          │
│          │                          │                                   │
│          │                          │                                   │
│  ┌───────▼──────────┐      ┌───────▼──────────────────┐               │
│  │  Socket Handlers │      │   API Routes             │               │
│  │  (socket.js)     │      │   (chat.js)              │               │
│  │                  │      │                          │               │
│  │ Events:          │      │ Endpoints:               │               │
│  │ • join_convo     │      │ GET  /conversations      │               │
│  │ • typing_start   │      │ POST /conversations      │               │
│  │ • typing_stop    │      │ GET  /conversations/:id/ │               │
│  │ • message_read   │      │      messages            │               │
│  │                  │      │ POST /conversations/:id/ │               │
│  │ Emits:           │      │      messages            │               │
│  │ • new_message    │      │ PUT  /conversations/:id/ │               │
│  │ • user_typing    │      │      read                │               │
│  │ • messages_read  │      │                          │               │
│  └──────────────────┘      └────────┬─────────────────┘               │
│                                     │                                   │
│                                     │                                   │
│  ┌──────────────────────────────────▼──────────────────────┐          │
│  │              Middleware (auth.js)                        │          │
│  │  - Verify JWT Token                                      │          │
│  │  - Extract userId from token                             │          │
│  │  - Protect all routes                                    │          │
│  └──────────────────────────────────┬───────────────────────┘          │
│                                     │                                   │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │
                                      │ SQL Queries
                                      │
┌─────────────────────────────────────▼───────────────────────────────────┐
│                          DATABASE (MySQL)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐    ┌─────────────────────┐                    │
│  │    users            │    │  user_actions       │                    │
│  │  (existing)         │    │  (existing)         │                    │
│  │                     │    │                     │                    │
│  │ • id                │    │ • user_id           │                    │
│  │ • email             │    │ • target_user_id    │                    │
│  │ • first_name        │    │ • action_type       │                    │
│  │ • profile_pic_url   │    │   (like/skip)       │                    │
│  │ • ...               │    │                     │                    │
│  └──────┬──────────────┘    └──────┬──────────────┘                    │
│         │                          │                                    │
│         │                          │                                    │
│  ┌──────▼──────────────────────────▼──────────────┐                    │
│  │           conversations (NEW)                   │                    │
│  │  • id                                           │                    │
│  │  • user1_id ─────┐                              │                    │
│  │  • user2_id      │ (Foreign Keys to users.id)   │                    │
│  │  • created_at    │                              │                    │
│  │  • updated_at    └──────────────┐               │                    │
│  │  UNIQUE (user1_id, user2_id)    │               │                    │
│  │  CHECK (user1_id < user2_id)    │               │                    │
│  └──────────────┬──────────────────┼───────────────┘                    │
│                 │                  │                                    │
│                 │                  │                                    │
│  ┌──────────────▼──────────────────┘                                    │
│  │           messages (NEW)                        │                    │
│  │  • id                                           │                    │
│  │  • conversation_id ──┐                          │                    │
│  │  • sender_id ────────┼─ (Foreign Keys)          │                    │
│  │  • message_type      │  (CASCADE DELETE)        │                    │
│  │  • content           │                          │                    │
│  │  • voice_duration    │                          │                    │
│  │  • is_read           │                          │                    │
│  │  • created_at        │                          │                    │
│  └──────────────────────┘                          │                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────┐                    │
│  │     user_conversations (VIEW - NEW)             │                    │
│  │  - Joins conversations with messages            │                    │
│  │  - Shows last message per conversation          │                    │
│  │  - Calculates unread counts                     │                    │
│  └─────────────────────────────────────────────────┘                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════
                           MESSAGE FLOW DIAGRAM
════════════════════════════════════════════════════════════════════════════

User A (Browser 1)                                    User B (Browser 2)
─────────────────                                     ─────────────────

1. Types "Hello"
   │
   ├──── Socket.emit("typing_start") ─────────────────▶ Sees "typing..."
   │
2. Sends message
   │
   ├──── POST /api/chat/conversations/1/messages
   │     Request: { type: "text", content: "Hello" }
   │
   │     Backend:
   │     ├─ Verify JWT
   │     ├─ Check user is in conversation
   │     ├─ Insert into messages table
   │     ├─ Update conversation.updated_at
   │     └─ Socket.emit("new_message") ─────────────────▶ Message appears!
   │                                                      │
   │                                                      └─ Auto-scroll
   │                                                      │
   │                                                      └─ API: Mark as read
   │                                                         │
   │ ◀──── Socket.emit("messages_read") ────────────────────┘
   │
3. See blue checkmark (read receipt)


════════════════════════════════════════════════════════════════════════════
                        AUTHENTICATION FLOW
════════════════════════════════════════════════════════════════════════════

Login ──▶ JWT Token ──▶ localStorage
                         │
                         ├──▶ API Requests (Authorization: Bearer <token>)
                         │    └─ Backend extracts userId from token
                         │
                         └──▶ Socket.IO Connect (auth: { token })
                              └─ Backend verifies token on handshake


════════════════════════════════════════════════════════════════════════════
                         SECURITY LAYERS
════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: JWT Authentication                                         │
│  ✓ All API endpoints require valid JWT                             │
│  ✓ Socket.IO connection requires JWT                               │
│  ✓ Token verified on every request                                 │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 2: User Authorization                                        │
│  ✓ Check if users are mutually matched                            │
│  ✓ Verify user belongs to conversation                            │
│  ✓ userId extracted from JWT (never from client)                  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 3: Database Constraints                                      │
│  ✓ Foreign keys ensure data integrity                             │
│  ✓ Unique constraints prevent duplicates                          │
│  ✓ Cascade delete maintains consistency                           │
└─────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════
                      REAL-TIME EVENTS MAP
════════════════════════════════════════════════════════════════════════════

Client Events (Frontend → Backend)
───────────────────────────────────
join_conversation(conversationId)
  │
  └─▶ socket.join(`conversation:${conversationId}`)

typing_start({ conversationId, otherUserId })
  │
  └─▶ io.to(`user:${otherUserId}`).emit("user_typing", ...)

typing_stop({ conversationId, otherUserId })
  │
  └─▶ io.to(`user:${otherUserId}`).emit("user_typing", ...)

message_read({ conversationId, messageIds })
  │
  └─▶ Update database + emit to other user


Server Events (Backend → Frontend)
───────────────────────────────────
new_message({ conversationId, message })
  │
  └─▶ Append to messages array + scroll

user_typing({ conversationId, userId, isTyping })
  │
  └─▶ Show/hide "typing..." indicator

messages_read({ conversationId, messageIds })
  │
  └─▶ Update message.isRead = true (blue checkmark)


════════════════════════════════════════════════════════════════════════════
                          FILE ORGANIZATION
════════════════════════════════════════════════════════════════════════════

Backend:
├── server.js ........................... Main entry, Socket.IO server
├── config/
│   ├── db.js .......................... MySQL connection pool
│   └── socket.js ...................... Socket.IO event handlers
├── routes/
│   └── chat.js ........................ Chat API endpoints (5 routes)
├── middleware/
│   └── auth.js ........................ JWT authentication
└── migrations/
    ├── create-chat-tables.sql ......... Database schema
    └── run-chat-migration.js .......... Migration script

Frontend:
├── utils/
│   ├── api.js ......................... API client (added chatAPI)
│   └── socket.js ...................... Socket.IO client service
└── pages/
    ├── tabs/
    │   ├── MessagesTab.jsx ............ Conversation list
    │   └── ChatConversation.jsx ....... Chat screen
    └── onboarding/
        └── Home.jsx ................... Socket.IO initialization

Documentation:
├── CHAT_SYSTEM_DOCS.md ................ Complete technical docs
├── CHAT_QUICK_START.md ................ Quick setup guide
└── IMPLEMENTATION_SUMMARY.md .......... This summary
```
