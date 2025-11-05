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
- ✅ Password must NOT be commonly used English words (**TODO: Add common words validation**)
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
- ❌ **Missing**: View who has viewed your profile (data exists in `profile_views` table)
- ❌ **Missing**: View who has liked you (data exists in `likes` table)
- ❌ **Missing**: Public "fame rating" calculation and display
- ❌ **Missing**: GPS positioning down to neighborhood level
  - Must implement fallback geolocation if user opts out
  - Allow manual GPS location adjustment in profile
- ✅ Ability to modify profile information, name, and email

#### 3. Browsing (Suggested Matches)
- ❌ **NOT IMPLEMENTED**
- Must show list of suggested profiles matching user's sexual preferences
- Handle heterosexual, homosexual, and bisexual matching (default to bisexual if not specified)
- Intelligent matching based on:
  - Geographical proximity
  - Number of shared interest tags
  - Fame rating
- Priority given to users in same geographical area
- Must be sortable by: age, location, fame rating, common tags
- Must be filterable by: age, location, fame rating, common tags

#### 4. Research (Advanced Search)
- ❌ **NOT IMPLEMENTED**
- Search by one or multiple criteria:
  - Age range
  - Fame rating range
  - Location
  - One or multiple interest tags
- Results must be sortable and filterable (same as browsing)

#### 5. Profile View (Other Users)
- ❌ **NOT IMPLEMENTED**
- View other users' profiles (all info except email/password)
- ❌ Record profile view in visit history (table exists: `profile_views`)
- Required actions on profile:
  - ❌ **Like** user's profile picture (mutual likes = "connected" = can chat)
    - Cannot like without having own profile picture
  - ❌ **Unlike** user (prevents notifications, disables chat)
  - ❌ Check user's fame rating
  - ❌ See if user is currently online (need to track online status)
  - ❌ See last connection time if offline (need `last_time_active` tracking)
  - ❌ **Report** user as fake account (table exists: `reports`)
  - ❌ **Block** user (table exists: `blocks`)
    - Blocked users don't appear in search/suggestions
    - No notifications from blocked users
    - Chat disabled with blocked users
- Must show if viewed profile has liked you or if you're already connected
- Option to unlike/disconnect from profile

#### 6. Chat
- ❌ **NOT IMPLEMENTED**
- Real-time chat between connected users (mutually liked)
- **Maximum 10 second delay** for message delivery
- Must see notification of new messages from any page
- Database schema exists (`chats`, `messages` tables)

#### 7. Notifications
- ❌ **NOT IMPLEMENTED**
- Real-time notifications (**maximum 10 second delay**) for:
  - Receiving a like
  - Profile being viewed
  - Receiving a message
  - Mutual like (match)
  - Being unliked by connected user
- Must see unread notifications indicator from any page
- Database schema exists (`notifications` table)

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