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
- [Multi-Interface Support](#multi-interface-support)
- [Natural Language Parsing](#natural-language-parsing)
- [Rate Limiting](#rate-limiting)
- [Request Logging](#request-logging)
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

1. **Web Portal:** User clicks login → Redirect to GitHub → GitHub callback → Backend sets HTTP-only cookies (`access_token` 3 min, `refresh_token` 5 min) → Redirect to dashboard
2. **CLI:** `insighta login` → Opens browser → GitHub OAuth → CLI captures code → POST to `/auth/github/cli/callback` with PKCE verifier → Receive `access_token` + `refresh_token` in JSON → Stored in `~/.insighta/credentials.json`

**Token transport per client:**

| Client     | How token is sent                                                               |
| ---------- | ------------------------------------------------------------------------------- |
| Web Portal | HTTP-only cookie (`access_token`)                                               |
| CLI Tool   | `Authorization: Bearer <token>` header OR `Cookie: access_token=<token>` header |

The `authenticateUser` middleware checks the cookie first; if absent it falls back to the `Authorization: Bearer` header. This allows both browser-based and CLI/programmatic clients to authenticate with the same API.

**Security:**

- PKCE prevents code interception attacks
- State parameter validated on every OAuth callback; missing/mismatched state returns `403`
- HTTP-only cookies prevent XSS token theft
- Token blacklisting in Redis prevents token reuse after logout or refresh
- Session cookie (`connect.sid`) is set `HttpOnly` and `Secure` in production

## Token Handling

**Dual Token Strategy (JWT):**

| Token   | Lifetime | Storage (Web)    | Storage (CLI)                  | Purpose            |
| ------- | -------- | ---------------- | ------------------------------ | ------------------ |
| Access  | 3 min    | HTTP-only cookie | `~/.insighta/credentials.json` | API authentication |
| Refresh | 5 min    | HTTP-only cookie | `~/.insighta/credentials.json` | Token renewal      |

**Auto-Refresh Flow:**

1. Middleware detects expired access token
2. Checks refresh token validity (not blacklisted)
3. Blacklists old tokens in Redis
4. Issues new access + refresh tokens
5. Continues request seamlessly

**Implementation:** `middlewares/authenticate.js` verifies JWT on every API request. Supports both HTTP-only cookies (web portal) and `Authorization: Bearer <token>` header (CLI / programmatic access). Handles auto-refresh transparently for cookie-based clients.

## Role Enforcement

**RBAC System:**

- **admin** (first registered user): Full access — create/delete profiles, export CSV, list/delete users
- **analyst** (all subsequent users): Read-only — list/view profiles, natural-language search, classify names

**Database:** Role stored in `users.role` column (VARCHAR). First user registered via GitHub OAuth receives `admin`; every subsequent user receives `analyst`.

**Middleware:** `middlewares/adminAccess.js` checks `req.user.role === 'admin'`, returns `403 Forbidden` if the requesting user is not an admin.

**Protected Endpoints (admin only):**

- `POST /api/profiles` — create a profile
- `DELETE /api/profiles/:id` — delete a profile
- `GET /api/profiles/export` — export profiles as CSV
- `GET /api/users` — list all users
- `DELETE /api/users/:id` — delete a user

**Analyst-accessible Endpoints:**

- `GET /api/profiles` — list profiles with filters
- `GET /api/profiles/search` — natural-language search
- `GET /api/profiles/:id` — get a single profile
- `GET /api/classify` — name classification
- `GET /api/users/me` — own user info

## Multi-Interface Support

The API is designed to work identically from both the **Web Portal** (browser) and the **CLI Tool** (Node.js), and supports direct programmatic access.

### Required Headers

Every request to `/api/profiles` and `/api/users` must include:

| Header          | Value | Purpose                 |
| --------------- | ----- | ----------------------- |
| `X-API-Version` | `1`   | API versioning contract |

Missing or incorrect version returns `400 Bad Request`.

### Authentication Methods

| Client       | Method                                                        |
| ------------ | ------------------------------------------------------------- |
| Web Portal   | `Cookie: access_token=<jwt>` (set automatically by browser)   |
| CLI Tool     | `Cookie: access_token=<jwt>` OR `Authorization: Bearer <jwt>` |
| Programmatic | `Authorization: Bearer <jwt>`                                 |

### Invalid Token Handling

Any request with a missing, malformed, expired (without a valid refresh token), or incorrectly-signed token is rejected with `401 Unauthorized`.

### Web Portal Integration

The web portal at `https://insighta-web-portal-production.up.railway.app` sends every API request through `js/api.js` (an `axios` instance) with `withCredentials: true` and `X-API-Version: 1` set by default. Token refresh is handled transparently via a response interceptor.

### CLI Integration

The CLI tool (`cli-tool/`) reads tokens from `~/.insighta/credentials.json` and sends them as `Cookie: access_token=<token>` alongside `x-api-version: 1`. When the server returns a token-expiry signal the CLI calls `/auth/refresh` automatically before retrying the request.

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

## Rate Limiting

**Redis-backed rate limiting via `express-rate-limit` + `rate-limit-redis`:**

| Limiter       | Applies To                                     | Window | Limit       |
| ------------- | ---------------------------------------------- | ------ | ----------- |
| `authLimiter` | `/auth/*`                                      | 1 min  | 10 requests |
| `apiLimiter`  | `/api/classify`, `/api/profiles`, `/api/users` | 1 min  | 60 requests |

**Configuration:**

- Headers: `RateLimit` standard headers (draft-8), legacy `X-RateLimit-*` headers disabled
- IPv6: `/56` subnet grouping to prevent subnet-hopping abuse
- Redis key prefixes: `rl:auth:` and `rl:api:` (shares the existing Redis connection)
- Exceeded limit returns `429` with JSON body:
  ```json
  {
    "error": "Too Many Requests",
    "message": "Rate limit exceeded. Try again in 1 minute."
  }
  ```

**Implementation:** `middlewares/rateLimit.js`

## Request Logging

**Inline middleware in `app.js` logs every completed request to stdout:**

```
METHOD /path STATUS DURATIONms
```

Example:

```
GET /api/profiles 200 42ms
POST /auth/github/cli/callback 401 8ms
```

- Timing starts on request arrival; duration is measured on the `finish` event of the response
- Logs method, full URL (including query string), status code, and response time
- No external logging library — uses `console.log` for simplicity

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

**Tech Stack:** Node.js, Express 5, PostgreSQL, Redis, JWT, Axios, GitHub OAuth, UUID v13, cookie-parser, express-session (Redis-backed), express-rate-limit + rate-limit-redis, json2csv, country-codes-list  
**External APIs:** Genderize.io, Agify.io, Nationalize.io, REST Countries  
**CLI:** Commander, Axios, cli-table3, Ora spinner, Open (browser launch)
