# Developer Command Reference Card

## Quick Commands

```bash
# Installation
npm install

# Database
npm run migrate        # Run schema migrations
npm run seed           # Seed with test data

# Development
npm run dev            # Start server with auto-reload (http://localhost:3000)
npm start              # Start production server

# Testing
npm test               # Run Jest tests
npm run test:watch     # Watch mode for tests
```

---

## Test User Credentials

```
Admin:
  Email: admin@example.com
  Password: admin123456

Auditor:
  Email: auditor@example.com
  Password: auditor123456

Client:
  Email: testuser@example.com
  Password: testuser123
```

---

## Essential Curl Commands

### Authentication

```bash
# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123456"}'

# Logout (requires Bearer token)
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Refresh token (get new access token)
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIs..."}'
```

### Organizations

```bash
# List all organizations (public)
curl http://localhost:3000/api/organizations

# Get organization by ID (public)
curl http://localhost:3000/api/organizations/1

# Create organization (admin only)
curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Org","industry":"Tech"}'

# Update organization (admin only)
curl -X PUT http://localhost:3000/api/organizations/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","industry":"Finance"}'

# Deactivate organization (admin only)
curl -X PATCH http://localhost:3000/api/organizations/1/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Users

```bash
# List all users (admin only)
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# List users with filters
curl "http://localhost:3000/api/users?organizationId=1&role=auditor" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get user by ID (admin only)
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Create user (admin only, password hashed with bcrypt)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@test.com",
    "password":"SecurePass123",
    "role":"auditor",
    "organizationId":1,
    "fullName":"Jane Auditor"
  }'

# Update user (admin only)
curl -X PUT http://localhost:3000/api/users/2 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"updated@test.com",
    "role":"client",
    "fullName":"Updated Name"
  }'

# Deactivate user (admin only)
curl -X PATCH http://localhost:3000/api/users/2/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Health Check

```bash
# Check server health
curl http://localhost:3000/api/health
# Response: { "status": "OK", "timestamp": "..." }
```

---

## PowerShell Quick Commands

```powershell
# Login and store token
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method Post `
  -Body '{"email":"admin@example.com","password":"admin123456"}' `
  -ContentType "application/json" `
  -UseBasicParsing

$token = $response.data.accessToken

# List organizations
Invoke-RestMethod -Uri "http://localhost:3000/api/organizations" `
  -UseBasicParsing | ConvertTo-Json -Depth 10

# List users (with token)
Invoke-RestMethod -Uri "http://localhost:3000/api/users" `
  -Headers @{ Authorization = "Bearer $token" } `
  -UseBasicParsing | ConvertTo-Json -Depth 10
```

---

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Server not running: `npm run dev` |
| `Cannot find module 'pg'` | Install deps: `npm install` |
| `password authentication failed` | Check .env DB_PASSWORD |
| `Forbidden - Insufficient permissions` | Use admin token, not client token |
| `Email already in use` | Use different email or change existing user's email |
| `Organization not found` | Verify org ID exists: check with GET /organizations |
| `Token expired` | Refresh token: POST /auth/refresh |

---

## File Editing Quick Guide

### To Add New Validator
Edit: `src/validators/{entity}.validator.js`
```javascript
const mySchema = {
  create: Joi.object({
    field1: Joi.string().required(),
    field2: Joi.number().optional(),
  }),
};
```

### To Add New Route
Edit: `src/routes/{entity}.routes.js`
```javascript
const router = express.Router();
router.get('/', controller.getAll);
router.post('/', authenticate, validate(schema), controller.create);
```

### To Add Database Query
Edit: `src/repositories/{entity}.repository.js`
```javascript
async findByCustom(param) {
  const result = await pool.query(
    'SELECT * FROM table WHERE column = $1',
    [param]
  );
  return result.rows;
}
```

### To Handle New Error
`src/utils/ApiError.js` already handles:
```javascript
throw new ApiError('message', 400, 'ERROR_CODE');
```

---

## Database Commands (PostgreSQL)

```sql
-- Connect to database
psql -U postgres -d audit_compliance_db

-- List tables
\dt

-- View table structure
\d users

-- Count records
SELECT COUNT(*) FROM users;

-- Check organization
SELECT * FROM organizations WHERE id = 1;

-- Check user
SELECT id, email, role, is_active FROM users WHERE email = 'admin@example.com';

-- View activity logs
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
```

---

## Environment Setup

### Create .env from template
```bash
cp .env.example .env
# Then edit .env with your values:
# DB_PASSWORD=robertsganj@23
# JWT_ACCESS_SECRET=<generate-random-key>
# JWT_REFRESH_SECRET=<generate-random-key>
```

