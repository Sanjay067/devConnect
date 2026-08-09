# devConnect 🌐

A premium, developer-centric project-showcasing and social networking platform built for software engineers. Showcase your work, document technical features, connect with peers, rate projects, and collaborate — all from a beautifully crafted interface designed for developers.

---

## Key Features

1. Developer Feed & Project Showcases
*   **Rich Markdown Editor**: Block-based post editor with inline toolbar (bold, italic, code, headings, lists, blockquotes, code blocks, horizontal rules).
*   **Asset Pipeline**: Paste or drop images into the editor → automatic upload to Cloudinary `devConnect/temp` → temp-to-posts promotion on save via `cloudinary.uploader.rename()`.
*   **Interactive Tech Stack Badges**: Autocomplete suggestions triggered by `@` — render custom branded technology badges (React, Node.js, Docker, AWS, etc.) with Font Awesome icons.
*   **1–10 Star Rating System**: Users rate projects on a 1–10 scale. Ratings are toggleable (click same score to un-rate) and updateable. Self-rating is blocked.
*   **Like & Comment System**: Post/comment like toggles, multi-level threaded comments with nested replies, soft-delete support, and paginated replies.
*   **Feed Scoring Algorithm**: Personalised feed ranking via MongoDB aggregation pipeline combining:
    -   `log1p(totalPoints) × 3` — total rating points signal
    -   `averageRating × 2` — quality signal
    -   `log1p(commentCount) × 3` — discussion signal
    -   `1 / (1 + ageHours / 6)` — recency decay (6-hour half-life)
    -   `|userSkills ∩ techStack| × 5` — skill relevance match
    -   `+10` network boost — for followed authors


### 2. Developer-Centric Profile Page (Portfolio-First)
*   **Featured Projects Showcase**: Automatically pins your top-3 projects ranked by `totalPoints` (aggregate rating score).
*   **Profile Banner & Avatar**: Upload custom profile banners (1200×400 auto-crop) and avatars (400×400) via Cloudinary CDN.
*   **Technical Details Sidebar**: Organises credentials into current position, location, web presence (GitHub, LinkedIn, Portfolio), visual skills badges, and education timeline.
*   **Education & Work History**: Chronological timeline of schools, degrees, past companies, positions, and years.
*   **Follow Stats & Total Score**: Displays follower / following counts and an aggregated reputation score (`totalPoints` across all authored posts).

### 3. Network & Developer Discovery
*   **Spacious Discovery Grid**: A clean 3-column developer card layout browsable without sidebar clutter — paginated with infinite scroll.
*   **Recommended Developers**: Dynamically suggests profiles the user doesn't currently follow.
*   **Premium Developer Cards**: Online indicator, verification checkmarks, 2-line bios, technology stack tags with brand icons (Font Awesome 7), and quick connection metrics (followers, projects).


###
### 4. Secure Private Messaging (Real-Time)
*   **Socket.io WebSocket Layer**: Authenticated WebSocket connections with JWT cookie-based handshake middleware.
*   **Conversation List**: Paginated conversation threads with per-peer unread badge counts.
*   **Real-Time Message Delivery**: Messages broadcast to all sender + receiver tabs/devices via `getUserSockets()` multi-tab support.
*   **Message Deletion**: Sender-only deletion within a 15-minute window.
*   **Deep Link Connect**: "Message" button on any profile deep-links directly to the target user's pre-selected chat thread.

### 5. Notification System
*   **Follow Notifications**: Real-time notification when another developer follows you.
*   **Unread Badge Counter**: Navbar bell icon with live unread notification count.
*   **Mark All Read**: Bulk mark-as-read with automatic duplicate notification deduplication and 30-notification cap per user.

---
## 🔒 Security Architecture

