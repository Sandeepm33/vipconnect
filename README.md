# VipConnect — WhatsApp-like Real-time Messaging App

## Features
- ✅ Real-time 1:1 and group chat
- ✅ Voice calls (1:1 and group)
- ✅ Video calls (1:1 and group) via WebRTC
- ✅ Share images, documents, audio files
- ✅ Set profile picture, about, name
- ✅ Create groups with group picture
- ✅ Typing indicators & read receipts
- ✅ Online/offline status & last seen
- ✅ Message reactions & reply
- ✅ PWA installable on mobile

## Tech Stack
- **Frontend**: Next.js 14, TailwindCSS, Zustand, Socket.io-client, WebRTC
- **Backend**: Node.js, Express, Socket.io, WebRTC signaling
- **Database**: MongoDB Atlas

## Setup & Run

### 1. Install Backend
```bash
cd backend
npm install
npm run dev
```
Server starts on http://localhost:5000

### 2. Install Frontend
```bash
cd frontend
npm install
npm run dev
```
App starts on http://localhost:3000

### 3. Open in Browser
Visit http://localhost:3000 → Register an account → Start chatting!

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Mobile
Open http://localhost:3000 on your phone (same WiFi) and install as PWA from browser menu.
