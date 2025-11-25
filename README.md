<p>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io">
</p>

# 🍵 Matcha

> A modern full-stack dating web application built with TypeScript

Matcha is a feature-rich dating platform that connects people based on shared interests, location proximity, and compatibility. Built as a school project to explore full-stack development, real-time communication, and complex matching algorithms.

## 📱 User Interface

The application features a modern, responsive design that works seamlessly on both desktop and mobile devices, with full dark mode support.

### 🔐 Authentication

<table>
  <tr>
    <td width="50%">
      <img src="assets/sign-in.png" alt="Sign In" width="100%">
      <p align="center"><b>Sign In</b></p>
    </td>
    <td width="50%">
      <img src="assets/sign-up.png" alt="Sign Up" width="100%">
      <p align="center"><b>Sign Up with Email Verification</b></p>
    </td>
  </tr>
</table>

### 🏠 Dashboard

<table>
  <tr>
    <td width="50%">
      <img src="assets/dashboard-light.png" alt="Dashboard Light Mode" width="100%">
      <p align="center"><b>Dashboard - Light Mode</b></p>
    </td>
    <td width="50%">
      <img src="assets/dashboard-dark.png" alt="Dashboard Dark Mode" width="100%">
      <p align="center"><b>Dashboard - Dark Mode</b></p>
    </td>
  </tr>
</table>

### 🔍 Browse & Match

<table>
  <tr>
    <td width="50%">
      <img src="assets/browse-suggested.png" alt="Browse Suggested Users" width="100%">
      <p align="center"><b>Suggested Matches with Filters</b></p>
    </td>
    <td width="50%">
      <img src="assets/user-profile.png" alt="User Profile" width="100%">
      <p align="center"><b>User Profile View</b></p>
    </td>
  </tr>
</table>

### 💬 Chat & Activity

<table>
  <tr>
    <td width="50%">
      <img src="assets/chat-with-user.png" alt="Real-time Chat" width="100%">
      <p align="center"><b>Real-time Chat with Read Receipts</b></p>
    </td>
    <td width="50%">
      <img src="assets/activity-views.png" alt="Activity & Views" width="100%">
      <p align="center"><b>Activity Feed & Profile Views</b></p>
    </td>
  </tr>
</table>

### 📱 Mobile Responsive Design

<table>
  <tr>
    <td width="25%" align="center">
      <img src="assets/mobile-dashboard.png" alt="Mobile Dashboard" width="200">
      <p><b>Dashboard</b></p>
    </td>
    <td width="25%" align="center">
      <img src="assets/mobile-view-profile.png" alt="Mobile Profile" width="200">
      <p><b>Profile View</b></p>
    </td>
    <td width="25%" align="center">
      <img src="assets/mobile-chat.png" alt="Mobile Chat" width="200">
      <p><b>Chat</b></p>
    </td>
    <td width="25%" align="center">
      <img src="assets/mobile-activity.png" alt="Mobile Activity" width="200">
      <p><b>Activity</b></p>
    </td>
  </tr>
</table>

## ✨ Features

### 🔐 Authentication & Security
- Secure user registration with email verification
- JWT-based authentication with refresh token rotation
- Password reset functionality via email
- Password strength validation (rejects common English words)
- Protected against SQL injection, XSS, and unauthorized file uploads