| Layer | Implementation |
|---|---|
| **Authentication** | JWT access tokens (60 min) + refresh tokens (7 days) in `HttpOnly`, `Secure`, `SameSite` cookies |
| **Token Rotation** | Refresh tokens are SHA-256 hashed before storage — old tokens invalidated on rotation |
| **CSRF Protection** | Double-submit cookie: client reads `csrfToken` cookie → sends in `x-csrf-token` header → server validates with `crypto.timingSafeEqual` |
| **Origin Enforcement** | Non-safe HTTP methods require a trusted `Origin` header matching `CLIENT_ORIGIN` |
| **Rate Limiting** | Four tiers: General API (400/15min), Auth (40/15min), Upload (30/15min), Rating (60/15min) |
| **Headers** | Helmet.js (CSP, X-Content-Type-Options, etc.) with `cross-origin` resource policy |
| **Password Security** | bcrypt with 10 salt rounds, 12–128 character policy |
| **Auth Anomaly Monitor** | Server-side counter logs spikes of 401/403/429 responses every 25 events |

---

## 🛠 Technical Breakdown

### Frontend (`client/`)
| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack-compatible) |
| **Library** | React 19 |
| **State Management** | Redux Toolkit (Auth slice, session persistence) |
| **Data Fetching & Cache** | React Query (`@tanstack/react-query` v5) + Axios |
| **Real-Time** | Socket.io Client (`socket.io-client` v4) |
| **Styling** | Tailwind CSS 4 + PostCSS + Vanilla CSS custom tokens |
| **Typography** | JetBrains Mono (Google Fonts) |
| **Icons** | Font Awesome 7 (CDN) |
| **Image Handling** | `browser-image-compression` (HTML5 pre-upload compression) |
| **Routing Protection** | Next.js Middleware (cookie-based auth guard) |

### Backend (`server/`)
| Layer | Technology |
|---|---|
| **Framework** | Express 5 (Node.js, ES Modules) |
| **Database** | MongoDB (Mongoose 9 ODM) |
| **Authentication** | JWT Access/Refresh token rotation with SHA-256 hashed refresh tokens in HttpOnly cookies |
| **CSRF Protection** | Double-submit cookie pattern with `crypto.timingSafeEqual` validation |
| **Security** | Helmet headers, CORS with strict origin validation, `express-rate-limit` (API / Auth / Upload / Rating tiers) |
| **Real-Time** | Socket.io v4 (JWT-authenticated WebSocket with multi-tab user tracking) |
| **Media Storage** | Custom Cloudinary Multer storage engine (`devConnect/avatars`, `devConnect/banners`, `devConnect/posts`, `devConnect/temp`) |
| **Background Jobs** | Temp asset cleanup (6-hour interval), post score recomputation (on engagement events) |
| **Password Hashing** | bcrypt (10 salt rounds) |

### Database Models (MongoDB Collections)

| Model | Key Fields |
|---|---|
| **User** | `name`, `username` (unique, lowercase), `email` (unique, lowercase), `password` (bcrypt), `profilePicture`, `refreshToken` (SHA-256), `skills[]`, `interests[]` |
| **Profile** | `userId` (ref User, unique), `bannerPicture`, `headline`, `bio`, `location`, `socialLinks`, `skills[]`, `currentPosition`, `pastWork[]`, `education[]` |
| **Post** | `author` (ref User), `title`, `shortDescription`, `content` (Mixed — block-based), `media[]`, `links[]`, `techStack[]`, `likeCount`, `commentCount`, `totalPoints`, `averageRating`, `ratingCount`, `score` (precomputed), `isFeatured`, `isActive` |
| **Comment** | `postId`, `author`, `body`, `parentComment` (self-ref for threading), `replyCount`, `likeCount`, `isDeleted` (soft delete) |
| **Like** | `userId`, `targetId` (polymorphic), `targetType` (`"Post"` / `"Comment"`) — unique compound index |
| **Rating** | `userId`, `postId`, `score` (1–10) — unique per user per post |
| **Follow** | `followerId`, `followingId` — unique compound index |
| **Message** | `senderId`, `receiverId`, `body` (max 2000 chars), `readAt` |
| **Notification** | `recipientId`, `senderId`, `type` (`"FOLLOW"`), `isRead` |

