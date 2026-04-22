# Profiles API - Stage One

A comprehensive Node.js Express API that creates, retrieves, and manages user profiles by integrating multiple demographic prediction APIs. This extends the Stage Zero classify endpoint with full CRUD operations and persistent PostgreSQL storage.

https://ubiquitous-chainsaw-production-5f71.up.railway.app/

## Project Overview

This API consolidates data from three demographic prediction services:
- **[Genderize.io](https://genderize.io)** - Gender prediction based on names
- **[Agify.io](https://agify.io)** - Age estimation based on names
- **[Nationalize.io](https://nationalize.io)** - Nationality prediction based on names

The system processes and stores this data in a PostgreSQL database, providing a complete profile management solution with filtering, querying, and natural language search capabilities.

## Features

### Core Functionality
- **Profile Creation (POST)**: Creates profiles by fetching data from Genderize, Agify, and Nationalize APIs
- **Natural Language Search**: Search profiles using plain English queries (e.g., "adult males from kenya")
- **Profile Retrieval (GET)**: Retrieve profiles by ID or filter with structured parameters
- **Advanced Filtering**: Filter by gender, age, age group, country, probabilities with pagination
- **Profile Deletion (DELETE)**: Remove profiles by UUID
- **Duplicate Prevention**: Automatically detects and prevents duplicate profile creation
- **Gender Classification**: Legacy endpoint from Stage Zero for simple name classification
- **Data Enrichment**: 
  - Age group classification (child, teenager, adult, senior)
  - Gender probability with sample size
  - Country prediction with probability scores
  - UUIDv7 for unique identifiers
  - UTC timestamp for creation tracking

### Data Processing
- Validates input (rejects numeric-only names)
- Normalizes data (lowercase names, uppercase country codes)
- Rule-based natural language query parsing (no AI/LLMs)
- Country name resolution using REST Countries API
- Calculates age groups: 0–12 → child, 13–19 → teenager, 20–59 → adult, 60+ → senior
- Selects highest probability country from Nationalize results
- Comprehensive error handling with appropriate HTTP status codes

## API Endpoints

### POST `/api/profiles`

Creates a new profile by fetching demographic data for the provided name.

**Request Body:**
```json
{
  "name": "John"
}
```

**Success Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "01932e4a-7b4c-7890-a1b2-c3d4e5f6g7h8",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "age": 45,
    "age_group": "adult",
    "country_id": "US",
    "country_name": "United States",
    "country_probability": 0.35,
    "created_at": "2026-04-16T12:34:56Z"
  }
}
```

**Profile Already Exists (201 Created):**
```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { /* existing profile data */ }
}
```

### GET `/api/profiles/:id`

Retrieves a single profile by UUID.

**Example Request:**
```bash
GET /api/profiles/01932e4a-7b4c-7890-a1b2-c3d4e5f6g7h8
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "01932e4a-7b4c-7890-a1b2-c3d4e5f6g7h8",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "age": 45,
    "age_group": "adult",
    "country_id": "US",
    "country_name": "United States",
    "country_probability": 0.35,
    "created_at": "2026-04-16T12:34:56Z"
  }
}
```

### GET `/api/profiles/search`

**Natural Language Query Endpoint** - Search profiles using plain English queries.

**Query Parameters:**
- `q` (required): Natural language search query
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 10, max: 50)

**Supported Keywords:**
- **Gender**: "male", "female"
- **Age Groups**: "child", "teenager", "adult", "senior"
- **Countries**: Any country name (e.g., "nigeria", "kenya", "angola")

**Example Requests:**
```bash
GET /api/profiles/search?q=adult males from kenya
GET /api/profiles/search?q=female teenagers
GET /api/profiles/search?q=people from nigeria&page=2&limit=20
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 45,
  "data": [
    { /* profile 1 */ },
    { /* profile 2 */ }
  ]
}
```

**Error Response - Unable to Interpret (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

**How it Works:**
- Rule-based parsing (no AI/LLMs)
- Case-insensitive keyword matching
- Extracts gender, age group, and country from natural language
- All conditions are combined with AND logic
- Pagination support for large result sets

**Example Mappings:**
- "adult males from kenya" → gender=male + age_group=adult + country_id=KE
- "female teenagers" → gender=female + age_group=teenager
- "people from angola" → country_id=AO

For full documentation on natural language parsing logic and limitations, see the [main README](../README.md).

### GET `/api/profiles`

Retrieves profiles with structured query parameters (alternative to natural language search).

**Query Parameters:**
- `gender` (optional): Filter by gender (male/female)
- `country_id` (optional): Filter by country code (e.g., US, GB, NG)
- `age_group` (optional): Filter by age group (child, teenager, adult, senior)
- `min_age` (optional): Minimum age filter
- `max_age` (optional): Maximum age filter
- `min_gender_probability` (optional): Minimum gender probability
- `min_country_probability` (optional): Minimum country probability
- `sort_by` (optional): Sort field (age, created_at, gender_probability)
- `order` (optional): Sort order (ASC, DESC)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 50)

**Example Requests:**
```bash
GET /api/profiles?gender=male
GET /api/profiles?country_id=US&age_group=adult
GET /api/profiles?gender=female&country_id=NG&min_age=25&max_age=40
GET /api/profiles?sort_by=age&order=DESC&page=2&limit=20
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 127,
  "data": [
    { /* profile 1 */ },
    { /* profile 2 */ }
  ]
}
```

### DELETE `/api/profiles/:id`

Deletes a profile by UUID.

**Example Request:**
```bash
DELETE /api/profiles/01932e4a-7b4c-7890-a1b2-c3d4e5f6g7h8
```

**Success Response (204 No Content)**

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Profile data with id: 01932e4a-7b4c-7890-a1b2-c3d4e5f6g7h8 does not exist"
}
```

