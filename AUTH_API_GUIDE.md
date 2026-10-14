/**
 * Auth API Testing Guide
 * 
 * Test the authentication endpoints with curl or Postman
 */

// 1. LOGIN
// POST /api/auth/login
// Body: { "email": "testuser@example.com", "password": "testuser123" }
// Response: { "success": true, "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "testuser123"
  }'

// Expected Response:
// {
//   "success": true,
//   "data": {
//     "user": {
//       "id": 1,
//       "email": "testuser@example.com",
//       "role": "client",
//       "organizationId": 1,
//       "fullName": "Test User"
//     },
//     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//   }
// }


// 2. REFRESH TOKEN
// POST /api/auth/refresh
// Body: { "refreshToken": "..." }
// Response: { "success": true, "data": { "accessToken": "..." } }

curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'


// 3. LOGOUT (Protected - requires Bearer token)
// POST /api/auth/logout
// Headers: Authorization: Bearer <accessToken>
// Response: { "success": true, "data": { "message": "Logged out successfully" } }

curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."


// 4. FORGOT PASSWORD
// POST /api/auth/forgot-password
// Body: { "email": "testuser@example.com" }
// Response: { "success": true, "data": { "message": "...", "resetToken": "..." } }
// Note: In production, resetToken should be sent via email, not returned

curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'


// 5. RESET PASSWORD
// POST /api/auth/reset-password
// Body: { "resetToken": "...", "newPassword": "newpassword123" }
// Response: { "success": true, "data": { "message": "Password reset successfully", "user": {...} } }

curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "newPassword": "newpassword123"
  }'


// VALIDATION EXAMPLES

// Invalid email
// {
//   "success": false,
//   "message": "Email must be a valid email address",
//   "errorCode": "VALIDATION_ERROR"
// }

// Password too short
// {
//   "success": false,
//   "message": "Password must be at least 8 characters",
//   "errorCode": "VALIDATION_ERROR"
// }

// Invalid credentials
// {
//   "success": false,
//   "message": "Invalid email or password",
//   "errorCode": "INVALID_CREDENTIALS"
// }