---

## 📂 Project Structure

```
devConnect/
├── client/                             # Next.js 16 Frontend Application
│   ├── public/                         # Static assets (logo, favicons)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js              # Root HTML layout (JetBrains Mono, FA7)
│   │   │   ├── page.js                # Landing page (unauthenticated)
│   │   │   ├── providers.jsx          # Redux + React Query + Socket providers
│   │   │   ├── auth/                  # Login / Signup page
│   │   │   └── (dashboard)/           # Authenticated route group
│   │   │       ├── layout.jsx         # Dashboard shell (Navbar)
│   │   │       ├── feed/page.jsx      # Personalised feed
│   │   │       ├── network/page.jsx   # Developer discovery grid
│   │   │       ├── messages/page.jsx  # Messaging UI
│   │   │       ├── notifications/page.jsx  # Notification centre
│   │   │       ├── profile/
│   │   │       │   ├── page.jsx       # My profile
│   │   │       │   └── [userId]/page.jsx  # Public profile view
│   │   │       └── posts/
│   │   │           ├── page.jsx       # My posts management
│   │   │           ├── create/        # Post editor (create)
│   │   │           └── [postId]/      # Single post view / edit
│   │   ├── features/                  # Domain-specific feature modules
│   │   │   ├── auth/                  # Auth hooks & API
│   │   │   ├── feed/                  # Feed API, hooks, components
│   │   │   │   └── components/
│   │   │   │       ├── PostCard.jsx         # Feed post card
│   │   │   │       ├── PostEditor.jsx       # Block-based markdown editor
│   │   │   │       ├── MarkdownPreview.jsx  # Custom markdown renderer
│   │   │   │       ├── Comment.jsx          # Threaded comment tree
│   │   │   │       ├── RatingButton.jsx     # 1–10 star rating widget
│   │   │   │       ├── Like.jsx             # Like toggle button
│   │   │   │       ├── EditorToolbar.jsx    # Inline formatting toolbar
│   │   │   │       ├── CreatePostCard.jsx   # "Create post" CTA card
│   │   │   │       └── FeedWrapper.jsx      # Feed layout wrapper
│   │   │   ├── messages/              # Messaging hooks & components
│   │   │   │   └── components/
│   │   │   │       ├── MessagesLayout.jsx   # Split-pane chat layout
│   │   │   │       ├── ConversationList.jsx # Sidebar conversation list
│   │   │   │       ├── MessageList.jsx      # Message thread
│   │   │   │       ├── MessageBubble.jsx    # Individual message bubble
│   │   │   │       ├── MessageInput.jsx     # Chat input bar
│   │   │   │       ├── ChatHeader.jsx       # Chat window header
│   │   │   │       └── ChatUserProfileCard.jsx  # User info card
│   │   │   ├── network/               # Network hooks & components
│   │   │   │   └── components/
│   │   │   │       ├── DeveloperCard.jsx    # Developer profile card
│   │   │   │       ├── DeveloperGrid.jsx    # Responsive card grid
│   │   │   │       ├── RecommendedDevelopers.jsx  # "Who to follow"
│   │   │   │       ├── HeroSection.jsx      # Network page hero
│   │   │   │       └── EmptyState.jsx       # No results placeholder
│   │   │   └── profile/               # Profile hooks & components
│   │   │       └── components/
│   │   │           ├── ProfileLayout.jsx    # Profile page layout
│   │   │           ├── ProfileHeader.jsx    # Banner, avatar, stats
│   │   │           ├── ProfileSidebar.jsx   # Skills, links, education
│   │   │           ├── FeaturedProjects.jsx # Top-3 pinned projects
│   │   │           ├── EditProfileModal.jsx # Profile editor modal
│   │   │           ├── FollowListModal.jsx  # Followers/following modal
│   │   │           └── AllShowcases.jsx     # All user projects view
│   │   ├── services/                  # API service layer
│   │   │   ├── apiClient.js           # Axios instance (CSRF, token refresh, retry queue)
│   │   │   ├── authService.js         # Login, signup, logout, CSRF, profile
│   │   │   ├── feedService.js         # Personalised feed endpoint
│   │   │   ├── postService.js         # CRUD posts, comments, likes, ratings
│   │   │   ├── userService.js         # Profiles, avatars, banners, search
│   │   │   ├── followService.js       # Follow / unfollow
│   │   │   ├── messageService.js      # Conversations, send, delete
│   │   │   └── notificationService.js # Notifications, unread count
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── Navbar.jsx         # Global navigation bar with search
│   │   │   │   └── Loader.jsx         # Loading spinner
│   │   │   ├── context/
│   │   │   │   └── SocketContext.jsx  # Socket.io React context provider
│   │   │   ├── hooks/
│   │   │   │   └── useFollowSystem.js # Reusable follow/unfollow hook
│   │   │   └── lib/
│   │   │       ├── techIcons.js       # Tech → Font Awesome icon mapping
│   │   │       ├── socialLinks.js     # Social platform URL patterns
│   │   │       ├── cloudinary.js      # Cloudinary URL helpers
│   │   │       ├── compressImage.js   # Client-side image compression
│   │   │       ├── imageHelpers.js    # Image dimension utilities
│   │   │       └── axios.js           # Base Axios export
│   │   ├── store/
│   │   │   ├── index.js              # Redux store configuration
│   │   │   └── authSlice.js          # Auth state (user, checkAuth thunk)
│   │   ├── styles/
│   │   │   └── globals.css           # Global CSS + design tokens
│   │   └── middleware.js             # Next.js edge middleware (auth guard)
│   └── tests/
│       └── markdownParser.smoke.js   # Frontend markdown parser smoke tests
│
├── server/                            # Node.js Express API Backend
│   ├── src/
│   │   ├── app.js                    # Express entry (CORS, Helmet, CSRF, rate limits)
│   │   ├── config/
│   │   │   ├── cloudinary.js         # Cloudinary SDK + custom Multer storage engine
│   │   │   └── socket.js            # Socket.io server (JWT auth middleware, multi-tab tracking)
│   │   ├── middlewares/
│   │   │   ├── verifyAccessToken.middleware.js  # JWT access token verification
│   │   │   ├── csrf.middleware.js               # CSRF token issuing + validation
│   │   │   ├── rateLimits.js                    # Rate limiters (API, Auth, Upload, Rating)
│   │   │   ├── isPostAuthor.middleware.js       # Post ownership guard
│   │   │   └── isCommentAuthor.middleware.js    # Comment ownership guard
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.js          # Signup, login, logout (bcrypt, JWT, sessions)
│   │   │   │   ├── auth.routes.js              # POST /signup, /login, /logout, /refresh-token
│   │   │   │   └── authRefresh.controller.js   # Refresh token rotation (SHA-256 verification)
│   │   │   ├── user/
│   │   │   │   ├── users.model.js              # User schema
│   │   │   │   ├── profile.model.js            # Profile schema (education, work, social)
│   │   │   │   ├── user.controller.js          # Profile CRUD, avatar/banner upload, search
│   │   │   │   └── user.routes.js              # User & profile endpoints
│   │   │   ├── post/
│   │   │   │   ├── posts.model.js              # Post schema (ratings, score, media)
│   │   │   │   ├── posts.controller.js         # CRUD, temp→post asset promotion, feature toggle
│   │   │   │   ├── posts.routes.js             # Post endpoints (CRUD, like, rate, feature)
│   │   │   │   └── score.worker.js             # Background post score recomputation
│   │   │   ├── comment/
│   │   │   │   ├── comments.model.js           # Threaded comment schema
│   │   │   │   ├── comments.controller.js      # Add, reply, edit, soft-delete, paginated fetch
│   │   │   │   └── comments.routes.js          # Nested under /posts/:postId/comments
│   │   │   ├── like/
│   │   │   │   ├── likes.model.js              # Polymorphic like schema (Post/Comment)
│   │   │   │   └── likes.controller.js         # Toggle like with atomic counters
│   │   │   ├── rating/
│   │   │   │   ├── ratings.model.js            # 1–10 rating schema (unique per user/post)
│   │   │   │   └── ratings.controller.js       # Rate, update, toggle-off with atomic Post update
│   │   │   ├── feed/
│   │   │   │   ├── feed.controller.js          # Personalised feed aggregation pipeline
│   │   │   │   └── feed.routes.js              # GET /feed
│   │   │   ├── follow/
│   │   │   │   ├── follow.model.js             # Follow relationship schema
│   │   │   │   ├── follow.controller.js        # Follow/unfollow with notification upsert
│   │   │   │   └── follow.routes.js            # Follow endpoints
│   │   │   ├── message/
│   │   │   │   ├── messages.model.js           # Message schema (read receipts)
│   │   │   │   ├── message.controller.js       # Conversations, send, delete, unread count
│   │   │   │   └── message.routes.js           # Message endpoints
│   │   │   └── notification/
│   │   │       ├── notification.model.js       # Notification schema (FOLLOW type)
│   │   │       ├── notification.controller.js  # Fetch, unread count, mark-read, dedup
│   │   │       └── notification.routes.js      # Notification endpoints
│   │   ├── routes/
│   │   │   └── index.js              # Central API router (/api/*)
│   │   └── utils/
│   │       ├── asyncHandler.js       # Express async error wrapper
│   │       ├── cookieOptions.js      # Cookie config (dev/prod-aware Secure, SameSite)
│   │       ├── cloudinaryMarkdown.js # Extract & destroy Cloudinary assets from markdown
│   │       └── cleanupTempAssets.js  # Periodic temp Cloudinary folder purge (24h stale)
│   └── tests/
│       └── cloudinaryMarkdown.test.js  # Cloudinary public-ID extraction tests
│
├── CODE_OF_CONDUCT.md
├── LICENSE                            # MIT License
└── README.md
```

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/auth/csrf-token` | — | Issue a CSRF token (returned in cookie + body) |
| `POST` | `/auth/signup` | — | Register a new user |
| `POST` | `/auth/login` | — | Log in with email & password |
| `POST` | `/auth/logout` | — | Log out and clear all cookies |
| `POST` | `/auth/refresh-token` | Cookie | Rotate access + refresh tokens |

### Users & Profiles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/profiles/me` | Get current user's full profile |
| `PATCH` | `/users/profiles/me` | Update profile (bio, education, work, etc.) |
| `PATCH` | `/users/me` | Update account (name, email, username, skills) |
| `PATCH` | `/users/profiles/me/avatar` | Upload profile picture |
| `PATCH` | `/users/profiles/me/banner` | Upload banner image |
| `GET` | `/users/profiles` | Get all profiles (paginated, searchable by `?q=`) |
| `GET` | `/users/profile/:userId` | Get a public user's profile |
| `GET` | `/users/search` | Search users by name/username (`?q=`) |

