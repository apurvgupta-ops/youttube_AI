# Production Backend API

## Overview

A production-ready Node.js backend API built with Express.js and ES6 modules, featuring comprehensive logging, security middleware, and modular architecture.

## Features

### \ud83d\udd12 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- JWT authentication (ready to implement)

### \ud83d\udcc1 Logging

- Winston logger with multiple transports
- Environment-based log levels
- File rotation in production
- HTTP request logging with Morgan

### \ud83d\udce6 File Management

- Multer file upload with validation
- Automatic cleanup of old files
- Configurable file size and type restrictions

### \ud83d\udce7 Email

- Nodemailer integration
- Template support
- Error handling

### \ud83d\udccb Validation

- Environment variable validation
- MongoDB query sanitization
- Input validation utilities

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/your-database
JWT_SECRET=your_super_secure_secret

# Optional
PORT=5000
NODE_ENV=development
SMTP_HOST=your-smtp-host
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm run watch        # Start with Node.js --watch

# Production
npm start            # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode

# Database
npm run seed         # Seed database
npm run migrate      # Run migrations
```

## API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### API Documentation

- `GET /api/v1/docs` - API documentation

### YouTube Search

- `GET /api/v1/youtube/search?q=react&maxResults=5` - Search YouTube videos (public). Returns a standardized API response containing an array of video snippet objects.

Environment:

- Set your YouTube API key in environment variable `YT_API_KEY` (recommended):

Example (macOS / zsh):

```bash
export YT_API_KEY="your_actual_api_key_here"
curl "http://localhost:5000/api/v1/youtube/search?q=react&maxResults=3"
```

### Translation (Google Cloud Translation API)

- `POST /api/v1/translation/translate` - Translate text to a target language (public)
- `POST /api/v1/translation/detect` - Detect language of text (public)

Environment:

- Set your Google Cloud Translation API key in environment variable `GOOGLE_TRANSLATE_API_KEY`

Examples:

```bash
export GOOGLE_TRANSLATE_API_KEY="your_actual_api_key_here"

# Translate text
curl -X POST http://localhost:5000/api/v1/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "target": "es"}'

# Translate with source language specified
curl -X POST http://localhost:5000/api/v1/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "source": "en", "target": "fr"}'

# Detect language
curl -X POST http://localhost:5000/api/v1/translation/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour le monde"}'
```

## Project Structure

```
\u250c\u2500\u2500 config/
\u2502   \u2514\u2500\u2500 database.js       # Database connection
\u251c\u2500\u2500 controllers/          # Request handlers
\u251c\u2500\u2500 middlewares/
\u2502   \u251c\u2500\u2500 auth.js           # Authentication/authorization
\u2502   \u2514\u2500\u2500 errorHandler.js   # Global error handling
\u251c\u2500\u2500 models/               # Database models
\u2502   \u2514\u2500\u2500 BaseModel.js      # Base model with common fields
\u251c\u2500\u2500 routes/               # API routes
\u2502   \u251c\u2500\u2500 health.js         # Health check routes
\u2502   \u2514\u2500\u2500 index.js          # Route aggregation
\u251c\u2500\u2500 services/             # Business logic
\u251c\u2500\u2500 tests/                # Test files
\u2502   \u2514\u2500\u2500 setup.js          # Test configuration
\u251c\u2500\u2500 utils/
\u2502   \u251c\u2500\u2500 apiHelpers.js     # API response utilities
\u2502   \u251c\u2500\u2500 fileUpload.js     # File upload configuration
\u2502   \u251c\u2500\u2500 logger.js         # Winston logger setup
\u2502   \u251c\u2500\u2500 sendMails.js      # Email utilities
\u2502   \u2514\u2500\u2500 validation.js     # Input validation
\u2514\u2500\u2500 index.js              # Application entry point
```

## Development Guidelines

### Error Handling

- Use the global error handler for consistent error responses
- Wrap async functions with `asyncHandler` utility
- Log errors appropriately based on environment

### Database

- Use Mongoose for MongoDB operations
- Implement proper validation in models
- Use transactions for multi-document operations

### Security

- Validate all inputs
- Sanitize database queries
- Use HTTPS in production
- Implement proper authentication

### Logging

- Use appropriate log levels (error, warn, info, debug)
- Log structured data in production
- Avoid logging sensitive information

## Production Deployment

### Requirements

- Node.js 18+
- MongoDB
- Redis (optional, for caching)

### Environment

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
```

### PM2 Configuration

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start index.js --name \"api-server\"

# Monitor
pm2 monit
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use conventional commit messages

## License

ISC License
