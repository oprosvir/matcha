# Matcha Dating App

Matcha is a full-stack TypeScript dating application with:
- **Backend**: NestJS 11 with PostgreSQL and Redis
- **Frontend**: React 19 + Vite with React Router v7
- **Database**: PostgreSQL with comprehensive schema for user profiles, matching, messaging, and notifications
- **Cache/Sessions**: Redis for token management and session data


## Project Requirements (from v5.1)

This is a school project to create a dating website that facilitates connections between potential partners, from registration to final meeting.

### Mandatory Features

#### 1. Registration and Sign-in
- ✅ User registration with email, username, first/last name, and secure password
- ✅ Password must NOT be commonly used English words (using `most-common-words-by-language` package)
- ✅ Email verification link sent after registration
- ✅ Login with username and password
- ✅ Password reset via email
- ✅ Logout from any page with single click

#### 2. User Profile
- ✅ Complete profile completion flow after login
- Required profile information:
  - ✅ Gender (male/female)
  - ✅ Sexual preferences (straight/gay/bisexual)
  - ✅ Biography
  - ✅ Interest tags (#vegan, #geek, #piercing, etc.) - reusable across users
  - ❌ **Up to 5 photos** with one as profile picture
- ✅ **Ability to modify first name, last name, and email**
- ✅ GPS positioning with fallback geolocation
  - ✅ GPS geolocation via browser API
  - ✅ IP-based fallback via ip-api.com
  - ✅ Manual location adjustment in profile
  - ⚠️ City-level accuracy only (not neighborhood-level)
- ❌ **Missing**: View who has viewed your profile (data exists in `profile_views` table, hook ready)
- ❌ **Missing**: View who has liked you (data exists in `likes` table)
- ❌ **Missing**: Public "fame rating" calculation and display (field exists, always 0)

#### 3. Browsing (Suggested Matches)
- ✅ **FULLY IMPLEMENTED** at `/browse` page with two tabs
- ✅ Shows suggested profiles matching user's sexual preferences
- ✅ Handles heterosexual, homosexual, and bisexual matching (defaults to bisexual if not specified)
- ✅ Complex mutual sexual orientation compatibility logic
- ✅ AI-powered intelligent matching algorithm:
  - ✅ Geographical proximity using Haversine formula (60% weight)
  - ✅ Number of shared interest tags (25% weight)
  - ✅ Fame rating (15% weight)
- ✅ Sortable by: age, fame rating, shared interests count
- ✅ Filterable by: age range, fame rating range, location, interest tags, first name
- ✅ Infinite scroll pagination with cursor-based loading
- ✅ Like/unlike buttons with optimistic UI updates
- ✅ Automatically excludes blocked users

#### 4. Research (Advanced Search)
- ✅ **FULLY IMPLEMENTED** (integrated in `/browse` page)
- ✅ Search by multiple criteria simultaneously:
  - ✅ Age range (min/max sliders)
  - ✅ Fame rating range (min/max sliders)
  - ✅ Location (dropdown with unique locations)
  - ✅ Multiple interest tags (multi-select)
  - ✅ First name (text search)
- ✅ Results sortable and filterable (same as browsing)
- ✅ Works in both "Browse All" and "Suggested" tabs

#### 5. Profile View (Other Users)
- ❌ **NOT IMPLEMENTED** (no dedicated profile page)
- ❌ Cannot view other users' full profiles
- ✅ Profile view tracking backend complete (POST/GET `/profile-views`)
- ✅ **Like/Unlike** functionality implemented:
  - ✅ Like buttons in browse tables (POST `/users/like`)
  - ✅ Unlike buttons in browse tables (POST `/users/unlike`)
  - ✅ Cannot like without own profile picture (backend validation)
  - ✅ Mutual likes create chat automatically
  - ✅ Real-time notifications for like/unlike/match
- ❌ No dedicated profile view UI
- ❌ Cannot see if user is online or last connection time
- ❌ **Report** functionality not implemented (table exists: `reports`)
- ❌ **Block** functionality not implemented (table exists: `blocks`, repository ready, no controller)

#### 6. Chat
- ✅ **FULLY IMPLEMENTED** at `/chat` page
- ✅ Real-time chat between connected users (mutually liked)
- ✅ **Instant delivery** via Socket.IO (**meets <10 second requirement**)
- ✅ Two-column layout: conversations list + active chat
- ✅ Unread message count with badges
- ✅ Read receipts via Intersection Observer
- ✅ Auto-scroll to latest message
- ✅ Optimistic UI updates
- ✅ Mobile-responsive design
- ✅ WebSocket with JWT authentication

#### 7. Notifications
- ✅ **FULLY IMPLEMENTED**
- ✅ Real-time notifications via Socket.IO (**instant delivery, meets <10 second requirement**):
  - ✅ Receiving a like
  - ✅ Profile being viewed
  - ✅ Receiving a message
  - ✅ Mutual like (match) with confetti animation
  - ✅ Being unliked by connected user
- ✅ Unread notification indicator in navbar bell icon (visible from any page)
- ✅ Toast notifications for all events
- ✅ Mark as read functionality
- ✅ WebSocket with room-based broadcasting

### Technical Requirements

- ✅ No errors, warnings, or notices (server-side and client-side)
- ✅ Micro-framework (NestJS qualifies - has router but no built-in ORM/validators)
- ✅ Relational database with manual queries (PostgreSQL with raw SQL)
- ❌ **Minimum 500 distinct user profiles** for evaluation (**TODO: Create seed data**)
- ✅ Web server choice is free (using built-in NestJS server)
- ❌ Compatible with latest Firefox and Chrome (**TODO: Test**)
- ❌ Well-structured layout: header, main, footer (**TODO: Implement**)
- ❌ Mobile-friendly responsive design (**TODO: Implement**)
- ✅ Form validation on all forms
- ✅ Security requirements:
  - ✅ No plain-text passwords (using bcrypt)
  - ✅ No HTML/JS injection (React auto-escapes, parameterized queries)
  - ❌ No unauthorized file uploads (**TODO: Add when implementing photo upload**)
  - ✅ No SQL injection (using parameterized queries)

### Bonus Features (Optional)
- ❌ OmniAuth strategies for authentication
- ❌ Personal photo gallery with drag-and-drop upload and basic editing
- ❌ Interactive map of users with precise GPS localization
- ❌ Video or audio chat for connected users
- ❌ Schedule and organize real-life dates/events

## Development Commands

### Docker/Container Management
```bash
./run.sh start          # Start all services (frontend, backend, db, redis)
./run.sh stop           # Stop all services
./run.sh restart        # Restart all services
./run.sh logs           # View logs for all services
./run.sh logs backend   # View logs for specific service
```

**Service URLs**:
- Frontend: http://localhost:5173
- Backend:  http://localhost:3000
- Database: http://localhost:5432
- Redis:    http://localhost:6380

### Backend Development (in backend/)
```bash
npm run start:dev       # Development with hot reload
npm run start:debug     # Debug mode with inspector
npm run build           # Production build
npm run test            # Run all tests
npm run test:watch      # Watch mode for tests
npm run test:e2e        # End-to-end tests
npm run lint            # ESLint check and auto-fix
npm run format          # Prettier format
```

### Frontend Development (in frontend/)
```bash
npm run dev            # Development with hot reload (Vite)
npm run build          # Production build (TypeScript + Vite)
npm run preview        # Preview production build
npm run lint           # ESLint check
```