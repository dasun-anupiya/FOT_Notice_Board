# Backend Fixes Summary

## Issues Fixed

### 1. **Missing Dependencies**
- Added `jsonwebtoken` package (required for authentication)
- Added `multer` package (required for file uploads)

**Action needed:** Run `npm install` in the `backend` folder to install the new dependencies.

### 2. **User Routes**
- Fixed missing `getAllUsers` import
- Fixed route ordering (GET `/` before GET `/:id`)
- All user operations now working: create, read, update, delete, login

### 3. **Poll Operations**
- Added missing poll management functions:
  - `getPollResults()` - Get poll results with vote counts
  - `updatePoll()` - Update poll details
  - `updatePollStatus()` - Admin approves/rejects/publishes/expires polls
  - `deletePoll()` - Delete polls
- Fixed route ordering for results endpoint
- Improved error handling

### 4. **Notice Response Management**
- Added complete notice response management:
  - `createNoticeResponse()` - Users can respond to notices
  - `getNoticeResponses()` - Get all responses for a notice
  - `deleteNoticeResponse()` - Delete responses (owner or admin only)
- Fixed route ordering for response endpoints

### 5. **Frontend API Calls**
- Fixed field names: `PasswordHash` → `Password`
- Fixed endpoint paths
- Fixed user object field names (PascalCase)

### 6. **Error Handling**
- Added proper error handling for file uploads
- Added error checking for database operations
- Improved error messages

## Setup Instructions

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` folder with:
   ```env
   PORT=4000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   SUPABASE_STORAGE_BUCKET=your_bucket_name (optional)
   CORS_ORIGIN=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```

## API Endpoints Summary

### Users (`/api/users`)
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users` - Get all users (requires auth)
- `GET /api/users/:id` - Get user by ID (requires auth)
- `PUT /api/users/:id` - Update user (requires auth)
- `DELETE /api/users/:id` - Delete user (requires auth)

### Notices (`/api/notices`)
- `POST /api/notices` - Create notice with file uploads (requires auth)
- `GET /api/notices` - Get all notices (requires auth)
- `GET /api/notices/:id` - Get notice by ID (requires auth)
- `PUT /api/notices/:id` - Update notice (requires auth)
- `DELETE /api/notices/:id` - Delete notice (requires auth)
- `POST /api/notices/:id/action` - Approve/Reject/Publish/Expire (requires admin)
- `POST /api/notices/:id/responses` - Create response to notice (requires auth)
- `GET /api/notices/:id/responses` - Get responses for a notice (requires auth)
- `DELETE /api/notices/responses/:responseId` - Delete response (requires auth)

### Polls (`/api/polls`)
- `POST /api/polls` - Create poll (requires auth)
- `GET /api/polls` - Get all polls (requires auth)
- `GET /api/polls/:id` - Get poll by ID (requires auth)
- `GET /api/polls/:id/results` - Get poll results with vote counts (requires auth)
- `POST /api/polls/:id/vote` - Vote on a poll (requires auth)
- `PUT /api/polls/:id` - Update poll (requires auth)
- `DELETE /api/polls/:id` - Delete poll (requires auth)
- `POST /api/polls/:id/action` - Approve/Reject/Publish/Expire (requires admin)

## Testing the Backend

You can test the backend using the frontend test UI or with tools like Postman/Thunder Client.

### Testing Flow:
1. Register a user: `POST /api/users/register`
2. Login: `POST /api/users/login` (save the token)
3. Create a notice: `POST /api/notices` (include token in Authorization header)
4. Create a poll: `POST /api/polls` (include token in Authorization header)
5. View all users: `GET /api/users` (include token)

## Important Notes

- The frontend expects PascalCase field names (UserID, UniversityEmail, etc.)
- All protected routes require a Bearer token in the Authorization header
- Admin-only routes require the user to have `UserType: 'Admin'`
- File uploads are stored locally in `backend/src/uploads/` if no Supabase bucket is configured
- The backend connects to Supabase PostgreSQL database

