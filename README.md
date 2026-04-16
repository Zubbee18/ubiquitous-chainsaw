# Profiles API - Stage One

A comprehensive Node.js Express API that creates, retrieves, and manages user profiles by integrating multiple demographic prediction APIs. This extends the Stage Zero classify endpoint with full CRUD operations and persistent SQLite storage.

## Project Overview

This API consolidates data from three demographic prediction services:
- **[Genderize.io](https://genderize.io)** - Gender prediction based on names
- **[Agify.io](https://agify.io)** - Age estimation based on names
- **[Nationalize.io](https://nationalize.io)** - Nationality prediction based on names

The system processes and stores this data in a SQLite database, providing a complete profile management solution with filtering and querying capabilities.

## Features

### Core Functionality
- **Profile Creation (POST)**: Creates profiles by fetching data from Genderize, Agify, and Nationalize APIs
- **Profile Retrieval (GET)**: Retrieve profiles by ID or filter by gender, country, and age group
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
    "sample_size": 15139,
    "age": 45,
    "age_group": "adult",
    "country_id": "US",
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
    "sample_size": 15139,
    "age": 45,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.35,
    "created_at": "2026-04-16T12:34:56Z"
  }
}
```

### GET `/api/profiles`

Retrieves profiles with optional filtering.

**Query Parameters:**
- `gender` (optional): Filter by gender (male/female)
- `country_id` (optional): Filter by country code (e.g., US, GB, NG)
- `age_group` (optional): Filter by age group (child, teenager, adult, senior)

**Example Requests:**
```bash
GET /api/profiles?gender=male
GET /api/profiles?country_id=US&age_group=adult
GET /api/profiles?gender=female&country_id=NG
```

**Success Response (200 OK):**
```json
{
  "status": "success",
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
- Node.js 18.x or higher
- npm 9.0.0 or higher

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

3. Start the development server:
```bash
npm run dev
```

4. Start the production server:
```bash
npm start
```

The server will start on port 3000 by default (or the PORT environment variable if set).

## Database Schema

SQLite database with the following schema:

```sql
CREATE TABLE profiles (
    id BLOB PRIMARY KEY,              -- UUIDv7
    name TEXT NOT NULL,               -- Lowercase normalized
    gender TEXT NOT NULL,             -- male/female
    gender_probability INTEGER,       -- 0-1 probability
    sample_size INTEGER NOT NULL,     -- Genderize sample size
    age INTEGER NOT NULL,             -- Estimated age
    age_group TEXT NOT NULL,          -- child/teenager/adult/senior
    country_id CHAR(2) NOT NULL,      -- ISO 3166-1 alpha-2 code
    country_probability INTEGER,      -- 0-1 probability
    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
)
```

## Project Structure

```
stage-one/
├── app.js                          # Main application entry point
├── package.json                    # Dependencies and scripts
├── database.db                     # SQLite database (auto-created)
├── nixpacks.toml                   # Nixpacks build configuration
├── railway.toml                    # Railway deployment configuration
├── Controllers/
│   ├── handlePostProfiles.js       # POST /api/profiles handler
│   ├── handleGetProfiles.js        # GET /api/profiles handler
│   ├── handleGetProfilesById.js    # GET /api/profiles/:id handler
│   ├── handleDeleteProfilesById.js # DELETE /api/profiles/:id handler
│   ├── handleGenderizeData.js      # GET /api/classify handler (Stage Zero)
│   ├── processPostData.js          # Process API responses
│   └── processGenderizeData.js     # Process Genderize data
├── Models/
│   ├── storeProcessedResult.js     # Insert profile into database
│   ├── retrieveProfileData.js      # Query profiles from database
│   └── deleteProfileData.js        # Delete profile from database
├── Routes/
│   └── appRouter.js                # API route definitions
└── util/
    ├── createTable.js              # Database table creation
    ├── openDBConnection.js         # Database connection wrapper
    ├── getGenderizeData.js         # Genderize API client
    └── logTable.js                 # Logging utility
```

## Technical Implementation Details

### UUID v7 Implementation
Uses UUIDv7 (time-ordered UUIDs) for better database performance and sortability. UUIDs are stored as BLOBs in SQLite.

### Database Connection Pattern
Implements an AsyncDatabase wrapper class to provide async/await interface over better-sqlite3's synchronous API, enabling consistent error handling and connection management.

### Parallel API Calls
Uses `axios.all()` to fetch data from Genderize, Agify, and Nationalize APIs concurrently, reducing response time.

### Dynamic Query Building
Builds SQL queries dynamically based on provided filter parameters (gender, country_id, age_group), supporting flexible querying without SQL injection vulnerabilities.

## Issues Encountered and Resolutions

### Issue 1: SQLite Native Module Compilation on Deployment
**Problem**: `better-sqlite3` failed to install on Railway/cloud platforms due to native module compilation requirements.

**Resolution**: 
- Added `nixpacks.toml` configuration specifying required system packages (python3, gcc, gnumake, pkg-config)
- Configured build phase to rebuild better-sqlite3 from source: `npm rebuild better-sqlite3 --build-from-source`
- Used `--legacy-peer-deps` flag during installation to resolve dependency conflicts
- Ensured Node.js 18 is explicitly specified in build environment

**Configuration Files**:
- `nixpacks.toml`: Defines build phases and system dependencies
- `railway.toml`: Specifies Nixpacks requirements

### Issue 2: Async/Await with better-sqlite3
**Problem**: `better-sqlite3` is synchronous while the Express controllers use async/await patterns, creating inconsistent code patterns.

**Resolution**: 
- Created `AsyncDatabase` wrapper class in `openDBConnection.js`
- Wraps synchronous methods (get, all, run, exec) with async interface
- Maintains consistent error handling and connection lifecycle management
- Enables use of try/catch/finally blocks throughout the application

**File**: `util/openDBConnection.js`

### Issue 3: Duplicate Profile Prevention
**Problem**: Multiple POST requests with the same name would create duplicate entries in the database.

**Resolution**:
- Implemented name-based uniqueness check in `storeProcessedResult()`
- Queries database for existing profile before insertion
- Returns existing profile with message "Profile already exists" instead of creating duplicate
- Still returns 201 status code to maintain consistent API response

**File**: `Models/storeProcessedResult.js`

### Issue 4: Invalid API Response Handling
**Problem**: External APIs (Genderize, Agify, Nationalize) occasionally return incomplete or null data, causing server crashes.

**Resolution**:
- Added validation checks in `processPostData()` for each API response
- Returns 502 Bad Gateway with specific error message when API returns invalid data
- Prevents processing of incomplete data that would cause database constraint violations
- Early return pattern prevents further processing on invalid data

**File**: `Controllers/processPostData.js`

### Issue 5: Input Validation
**Problem**: Numeric or special character inputs to name field caused unexpected API responses and data integrity issues.

**Resolution**:
- Implemented regex validation `/^[0-9]+$/` to reject purely numeric names
- Returns 422 Unprocessable Entity for invalid inputs
- Validation occurs early in request lifecycle (in controller)
- Consistent validation across POST /api/profiles and GET /api/classify endpoints

**Files**: 
- `Controllers/handlePostProfiles.js`
- `Controllers/handleGenderizeData.js`

### Issue 6: Case Sensitivity in Filtering
**Problem**: Database queries were case-sensitive, causing failed searches when users provided different casing.

**Resolution**:
- Normalized all name inputs to lowercase before storage
- Normalized country_id to uppercase (ISO 3166-1 standard)
- Normalized age_group to lowercase
- Applied same normalization to query parameters in filter endpoint
- Ensures consistent data storage and retrieval

**Files**:
- `Controllers/processPostData.js` (normalization at storage)
- `Models/retrieveProfileData.js` (normalization at query)

### Issue 7: Dynamic Query Parameter Handling
**Problem**: Needed flexible filtering by multiple optional parameters without creating complex conditional logic.

**Resolution**:
- Implemented dynamic SQL query builder in `retrieveProfileDataByQueryParams()`
- Builds WHERE clause conditionally based on provided parameters
- Uses parameterized queries to prevent SQL injection
- Joins multiple conditions with AND operator
- Returns all profiles when no filters provided

**File**: `Models/retrieveProfileData.js`

### Issue 8: Database Connection Lifecycle
**Problem**: Database connections not properly closed, leading to resource leaks.

**Resolution**:
- Implemented try/catch/finally pattern in all database operations
- Ensures connection closure in finally block regardless of success or error
- Added console logging for connection status
- Each operation opens and closes its own connection to prevent connection pooling issues

**Files**: All files in `Models/` directory

## Deployment

### Railway Deployment

The application is configured for deployment on Railway with the following considerations:

1. **Build Configuration**: Nixpacks automatically detects Node.js and uses the provided `nixpacks.toml` configuration
2. **Native Dependencies**: System packages (python3, gcc, gnumake) are installed during build phase
3. **SQLite Persistence**: Database file persists in the deployment environment
4. **Port Configuration**: Uses `process.env.PORT` for dynamic port assignment

### Environment Variables

- `PORT`: Server port (default: 3000)

## Dependencies

### Production Dependencies
- `express` (^5.2.1): Web framework
- `axios` (^1.15.0): HTTP client for API calls
- `better-sqlite3` (^11.7.0): SQLite database driver
- `uuid` (^13.0.0): UUID v7 generation
- `cors` (^2.8.6): CORS middleware

### Development Dependencies
- `nodemon` (^3.1.14): Development server with auto-reload

## Future Enhancements

- Add authentication and authorization
- Implement rate limiting for external API calls
- Add caching layer for frequently requested profiles
- Implement profile update (PUT/PATCH) endpoint
- Add bulk profile creation endpoint
- Implement pagination for GET /api/profiles
- Add data export functionality (CSV, JSON)
- Implement profile search by partial name matching
- Add API usage analytics and logging
- Implement webhook notifications for profile events

## License

ISC

## Author

Zubbee

The server will start on port 3000 by default (or the port specified in `PORT` environment variable).

## Project Structure

```
stage-zero/
├── app.js                          # Main application entry point
├── package.json                    # Project dependencies and scripts
├── Controllers/
│   ├── handleGenderizeData.js      # Request handler and validation
│   └── processGenderizeData.js     # Data processing logic
├── Routes/
│   └── appRouter.js                # API route definitions
└── ../util/
    └── getGenderizeData.js         # Utility function to fetch from Genderize API (applicable to other APIs)
```

## Technologies

- **Node.js**: Runtime environment
- **Express 5.x**: Web framework
- **Genderize.io API**: Gender prediction service

## Dev Dependencies

- **nodemon**: Development server with auto-reload

## Author

Zubbee

## License

ISC

