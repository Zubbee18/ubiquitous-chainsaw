# Profiles API - Stage One

Node.js Express API for profile management with GitHub OAuth authentication, natural language search, and CLI tool. Integrates Genderize.io, Agify.io, and Nationalize.io APIs with PostgreSQL storage.

## Production Links

**API:** https://ubiquitous-chainsaw-production-5f71.up.railway.app  
**Web Portal:** https://insighta-web-portal-production.up.railway.app

## Table of Contents

- [System Architecture](#system-architecture)
- [Authentication Flow](#authentication-flow)
- [Token Handling](#token-handling)
- [Role Enforcement](#role-enforcement)
- [Natural Language Parsing](#natural-language-parsing)
- [CLI Usage](#cli-usage)
- [API Endpoints](#api-endpoints)
- [Setup](#setup)

## System Architecture

**Stack:** Express.js → PostgreSQL + Redis → External APIs (Genderize, Agify, Nationalize, GitHub OAuth, REST Countries)

**Layers:**

- **Client**: Web Portal (browser) + CLI Tool (Node.js)
- **Middleware**: CORS, Session (Redis), JWT Authentication, Admin Check
- **Routes**: `/auth`, `/api/profiles`, `/api/users`, `/api/classify`
- **Data**: PostgreSQL (profiles, users), Redis (sessions, token blacklist)

## Authentication Flow

**GitHub OAuth 2.0 with PKCE:**

1. **Web Portal:** User clicks login → Redirect to GitHub → GitHub callback → Backend sets HTTP-only cookies (access_token 3min, refresh_token 5min) → Redirect to dashboard
2. **CLI:** `insighta login` → Opens browser → GitHub callback → CLI captures code → POST to backend with PKCE verifier → Receive tokens in JSON → Store in `~/.insighta/credentials.json`

**Security:**

- PKCE prevents code interception attacks
- State parameter prevents CSRF
- HTTP-only cookies prevent XSS
- Token blacklisting in Redis prevents reuse

## Token Handling

**Dual Token Strategy (JWT):**

| Token   | Lifetime | Storage          | Purpose            |
| ------- | -------- | ---------------- | ------------------ |
| Access  | 3 min    | HTTP-only cookie | API authentication |
| Refresh | 5 min    | HTTP-only cookie | Token renewal      |

**Auto-Refresh Flow:**

1. Middleware detects expired access token
2. Checks refresh token validity (not blacklisted)
3. Blacklists old tokens in Redis
4. Issues new access + refresh tokens
5. Continues request seamlessly

**Implementation:** `middlewares/authenticate.js` verifies JWT, handles refresh logic, attaches `req.user`

## Role Enforcement

**RBAC System:**

- **user** (default): View/create profiles
- **admin**: Full access including user management, deletion

**Database:** Role stored in `users.role` column (VARCHAR, default 'user')

**Middleware:** `middlewares/adminAccess.js` checks `req.user.role === 'admin'`, returns 403 if unauthorized

**Protected Endpoints:** DELETE `/api/users/:id`, GET `/api/users/` (admin only)

## Natural Language Parsing

**Rule-based parsing (no AI/LLMs):**

**Supported Keywords:**

- Gender: male/males, female/females
- Age Groups: child/children, teenager/teenagers, adult/adults, senior/seniors
- Age Ranges: young (16-24), above/over X, below/under X
- Countries: Any name (resolved via REST Countries API)

**Logic:** (`models/retrieveProfileData.js`)

1. Convert query to lowercase
2. Extract gender (if both male+female mentioned, skip filter)
3. Extract country name → REST Countries API → ISO code
4. Extract age group (priority: senior > teenager > adult > child)
5. Extract age ranges via regex: `/(?:above|over)\s+(\d+)/`
6. Build SQL WHERE clause (all conditions AND)

**Example:** "adult males from kenya" → `WHERE gender='male' AND age_group='adult' AND country_id='KE'`

**Limitations:** Fixed keywords only, no synonyms, AND logic only, single age group per query

## CLI Usage

**Installation:**

```bash
cd cli-tool && npm install && npm link
```

**Commands:**

```bash
# Authentication
insighta login                              # OAuth login
insighta whoami                             # Current user
insighta logout                             # Clear credentials

# Profile Management
insighta get-profiles                       # List all (paginated)
insighta get-profiles --gender male --page 2
insighta search-profiles "adult males from kenya"
insighta get-profiles-by-id <UUID>
insighta create-profiles --name John
insighta export-profiles --format csv --gender female
```

**Features:** Auto token refresh, beautiful tables (cli-table3), loading spinners, credentials in `~/.insighta/credentials.json`

## API Endpoints

### POST `/api/profiles`

Create profile from name (requires auth)

```json
{ "name": "John" }
```

Returns: Profile with gender, age, country predictions

### GET `/api/profiles/search?q=<query>`

Natural language search

```
/api/profiles/search?q=adult males from kenya
```

Returns: Paginated results

### GET `/api/profiles?gender=male&country_id=NG`

Structured query filters: gender, country_id, age_group, min_age, max_age, min_gender_probability, sort_by, order, page, limit

### GET `/api/profiles/:id`

Get single profile by UUID

### DELETE `/api/profiles/:id`

Delete profile (admin only)

### GET `/api/classify?name=John`

Legacy Stage Zero endpoint - simple gender classification

### Auth Endpoints

- GET `/auth/github` - Web OAuth start
- GET `/auth/github/callback` - Web OAuth callback
- POST `/auth/github/cli/callback` - CLI OAuth (body: {code, code_verifier})

### User Endpoints (Admin Only)

- GET `/api/users` - List all users
- DELETE `/api/users/:id` - Delete user

## Setup

**Prerequisites:** Node.js 16+, PostgreSQL 12+, Redis, GitHub OAuth App

**Environment (.env):**

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/profiles_db
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost:3000/auth/github/callback
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:5500
```

**Run:**

```bash
npm install
redis-server &                    # Start Redis
npm start                         # Start API server
```

**Database:** Tables auto-created on startup (`profiles`, `users`)

**GitHub OAuth Setup:**

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Callback URL: `http://localhost:3000/auth/github/callback`
3. Copy Client ID/Secret to .env

**Deployment:** Railway-ready (`railway.toml`, `nixpacks.toml` included)

---

**Tech Stack:** Node.js, Express, PostgreSQL, Redis, JWT, Axios, GitHub OAuth, UUID v7  
**External APIs:** Genderize.io, Agify.io, Nationalize.io, REST Countries  
**CLI:** Commander, Axios, cli-table3, Ora spinner, Open (browser launch)