### GET `/api/classify`

Legacy endpoint from Stage Zero for simple gender classification.

**Query Parameters:**
- `name` (required): The name to classify

**Example Request:**
```bash
GET /api/classify?name=John
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "name": "John",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 15139,
    "is_confident": true,
    "processed_at": "2026-04-16T12:34:56.789Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Missing 'name' parameter. Please add a name query to your API call"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Profile not found"
}
```

### 422 Unprocessable Entity
```json
{
  "status": "error",
  "message": "Invalid 'name' parameter. Name must contain only alphabetic characters"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal Server Error"
}
```

### 502 Bad Gateway
```json
{
  "status": "error",
  "message": "Genderize returned an invalid response"
}
```

## Installation & Setup

### Prerequisites
- Node.js 24.x
- npm 11.9.0 or higher
- PostgreSQL database (local or hosted)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd stage-one
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/profiles_db
```

4. Initialize the database:
```bash
node db/createTable.js
node db/seedTable.js
```

5. Start the development server:
```bash
npm run dev
```

6. Start the production server:
```bash
npm start
```

The server will start on port 3000 by default (or the PORT environment variable if set).

## Database Schema

PostgreSQL database with the following schema:

```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,                    -- UUIDv7
    name VARCHAR UNIQUE,                    -- Lowercase normalized, unique constraint
    gender VARCHAR NOT NULL,                -- male/female
    gender_probability FLOAT NOT NULL,      -- 0-1 probability
    age INTEGER NOT NULL,                   -- Estimated age
    age_group VARCHAR NOT NULL,             -- child/teenager/adult/senior
    country_id VARCHAR(2) NOT NULL,         -- ISO 3166-1 alpha-2 code
    country_name VARCHAR NOT NULL,          -- Full country name
    country_probability FLOAT NOT NULL,     -- 0-1 probability
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

**Note:** The `sample_size` field from Genderize API is processed but not persisted in the database.

## Project Structure

```
stage-one/
├── app.js                          # Main application entry point
├── package.json                    # Dependencies and scripts
├── database.db                     # SQLite database (auto-created)
├── controllers/
│   ├── profilesController.js       # Profile CRUD handlers
│   └── classifyController.js       # GET /api/classify handler (Stage Zero)
├── models/
│   ├── storeProcessedResult.js     # Insert profile into database
│   ├── retrieveProfileData.js      # Query profiles + natural language parser
│   └── deleteProfileData.js        # Delete profile from database
├── routes/
│   ├── profilesRouter.js           # Profile API routes
│   └── classifyRouter.js           # Classification API routes
├── db/
│   ├── createTable.js              # Database schema setup
│   ├── seedTable.js                # Sample data seeding
│   ├── openDBConnection.js         # Database connection wrapper
│   ├── openDBConnection.js         # PostgreSQL connection pool
│   ├── logTable.js                 # Database logging utility
│   └── schema.sql                  # SQL schema definition
└── util/
    └── getCountryIdFromQuery.js    # Natural language country name resolver
```

