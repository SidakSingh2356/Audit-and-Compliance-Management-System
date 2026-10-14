# Quick Reference - Authentication API

## npm Scripts

```bash
npm run dev          # Start server with nodemon (auto-reload)
npm start            # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed database with test user
npm test             # Run Jest tests
```

## Endpoints Overview

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/login` | ❌ | email, password | Login with credentials |
| POST | `/api/auth/refresh` | ❌ | refreshToken | Get new access token |
| POST | `/api/auth/logout` | ✅ | - | Logout (token in header) |
| POST | `/api/auth/forgot-password` | ❌ | email | Request password reset |
| POST | `/api/auth/reset-password` | ❌ | resetToken, newPassword | Complete password reset |

## Test Credentials

```
Email: testuser@example.com
Password: testuser123
```

## Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| USER_INACTIVE | 401 | Account disabled (is_active=false) |
| MISSING_TOKEN | 401 | No Bearer token provided |
| INVALID_TOKEN | 401 | Token is malformed or tampered |
| TOKEN_EXPIRED | 401 | JWT expired |
| VALIDATION_ERROR | 400 | Invalid input (email format, password length) |
| USER_NOT_FOUND | 404 | User doesn't exist |

## Token Usage

### Get Tokens
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"testuser123"}'
```

Response contains:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",      // Use in Authorization header
    "refreshToken": "..."      // Keep safe, use to get new accessToken
  }
}
```

### Use Access Token
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

### Refresh Expired Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Token Expiry

- **Access Token**: 15 minutes (JWT_ACCESS_EXPIRES_IN)
- **Refresh Token**: 7 days (JWT_REFRESH_EXPIRES_IN)

After access token expires, use refresh token to get a new one.

## File Structure

```
src/
├── repositories/user.repository.js     # DB queries
├── services/auth.service.js            # Business logic
├── controllers/auth.controller.js      # HTTP handlers
├── validators/auth.validator.js        # Joi schemas
├── routes/auth.routes.js               # Endpoints
├── middleware/
│   ├── auth.js                         # JWT verification
│   ├── validate.js                     # Input validation
│   ├── errorHandler.js                 # Error responses
│   └── notFound.js                     # 404 handler
└── utils/
    ├── ApiError.js                     # Error class
    └── asyncHandler.js                 # Async wrapper
```

## Using Auth in Other Routes

### Require Authentication
```javascript
const { authenticate } = require('../middleware/auth');

router.get('/protected', authenticate, (req, res) => {
  console.log(req.user);  // { id, email, role, organizationId, iat, exp }
  res.json({ message: 'Authenticated!' });
});
```

### Require Specific Role
```javascript
const { authenticate, authorize } = require('../middleware/auth');

router.post('/admin-only', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin only!' });
});
```

### Multiple Roles
```javascript
router.post('/auditors-only', authenticate, authorize('admin', 'auditor'), (req, res) => {
  res.json({ message: 'Auditors and admins only!' });
});
```

## Password Validation Rules

- **Minimum length**: 8 characters
- **Hashing**: bcrypt with salt rounds
- **Comparison**: Never store plaintext, always use bcrypt.compare()

## What Gets Logged

Morgan logs all HTTP requests:
```
::1 - - [01/Sep/2026:09:36:30 +0000] "POST /api/auth/login HTTP/1.1" 200 581
```

For detailed debugging, check server output.

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Test endpoints**: Use curl, Postman, or Insomnia
3. **Monitor logs**: Check terminal for request/response logs
4. **Modify code**: nodemon will auto-restart server
5. **Commit changes**: Git commits follow conventional commits

## Adding New Auth Features

1. Create repository method (if DB access needed)
2. Add service method with business logic
3. Add controller method with asyncHandler
4. Add Joi validator schema
5. Add route with validation middleware
6. Update src/routes/index.js if needed

## Troubleshooting

**"Missing required environment variables"**
- Check .env file exists and has all variables
- Run: `npm run migrate` loads dotenv

**"password authentication failed"**
- Check DB_PASSWORD in .env matches PostgreSQL password
- Verify PostgreSQL is running

**"Cannot find module 'pg'"**
- Run: `npm install`

**Server won't start**
- Check PORT not already in use
- Check .env has NODE_ENV=development
- Check src/app.js has no syntax errors