### 👤 User Profiles
- Complete profile management (bio, gender, sexual preferences, interests)
- Up to 6 photo uploads with automatic image processing and validation
- GPS-based geolocation with IP fallback
- Public "fame rating" system based on profile completeness and activity
- Interest tags for better matching (#vegan, #geek, #piercing, etc.)

### 🔍 Smart Matching & Discovery

#### Suggested Users (Browse Page)
The application intelligently suggests compatible matches based on multiple factors:

**Matching Algorithm Weights:**
- **Geographic Proximity (60%)** - Uses Haversine formula to calculate distance between users
- **Shared Interests (25%)** - Number of common interest tags
- **Fame Rating (15%)** - User popularity and profile quality

**Sexual Orientation Compatibility:**
- Heterosexual users see only opposite gender
- Homosexual users see only same gender
- Bisexual users see all genders
- Users without specified orientation are treated as bisexual by default

**Features:**
- Advanced search with multiple filters (age, location, fame rating, interests)
- Sortable results by age, fame rating, or shared interests
- Infinite scroll pagination for smooth browsing
- Automatically excludes blocked users

#### Fame Rating System
Each user has a public "fame rating" (0-100) calculated based on:

**Formula Breakdown:**

| Component | Max Points | Details |
|-----------|------------|---------|
| **Profile Completeness** | 20 | Full profile with bio, photos, and interests |
| **Popularity** | 60 | • Likes received: 3 pts/like (max 35)<br>• Profile views: 1.5 pts/view (max 20)<br>• Matches: 1 pt/match (max 5) |
| **Quality & Longevity** | 20 | • Like-to-view ratio (max 15)<br>• Account age bonus (max 5) |

**Total:** Up to 100 points

Higher fame rating = more visibility in suggested matches and search results

### 💬 Real-time Chat
- Instant messaging between matched users (mutual likes)
- WebSocket-based real-time delivery (<10 seconds)
- Unread message indicators
- Read receipts with automatic marking
- Optimistic UI updates for smooth UX

### 🔔 Live Notifications
- Real-time notifications for:
  - Receiving likes
  - Profile views
  - New messages
  - Mutual matches (with confetti animation!)
  - Unlikes from connected users
- Toast notifications for all events
- Persistent notification history

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS 11 (TypeScript)
- **Database**: PostgreSQL (raw SQL queries, no ORM per project requirements)
- **Cache/Sessions**: Redis
- **Real-time**: Socket.IO for WebSocket communication
- **Authentication**: JWT with bcrypt password hashing
- **Email**: SendGrid for transactional emails
- **Image Processing**: Sharp for upload validation and optimization

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router v7
- **State Management**:
  - React Context (Auth, Chat, Theme)
  - TanStack Query v5 (server state)
- **Styling**: Tailwind CSS v4 (custom "Minty Fresh" theme)
- **UI Components**: Radix UI primitives (shadcn/ui pattern)
- **Real-time**: Socket.IO client
- **Forms**: React Hook Form + Zod validation

### Infrastructure
- **Containerization**: Docker Compose
- **Services**: Frontend, Backend, PostgreSQL, Redis
- **Development**: Hot reload enabled for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (optional, for local development)

### 1. Clone the repository
```bash
git clone <repository-url>
cd matcha
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials
- JWT secrets (generate with `openssl rand -hex 32`)
- SendGrid API key and sender email
- Redis password

### 3. Start all services
```bash
./run.sh start
```

This will:
- Build and start all Docker containers
- Initialize the database schema
- Automatically seed 500 user profiles with photos
- Start the backend on `http://localhost:3000`
- Start the frontend on `http://localhost:5173`

### 4. Access the application
Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

The seed script creates 500 test users. You can register a new account or check the backend logs for development account credentials.

## 🧑‍💻 Development

### Docker Commands
```bash
./run.sh start          # Start all services
./run.sh stop           # Stop all services
./run.sh restart        # Rebuild and restart
./run.sh clear          # Clear volumes and restart (⚠️ deletes database)
./run.sh logs [service] # View logs
```

### Backend Development
```bash
cd backend
npm install
npm run start:dev       # Development with hot reload
npm run test            # Run tests
npm run lint            # ESLint check
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev            # Development with hot reload
npm run build          # Production build
npm run lint           # ESLint check
```

## 📁 Project Structure

```
matcha/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # JWT authentication
│   │   ├── users/       # User management & photos
│   │   ├── chat/        # Chat rooms
│   │   ├── messages/    # Messages CRUD
│   │   ├── notifications/ # Notification system
│   │   ├── interests/   # Interest tags
│   │   ├── event/       # WebSocket gateway
│   │   ├── database/    # PostgreSQL pool wrapper
│   │   ├── redis/       # Redis client
│   │   └── common/      # Shared utilities
│   └── script/
│       └── seed.ts      # Database seeding script
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts
│   │   ├── api/         # API client modules
│   │   ├── hooks/       # Custom React hooks
│   │   └── types/       # TypeScript types
├── db/
│   └── init/
│       └── init.sql     # Database schema
├── compose.yaml         # Docker Compose config
├── run.sh               # Convenience script
└── .env.example         # Environment template
```

## 🗄 Database Schema

The application uses PostgreSQL with 10 main tables:

- **users** - User accounts and profiles
- **user_photos** - Photo storage (up to 6 per user)
- **interests** - Global interest tags
- **user_interests** - Many-to-many relationship
- **likes** - User likes (mutual = match)
- **profile_views** - View history
- **blocks** - Blocked users
- **reports** - Fake account reports
- **chats** - Chat rooms between matched users
- **messages** - Chat messages
- **notifications** - Notification history

Schema location: [db/init/init.sql](db/init/init.sql)

## 🏗 Architecture

### Backend (Layered Architecture)
```
Controllers → Services → Repositories → PostgreSQL
```

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and orchestration
- **Repositories**: Data access layer with raw SQL queries
- **Guards**: JWT authentication and email verification

### Frontend (Component-Based)
```
Pages → Components → API Client → Backend
         ↓
      Contexts (Global State)
         ↓
   TanStack Query (Server State)
```

### Real-time Communication
- Socket.IO server in backend with JWT authentication
- User-specific rooms for targeted message delivery
- 30-second ping interval for "last active" status
- Events: `sendMessage`, `readMessages`, `like`, `unlike`, `match`, `view`

### Authentication Flow
1. JWT access tokens (short-lived, localStorage)
2. Refresh tokens (long-lived, httpOnly cookies)
3. Automatic refresh 1 minute before expiry
4. 401 errors trigger token refresh with request retry

## 🔒 Security

- ✅ Passwords hashed with bcrypt (no plain-text storage)
- ✅ SQL injection prevention (parameterized queries only)
- ✅ XSS protection (React auto-escaping, sanitized outputs)
- ✅ File upload validation (MIME type + magic bytes verification)
- ✅ CORS configured for trusted origins
- ✅ Form validation on both client and server
- ✅ httpOnly cookies for refresh tokens
- ✅ JWT token expiration and rotation

## 📝 Project Requirements

This project was built according to the "Matcha" school assignment specifications:

### Key Constraints
- **No ORM allowed** - All database queries written as raw SQL
- **500+ user profiles** - Seed script generates 500 users automatically
- **Real-time delivery <10 seconds** - Currently delivers instantly via WebSocket
- **Security-first approach** - Comprehensive protection against common vulnerabilities
- **Mobile-responsive** - Fully functional on small screens

### Core Features Implemented
- ✅ Registration with email verification
- ✅ Complete user profile management
- ✅ Smart matching algorithm
- ✅ Advanced search and filtering
- ✅ Like/unlike functionality
- ✅ Real-time chat for matched users
- ✅ Real-time notifications
- ✅ GPS-based geolocation with fallback

## 👥 Team

This project was built by a team of two developers:

<table>
  <tr>
    <td align="center" width="50%" valign="top">
      <img src="https://github.com/oprosvir.png" width="100"><br>
      <b>Olga Prosviriakova</b><br>
      <a href="https://github.com/oprosvir">@oprosvir</a><br>
      <br>
      <sub>UI/UX Design & Theming • Photo Management<br>Profile & Activity System • Location & Maps<br>Fame Rating • Security & Validation<br>Interests • Block/Report • Documentation</sub>
    </td>
    <td align="center" width="50%" valign="top">
      <img src="https://github.com/ismaelmehdid.png" width="100"><br>
      <b>Ismaël Mehdid</b><br>
      <a href="https://github.com/ismaelmehdid">@ismaelmehdid</a><br>
      <br>
      <sub>Core Architecture & API Design<br>Docker Configuration • Authentication<br>Real-time Chat & WebSocket • Notifications<br>Browse Page & Matching • Database Seeding</sub>
    </td>
  </tr>
</table>

## 🤝 Contributing

This is a school project and is not open for contributions. However, feel free to fork and experiment!

## 📄 License

**This project was created for educational purposes as part of a school curriculum.**
