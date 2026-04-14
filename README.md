# Classify Genderize API

A Node.js Express API that classifies names by gender using the [Genderize.io API](https://genderize.io). The API processes raw responses to provide enhanced confidence metrics and timestamps.

## Features

- **Name Gender Classification**: Predicts gender based on a given name
- **Confidence Scoring**: Computes confidence indicators based on probability and sample size
- **Data Processing**: 
  - Renames `count` to `sample_size` for clarity
  - Adds `is_confident` field (true when probability ≥ 0.7 AND sample_size ≥ 100)
  - Generates `processed_at` timestamp in UTC ISO 8601 format
- **Input Validation**: Validates name parameters (rejects numeric-only inputs)
- **Error Handling**: Comprehensive error responses for missing parameters and invalid inputs

## API Endpoint

### GET `/api/classify`

**Query Parameters:**
- `name` (required): The name to classify (alphabetic characters only)

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
    "processed_at": "2026-04-14T12:34:56.789Z"
  }
}
```

**Error Responses:**

*Missing name parameter (400 Bad Request):*
```json
{
  "status": "error",
  "message": "Missing 'name' parameter. Please add a name query to your API call"
}
```

*Invalid name parameter (422 Unprocessable Entity):*
```json
{
  "status": "error",
  "message": "Invalid 'name' parameter. Name must contain only alphabetic characters"
}
```

*No prediction available (502 Bad Gateway):*
```json
{
  "status": "error",
  "message": "No prediction available for the provided name"
}
```

*Invalid endpoint (404 Not Found):*
```json
{
  "error": "Invalid endpoint",
  "message": "Endpoint is invalid, use /api/classify?name=query"
}
```

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stage-zero
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

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

