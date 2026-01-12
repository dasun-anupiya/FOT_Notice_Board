# Frontend-Backend Connection Setup

This document explains how to connect and run the frontend and backend together.

## What Was Done

### 1. Created API Configuration
- **File**: `frontend/src/api/index.js`
- **Purpose**: Centralized axios configuration for all API calls
- **Features**: 
  - Automatic token injection for authenticated requests
  - Error handling and token expiration management
  - Base URL configuration via environment variables

### 2. Updated Vite Configuration
- **File**: `frontend/vite.config.ts`
- **Changes**: Added proxy configuration to forward `/api` requests to backend
- **Benefit**: Eliminates CORS issues during development

### 3. Environment Variables
- **File**: `frontend/.env`
- **Added**: `VITE_API_URL=http://localhost:4000/api`
- **Purpose**: Configurable backend URL

### 4. Backend Authentication Context
- **File**: `frontend/src/contexts/BackendAuthContext.tsx`
- **Purpose**: Replaces Supabase auth with backend API authentication
- **Features**:
  - Login/logout functionality
  - User registration
  - Token management
  - Automatic redirects

### 5. Updated Services
- **Files**: `frontend/src/services/*.js`
- **Changes**: All services now use the centralized API configuration
- **Added**: Login and register functions to usersService

### 6. Updated App Components
- **Files**: `frontend/src/App.tsx`, `frontend/src/pages/Login.tsx`
- **Changes**: Switched from Supabase auth to backend auth

## How to Run

### Prerequisites
1. Node.js installed
2. Backend dependencies installed
3. Frontend dependencies installed

### Step 1: Start the Backend
```bash
cd backend
npm install  # if not already done
npm run dev  # or npm start
```
The backend will run on `http://localhost:4000`

### Step 2: Start the Frontend
```bash
cd frontend
npm install  # if not already done
npm run dev
```
The frontend will run on `http://localhost:8080`

### Step 3: Test the Connection
1. Open `http://localhost:8080` in your browser
2. Try to register a new user
3. Try to login with existing credentials
4. Check the browser's Network tab to see API calls

## API Endpoints

The frontend now connects to these backend endpoints:

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user

### Notices
- `GET /api/notices` - Get all notices
- `POST /api/notices` - Create notice
- `GET /api/notices/:id` - Get single notice
- `PUT /api/notices/:id` - Update notice
- `DELETE /api/notices/:id` - Delete notice

### Polls
- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create poll
- `GET /api/polls/:id` - Get single poll
- `POST /api/polls/:id/vote` - Vote on poll

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure the backend is running on port 4000
   - Check that the Vite proxy is configured correctly

2. **Connection Refused**
   - Verify backend is running: `curl http://localhost:4000/`
   - Check backend logs for errors

3. **Authentication Issues**
   - Check browser's Application tab for stored tokens
   - Verify backend JWT secret is configured

4. **API Calls Failing**
   - Check browser Network tab for request details
   - Verify API endpoints match backend routes
   - Check backend logs for errors

### Testing the Connection

Run the test script:
```bash
cd frontend
node test-connection.js
```

This will test:
- Backend health endpoint
- API connectivity
- Basic error handling

## Environment Configuration

### Backend (.env)
```env
PORT=4000
CORS_ORIGIN=http://localhost:8080
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

## Next Steps

1. Test user registration and login
2. Test notice creation and viewing
3. Test poll creation and voting
4. Implement proper error handling in UI
5. Add loading states for better UX
6. Implement proper token refresh logic
