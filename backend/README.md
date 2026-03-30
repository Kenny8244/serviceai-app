# SimpleServiceAI Backend

A Node.js/Express backend for the SimpleServiceAI application.

## Features

- **Authentication**: User registration, login, and demo mode
- **Vertical Selection**: Business vertical management
- **JWT Authentication**: Secure token-based authentication
- **CORS Support**: Configured for frontend integration

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/demo` - Demo mode login

### Verticals
- `GET /api/verticals` - Get available verticals
- `POST /api/verticals/select` - Select a vertical (requires auth)
- `GET /api/verticals/selected` - Get user's selected vertical (requires auth)

### Health Check
- `GET /health` - Server health status

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

Create a `.env` file with:
```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

## Current Status

✅ **Phase 1 Complete**: Basic backend with in-memory storage
- Authentication endpoints working
- Vertical selection endpoints working
- JWT token management
- CORS configured for frontend

🔄 **Next Phase**: Database integration (PostgreSQL/MongoDB)