### Posts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/posts` | Get all posts by current user |
| `POST` | `/posts` | Create a new post (multipart) |
| `GET` | `/posts/:postId` | Get a single post by ID |
| `PATCH` | `/posts/:postId` | Edit a post (author only) |
| `DELETE` | `/posts/:postId` | Delete a post and all related data |
| `GET` | `/posts/user/:userId` | Get all posts by a specific user |
| `POST` | `/posts/upload-asset` | Upload a temporary inline asset |
| `PATCH` | `/posts/:postId/feature` | Toggle pin/unpin as featured |
| `POST` | `/posts/:postId/like` | Toggle like on a post |
| `GET` | `/posts/:postId/like` | Get all likes on a post |
| `PATCH` | `/posts/:postId/rate` | Rate a post (1–10 scale) |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/posts/:postId/comments` | Get top-level comments (paginated) |
| `POST` | `/posts/:postId/comments` | Add a top-level comment |
| `PATCH` | `/posts/:postId/comments/:commentId` | Edit a comment (author only) |
| `DELETE` | `/posts/:postId/comments/:commentId` | Soft-delete a comment |
| `GET` | `/posts/:postId/comments/:commentId/replies` | Get replies to a comment |
| `POST` | `/posts/:postId/comments/:commentId/replies` | Reply to a comment |
| `POST` | `/posts/:postId/comments/:commentId/like` | Toggle like on a comment |

### Feed
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/feed` | Get personalised feed (paginated) |

