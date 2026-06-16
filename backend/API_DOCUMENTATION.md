# TalkAI Backend API Documentation

## Base URL
`http://localhost:3000`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Sign Up
**POST** `/api/auth/signup`

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "profilePicture": null,
    "bio": null
  }
}
```

### 2. Login
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:** Same as Sign Up

---

## 👤 User Profile Endpoints

### 3. Get Profile
**GET** `/api/user/profile`
- **Auth Required:** ✅

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "profilePicture": "/uploads/profiles/profile-123456.jpg",
    "bio": "Hello, I'm John!",
    "createdAt": "2026-01-17T10:00:00.000Z"
  }
}
```

### 4. Update Profile
**PUT** `/api/user/profile`
- **Auth Required:** ✅

**Body:**
```json
{
  "username": "new_username",
  "bio": "Updated bio"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

### 5. Upload Profile Picture
**POST** `/api/user/profile/picture`
- **Auth Required:** ✅
- **Content-Type:** `multipart/form-data`

**Form Data:**
- `profilePicture`: Image file (jpeg, jpg, png, gif, webp, max 5MB)

**Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "user": { /* user with updated profilePicture */ }
}
```

### 6. Delete Profile Picture
**DELETE** `/api/user/profile/picture`
- **Auth Required:** ✅

**Response:**
```json
{
  "message": "Profile picture deleted successfully",
  "user": { /* user with profilePicture set to null */ }
}
```

---

## 💬 Chat Management Endpoints

### 7. Get All Chats
**GET** `/api/chats`
- **Auth Required:** ✅

**Response:**
```json
{
  "chats": [
    {
      "id": "chat-uuid",
      "title": "My First Chat",
      "userId": "user-uuid",
      "createdAt": "2026-01-17T10:00:00.000Z",
      "updatedAt": "2026-01-17T11:00:00.000Z",
      "messages": [
        { /* first message preview */ }
      ],
      "_count": {
        "messages": 10
      }
    }
  ]
}
```

### 8. Get Single Chat
**GET** `/api/chats/:chatId`
- **Auth Required:** ✅

**Response:**
```json
{
  "chat": {
    "id": "chat-uuid",
    "title": "My Chat",
    "userId": "user-uuid",
    "createdAt": "2026-01-17T10:00:00.000Z",
    "updatedAt": "2026-01-17T11:00:00.000Z",
    "messages": [
      {
        "id": "msg-uuid",
        "chatId": "chat-uuid",
        "role": "user",
        "content": "Hello AI!",
        "createdAt": "2026-01-17T10:00:00.000Z"
      },
      {
        "id": "msg-uuid-2",
        "chatId": "chat-uuid",
        "role": "assistant",
        "content": "Hi! How can I help?",
        "createdAt": "2026-01-17T10:00:05.000Z"
      }
    ]
  }
}
```

### 9. Create New Chat
**POST** `/api/chats`
- **Auth Required:** ✅

**Body:**
```json
{
  "title": "New Conversation"
}
```

**Response:**
```json
{
  "message": "Chat created successfully",
  "chat": { /* new chat object */ }
}
```

### 10. Update Chat Title
**PUT** `/api/chats/:chatId`
- **Auth Required:** ✅

**Body:**
```json
{
  "title": "Updated Chat Title"
}
```

### 11. Delete Chat
**DELETE** `/api/chats/:chatId`
- **Auth Required:** ✅

**Response:**
```json
{
  "message": "Chat deleted successfully"
}
```

### 12. Add Message to Chat
**POST** `/api/chats/:chatId/messages`
- **Auth Required:** ✅

**Body:**
```json
{
  "role": "user",
  "content": "Hello, this is my message"
}
```

**Response:**
```json
{
  "message": "Message added successfully",
  "data": { /* message object */ }
}
```

---

## 🤖 AI Endpoints

### 13. Send Message to AI (Non-Streaming)
**POST** `/api/ai/chat/:chatId`
- **Auth Required:** ✅

**Body:**
```json
{
  "message": "What is the weather like?"
}
```

**Response:**
```json
{
  "userMessage": {
    "id": "msg-uuid",
    "chatId": "chat-uuid",
    "role": "user",
    "content": "What is the weather like?",
    "createdAt": "2026-01-17T10:00:00.000Z"
  },
  "aiMessage": {
    "id": "msg-uuid-2",
    "chatId": "chat-uuid",
    "role": "assistant",
    "content": "I don't have access to real-time weather...",
    "createdAt": "2026-01-17T10:00:05.000Z"
  }
}
```

### 14. Send Message to AI (Streaming)
**POST** `/api/ai/chat/:chatId/stream`
- **Auth Required:** ✅
- **Response Type:** Server-Sent Events (SSE)

**Body:**
```json
{
  "message": "Tell me a story"
}
```

**Response Stream:**
```
data: {"text":"Once"}
data: {"text":" upon"}
data: {"text":" a"}
data: {"text":" time..."}
data: [DONE]
```

---

## 🔧 Legacy Endpoints (Still Active)

### 15. Get Stream Token (Old System)
**POST** `/token`

**Body:**
```json
{
  "userId": "user123",
  "name": "John Doe",
  "channelId": "channel123"
}
```

### 16. Old AI Reply (Old System)
**POST** `/ai-reply`

---

## 📝 Notes

1. **JWT Secret**: Add `JWT_SECRET` to your `.env` file
2. **Profile Pictures**: Stored in `backend/uploads/profiles/`
3. **Database**: SQLite database at `backend/prisma/dev.db`
4. **AI Model**: Using Gemini 2.0 Flash Experimental

---

## 🚀 How to Start Backend

```bash
cd backend
npm run start
```

Server runs on: `http://localhost:3000`