## Technical Implementation Details

### UUID v7 Implementation
Uses UUIDv7 (time-ordered UUIDs) for better database performance and sortability. UUIDs are stored as native UUID type in PostgreSQL.

### Database Connection Pattern
Uses `pg` (node-postgres) connection pooling for efficient database operations. The `db` module exports a query function that manages connections automatically:

```javascript
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // For Railway/cloud deployment
})

export const db = {
    query: (text, params) => pool.query(text, params)
}
```

### Parallel API Calls
Uses `axios.all()` to fetch data from Genderize, Agify, and Nationalize APIs concurrently, reducing response time.

### Dynamic Query Building
Builds parameterized SQL queries dynamically based on provided filter parameters (gender, country_id, age_group, min_age, max_age, probabilities, sorting, pagination). Uses PostgreSQL parameterized queries ($1, $2, etc.) to prevent SQL injection.

### Natural Language Parsing
Implements rule-based keyword extraction from plain English queries:
- **Gender detection**: Case-insensitive matching for "male"/"female"
- **Country detection**: Fetches from REST Countries API and matches using word boundaries
- **Age group detection**: Matches "child", "teenager", "adult", "senior" keywords
- **Query construction**: Combines all detected filters with AND logic and pagination

## Issues Encountered and Resolutions

### Issue 1: Database Selection and Configuration
**Problem**: Chose PostgreSQL for better scalability and production-ready features compared to SQLite. Required proper connection pooling and environment configuration for deployment.

**Resolution**: 
- Implemented PostgreSQL with `pg` (node-postgres) package using connection pooling
- Configured SSL support for Railway deployment
- Used environment variables for connection string management
- Added TIMESTAMPTZ for proper timezone handling

**Configuration Files**:
- `db/openDBConnection.js`: PostgreSQL connection pool setup
- `.env`: DATABASE_URL configuration
- `nixpacks.toml`: Build configuration for Railway

### Issue 2: Natural Language Query Parsing
**Problem**: Required rule-based parsing of plain English queries into database filters without using AI/LLMs.

**Resolution**: 
- Implemented keyword extraction for gender, age groups, and country names
- Used REST Countries API for country name to code resolution
- Applied word boundary regex matching to avoid false positives
- Combined all filters with AND logic for precise results
- Created separate endpoint `/api/profiles/search` for natural language queries

**Files**: 
- `models/retrieveProfileData.js`: Contains `retrieveProfileDataBySearchParams()` function
- `util/getCountryIdFromQuery.js`: Country name resolution logic

### Issue 3: Duplicate Profile Prevention
**Problem**: Multiple POST requests with the same name would create duplicate entries in the database.

**Resolution**:
- Implemented name-based uniqueness check in `storeProcessedResult()`
- Queries database for existing profile before insertion
- Returns existing profile with message "Profile already exists" instead of creating duplicate
- Still returns 201 status code to maintain consistent API response

**File**: `models/storeProcessedResult.js`

### Issue 4: Invalid API Response Handling
**Problem**: External APIs (Genderize, Agify, Nationalize) occasionally return incomplete or null data, causing server crashes.

**Resolution**:
- Added validation checks in `processPostData()` for each API response
- Returns 502 Bad Gateway with specific error message when API returns invalid data
- Prevents processing of incomplete data that would cause database constraint violations
- Early return pattern prevents further processing on invalid data

**File**: `controllers/profilesController.js` (processPostData function)

### Issue 5: Input Validation
**Problem**: Numeric or special character inputs to name field caused unexpected API responses and data integrity issues.