### Follows
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/follows/:followingId` | Follow a user |
| `DELETE` | `/follows/:followingId` | Unfollow a user |
| `GET` | `/follows/:userId/followers` | Get a user's followers |
| `GET` | `/follows/:userId/following` | Get who a user follows |

### Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/messages/conversations` |List all conversations (paginated) |
| `GET` | `/messages/unread-count` | Get unread chat count |
| `GET` | `/messages/:peerId` | Get messages with a specific user |
| `POST` | `/messages/:peerId` | Send a message to a user |
| `DELETE` | `/messages/delete/:messageId` | Delete a sent message (≤15 min) |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | Get all notifications |
| `GET` | `/notifications/unread-count`  | Get unread notification count |
| `PATCH` | `/notifications/mark-read` | Mark all notifications as read |


---

## ⚙️ Get Started

### Prerequisites
*   Node.js v18+
*   MongoDB instance (local or Atlas)
*   Cloudinary account (API credentials)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Sanjay067/devConnect.git
    cd devConnect
    ```

2.  **Set up backend environment variables** — create `server/.env`:
    ```env
    PORT=5000
    MONGO_URL=your_mongodb_connection_string
    JWT_ACCESS_TOKEN=your_jwt_access_secret
    JWT_REFRESH_TOKEN=your_jwt_refresh_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    CLIENT_ORIGIN=http://localhost:3000
    NODE_ENV=development
    ```

3.  **Start the Backend:**
    ```bash
    cd server
    npm install
    npm run dev        # nodemon hot-reload on :5000
    ```

4.  **Start the Frontend:**
    ```bash
    cd client
    npm install
    npm run dev        # Next.js dev server on :3000
    ```

5.  **(Optional) Set the frontend API URL** — create `client/.env.local`:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ```