### Generate Random JWT Secrets
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Debugging Tips

### Check Server Logs
Look for errors in terminal running `npm run dev`

### Enable Verbose Logging
```bash
DEBUG=* npm run dev
```

### Test Single Endpoint
```bash
curl -v http://localhost:3000/api/organizations
# -v shows request/response headers
```

### Validate JSON Request
```bash
echo '{"name":"Test"}' | jq  # Pretty print
```

### Check Database Connection
```bash
npm run seed  # If seed works, DB connection is fine
```

---

## Performance Monitoring

### View Request Times
Server logs show: `[01/Sep/2026:09:42:25 +0000] "GET /api/users HTTP/1.1" 200`

### Common Slow Queries
- GET /users without pagination limit (adds LIMIT in code)
- GET with large search results (pagination helps)

### Optimization Tips
- Use pagination (page=1&limit=10)
- Filter early (organizationId in query)
- Add more indexes if needed

---

## Module Pattern Reference

### Repository (Data Layer)
```javascript
async findAll(limit, offset, filter) { }
async findById(id) { }
async create(data) { }
async update(id, data) { }
async deactivate(id) { }
```

### Service (Business Logic)
```javascript
async getAll(page, limit, filter) { }     // Handles pagination
async getById(id) { }                       // Validation
async create(data) { }                      // Business rules
async update(id, data) { }                  // Role checks
async deactivate(id) { }
```

### Controller (HTTP Handlers)
```javascript
getAll: asyncHandler(async (req, res) => {
  // Extract params, call service, return response
})
```

### Route (Endpoint Definition)
```javascript
router.get('/', controller.getAll);           // Public
router.post('/', authenticate, validate(...), controller.create);  // Protected
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-module

# Make changes
git add .
git commit -m "feat: add new module"

# Merge to main
git checkout main
git merge feature/new-module
git push
```

---

## Deployment Checklist

- [ ] NODE_ENV=production
- [ ] .env file configured with production DB
- [ ] JWT secrets changed (random 64 char strings)
- [ ] Database backed up
- [ ] npm run migrate executed
- [ ] npm start runs without errors
- [ ] All endpoints tested with production URL
- [ ] Logs configured (Morgan, error logging)
- [ ] Rate limiting enabled (for production)
- [ ] HTTPS configured (if public)

---

## Architecture Cheat Sheet

```
Request → Route → Middleware (auth, validate) → Controller → 
Service → Repository → Database → Response
```

**Error Flow:**
```
Any error → asyncHandler catches → ApiError created → 
errorHandler middleware → JSON response sent
```

**Auth Flow:**
```
POST /login → Validate email/password → bcrypt.compare() → 
JWT signed → Return tokens → Client stores accessToken
```

**Protected Request:**
```
Request with Bearer token → authenticate middleware → 
jwt.verify() → req.user set → Request continues
```

**Admin Operation:**
```
Authenticated request → authorize('admin') → 
Check req.user.role → If admin, continue; else throw 403
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| AUTH_MODULE_SUMMARY.md | Auth implementation details |
| ORGANIZATIONS_USERS_API.md | Full API reference |
| MODULES_IMPLEMENTATION_SUMMARY.md | Module overview |
| TESTING_GUIDE.md | Testing procedures |
| PROJECT_STRUCTURE.md | Directory layout |
| QUICK_REFERENCE.md | Command reference (this file) |

---

## Useful Links in Code

- Configuration: `src/config/`
- Error handling: `src/utils/ApiError.js`
- Auth middleware: `src/middleware/auth.js`
- Validation: `src/middleware/validate.js`
- DB schema: `schema.sql`

---

## Key Files to Know

| File | When to Edit |
|------|--------------|
| `.env` | Change DB password, ports, secrets |
| `src/app.js` | Add global middleware, routes |
| `src/routes/index.js` | Mount new route modules |
| `schema.sql` | Modify database structure |
| `scripts/seed.js` | Add test data |

---

## Performance Quick Facts

- Access token: 15 minute expiry
- Refresh token: 7 day expiry
- Default page size: 10 records
- bcrypt rounds: 10 (security vs speed tradeoff)
- Database pool: auto-manages connections
- Morgan logs: all HTTP requests
- Helmet: enables 15+ security headers

---

## Support & Troubleshooting

1. **Check the docs**: See ORGANIZATIONS_USERS_API.md first
2. **Check the logs**: Terminal shows all errors and request details
3. **Verify credentials**: Use test users from seed
4. **Test with curl**: Before adding to frontend
5. **Check database**: `npm run seed` runs query tests too

Ready to build the Audit module? Follow the same pattern! 🚀