**Resolution**:
- Implemented regex validation `/^[0-9]+$/` to reject purely numeric names
- Returns 422 Unprocessable Entity for invalid inputs
- Validation occurs early in request lifecycle (in controller)
- Consistent validation across POST /api/profiles and GET /api/classify endpoints

**Files**: 
- `controllers/profilesController.js`: handlePostProfiles() function
- `controllers/classifyController.js`: handleGenderize() function

### Issue 6: Case Sensitivity in Filtering
**Problem**: Database queries were case-sensitive, causing failed searches when users provided different casing.

**Resolution**:
- Normalized all name inputs to lowercase before storage
- Normalized country_id to uppercase (ISO 3166-1 standard)
- Normalized age_group to lowercase
- Applied same normalization to query parameters in filter endpoint
- Ensures consistent data storage and retrieval

**Files**:
- `controllers/profilesController.js`: processPostData() function
- `models/retrieveProfileData.js`: Query normalization

### Issue 7: Dynamic Query Parameter Handling
**Problem**: Needed flexible filtering by multiple optional parameters without creating complex conditional logic.

**Resolution**:
- Implemented dynamic SQL query builder in `retrieveProfileDataByQueryParams()`
- Builds WHERE clause conditionally based on provided parameters
- Uses parameterized queries to prevent SQL injection
- Joins multiple conditions with AND operator
- Returns all profiles when no filters provided

**File**: `models/retrieveProfileData.js`

### Issue 8: Database Connection Lifecycle
**Problem**: Database connections need proper management to prevent resource leaks and ensure efficient connection pooling.

**Resolution**:
- Implemented PostgreSQL connection pooling with `pg` package
- Pool automatically manages connection lifecycle and reuse
- Try/catch patterns in all database operations for error handling
- Connection pool shared across all requests for efficiency

**File**: `db/openDBConnection.js`

## Deployment

### Railway Deployment

The application is configured for deployment on Railway with the following considerations:

1. **Build Configuration**: Nixpacks automatically detects Node.js and uses the provided `nixpacks.toml` configuration
2. **Database**: Uses Railway's PostgreSQL addon with automatic DATABASE_URL injection
3. **SSL Configuration**: PostgreSQL connection configured with SSL support for Railway
4. **Port Configuration**: Uses `process.env.PORT` for dynamic port assignment
5. **Environment Variables**: DATABASE_URL is automatically provided by Railway PostgreSQL service

### Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
PORT=3000  # Optional, defaults to 3000
```

For Railway deployment, DATABASE_URL is automatically provided.

## Dependencies

### Production Dependencies
- `express` (^5.2.1): Web framework
- `axios` (^1.15.0): HTTP client for API calls
- `pg` (^8.20.0): PostgreSQL database driver with connection pooling
- `uuid` (^13.0.0): UUID v7 generation
- `cors` (^2.8.6): CORS middleware
- `dotenv` (^17.4.2): Environment variable management

### Development Dependencies
- `nodemon` (^3.1.14): Development server with auto-reload

## Natural Language Search

This API includes a rule-based natural language parser that converts plain English queries into database filters.

**Parsing Logic:**
1. **Gender Detection**: Scans for "male" or "female" keywords (case-insensitive)
2. **Country Detection**: Matches country names using REST Countries API and word boundaries
3. **Age Group Detection**: Identifies "child", "teenager", "adult", or "senior" keywords
4. **Query Building**: Combines detected filters with AND logic

**Limitations:**
- Age range keywords ("above", "below", "over", "under") not yet supported
- Numeric age extraction from natural language not implemented
- "young" keyword not yet mapped to age range 16-24
- Cannot handle OR conditions or negations
- All filters use AND logic only

For complete documentation on natural language parsing, supported keywords, and edge cases, see the [main README](../README.md).

## Future Enhancements

- Add authentication and authorization
- Implement rate limiting for external API calls
- Add caching layer for frequently requested profiles and country data
- Implement profile update (PUT/PATCH) endpoint
- Add bulk profile creation endpoint
- Add data export functionality (CSV, JSON)
- Implement profile search by partial name matching
- Enhanced natural language parsing (age ranges, synonyms, OR logic)
- Add API usage analytics and logging
- Implement webhook notifications for profile events

## License

ISC

## Author

Zubbee