---

## 🧪 Testing

### Server Tests
Runs Cloudinary public-ID extraction unit tests:
```bash
cd server
npm test
```

### Client Tests
Runs markdown parser smoke tests:
```bash
cd client
npm run test:smoke
```

---

## 🏗 Architecture Highlights

*   **Monorepo**: Separate `client/` and `server/` packages — no workspace tooling required.
*   **ES Modules**: Both client and server use `"type": "module"` — native ESM imports throughout.
*   **Modular Backend**: Each domain (auth, user, post, comment, like, rating, follow, feed, message, notification) is a self-contained module with its own model, controller, and routes.
*   **Atomic Operations**: Mongoose sessions + transactions for multi-document writes (signup, post delete, like/comment counters).
*   **Background Workers**: Post score recomputation fires asynchronously (`updatePostScoreAsync`) after likes, comments, and ratings — never blocks the response.
*   **Temp Asset Lifecycle**: Inline images are uploaded to `devConnect/temp/` during editing, promoted to `devConnect/posts/` on save, and stale temps purged every 6 hours.
*   **Token Refresh Queue**: Client-side Axios interceptor queues concurrent 401-failed requests during token refresh — replays all on success.
*   **Multi-Tab WebSocket**: Server maps each `userId → Set<socketId>` — real-time events reach all open tabs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

**Copyright © 2026 Sanjay Kumar**
