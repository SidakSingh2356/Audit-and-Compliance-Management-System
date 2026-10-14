# Testing Organizations & Users Modules

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed database
npm run seed

# 3. Start server
npm run dev

# 4. Server runs on http://localhost:3000
```

---

## Test Users

After running `npm run seed`, these users are available:

```
Admin User:
  Email: admin@example.com
  Password: admin123456
  Role: admin

Auditor User:
  Email: auditor@example.com
  Password: auditor123456
  Role: auditor

Client User:
  Email: testuser@example.com
  Password: testuser123
  Role: client
```

---

## Step-by-Step Testing

### 1. Login to Get Admin Token

```bash
# Get admin access token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'

# Response will contain:
# "accessToken": "eyJhbGciOiJIUzI1NiIs..."
# Save this token for use in protected endpoints
```

### 2. Test Organizations (Public Read, Admin Write)

#### Get All Organizations
```bash
curl http://localhost:3000/api/organizations
# No token needed - public endpoint
```

#### Get Specific Organization
```bash
curl http://localhost:3000/api/organizations/1
# No token needed - public endpoint
```

#### Create Organization (Requires Admin)
```bash
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Audit Firm",
    "contactInfo": {"phone": "555-1234", "email": "contact@firm.com"},
    "industry": "Healthcare"
  }'
```

#### Update Organization (Requires Admin)
```bash
curl -X PUT http://localhost:3000/api/organizations/2 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Firm Name",
    "industry": "Technology"
  }'
```

#### Deactivate Organization (Requires Admin)
```bash
curl -X PATCH http://localhost:3000/api/organizations/2/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3. Test Users (Admin Only)

#### Get All Users
```bash
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Get User with Filters
```bash
# Filter by organization
curl "http://localhost:3000/api/users?organizationId=1&role=auditor" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Get Specific User
```bash
curl http://localhost:3000/api/users/2 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Create New User (Requires Admin)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "role": "auditor",
    "organizationId": 1,
    "fullName": "Jane Auditor"
  }'
```

#### Update User (Requires Admin)
```bash
curl -X PUT http://localhost:3000/api/users/3 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "role": "client",
    "fullName": "Updated Name"
  }'
```

#### Deactivate User (Requires Admin)
```bash
curl -X PATCH http://localhost:3000/api/users/3/deactivate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 4. Test Authorization (Non-Admin Gets Forbidden)

#### Try to Create User as Non-Admin
```bash
# Login as auditor (non-admin)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "auditor@example.com",
    "password": "auditor123456"
  }'

# Copy the accessToken from response
# Try to access users endpoint
AUDITOR_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl "http://localhost:3000/api/users" \
  -H "Authorization: Bearer $AUDITOR_TOKEN"

# Response: 403 Forbidden
# {
#   "success": false,
#   "message": "Forbidden - Insufficient permissions",
#   "errorCode": "FORBIDDEN"
# }
```

---

### 5. Test Input Validation

#### Missing Required Fields
```bash
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactInfo": {"phone": "555-1234"}
    # Missing "name" - should fail validation
  }'

# Response: 400 Bad Request
# {
#   "success": false,
#   "message": "Organization name is required",
#   "errorCode": "VALIDATION_ERROR"
# }
```

#### Invalid Email
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "SecurePass123",
    "role": "auditor",
    "organizationId": 1,
    "fullName": "Test User"
  }'

# Response: 400 Bad Request
# "Email must be a valid email address"
```

#### Password Too Short
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "short",
    "role": "auditor",
    "organizationId": 1,
    "fullName": "Test User"
  }'

# Response: 400 Bad Request
# "Password must be at least 8 characters"
```

#### Duplicate Email
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",  # Already exists!
    "password": "SecurePass123",
    "role": "auditor",
    "organizationId": 1,
    "fullName": "Duplicate User"
  }'

# Response: 409 Conflict
# {
#   "success": false,
#   "message": "Email already in use",
#   "errorCode": "EMAIL_ALREADY_EXISTS"
# }
```

---

### 6. Test Pagination

#### Get Paginated Results
```bash
curl "http://localhost:3000/api/users?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Response includes:
# "pagination": {
#   "page": 1,
#   "limit": 5,
#   "total": 10,
#   "totalPages": 2
# }
```

#### Search Organizations
```bash
curl "http://localhost:3000/api/organizations?search=Test&page=1&limit=10"
# Finds organizations with "Test" in name (case-insensitive)
```

---

## Using Postman/Insomnia

If using GUI tools:

1. **Collection**: Create requests for each endpoint
2. **Environment Variables**:
   - `BASE_URL`: http://localhost:3000
   - `ADMIN_TOKEN`: (set after login)
   - `ORG_ID`: (set after creating org)
   - `USER_ID`: (set after creating user)

3. **Pre-request Scripts**:
   ```javascript
   // Get token before protected requests
   pm.sendRequest({
     url: "{{BASE_URL}}/api/auth/login",
     method: "POST",
     header: { "Content-Type": "application/json" },
     body: {
       mode: "raw",
       raw: JSON.stringify({
         email: "admin@example.com",
         password: "admin123456"
       })
     }
   }, (err, response) => {
     pm.environment.set("ADMIN_TOKEN", response.json().data.accessToken);
   });
   ```

---

## Common Issues & Solutions

### "Cannot find module 'pg'"
```bash
npm install
```

### "Password authentication failed"
Check `.env` file:
- `DB_PASSWORD=robertsganj@23` (or your password)
- `DB_USER=postgres`
- Verify PostgreSQL is running

### "Organization not found" (404)
```bash
# Check organization exists
curl http://localhost:3000/api/organizations
# Use an existing ID from response
```

### "Forbidden - Insufficient permissions" (403)
- Make sure using admin token
- Check token hasn't expired (15m expiry)
- Get new token: `curl -X POST http://localhost:3000/api/auth/login`

### "Email already in use" (409)
- Email must be unique
- Try: `newuser-{timestamp}@example.com`

---

## Monitoring

### Check Server Logs
Terminal should show:
```
::1 - - [01/Sep/2026:09:42:25 +0000] "GET /api/users?page=1&limit=10 HTTP/1.1" 200
```

### Debug Mode
Edit `.env`:
```env
NODE_ENV=development  # Shows stack traces in errors
```

---

## Performance Notes

- Queries are indexed on: email, organization_id, role, status
- Pagination default: 10 results per page
- Max results per page: No limit (set one in production)
- Search is case-insensitive ILIKE for better UX

---

## What's Working ✅

✅ Organizations CRUD (public read, admin write)
✅ Users CRUD (admin only)
✅ Pagination & filtering
✅ Input validation with Joi
✅ Password hashing with bcrypt
✅ Role-based authorization
✅ Error handling & consistent responses
✅ Soft delete (is_active)
✅ Email uniqueness constraints
✅ Self-role protection

---

## Troubleshooting Script

```bash
# Quick health check
curl http://localhost:3000/api/health

# Login and store token
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123456"}')

TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
echo "Token: $TOKEN"

# Test organizations
curl "http://localhost:3000/api/organizations" | jq

# Test users (with token)
curl "http://localhost:3000/api/users" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Next: Build Audit Module

Once these modules are stable, create:
- `src/routes/audit.routes.js`
- Endpoints for audits (create, list, status updates)
- Link to organizations and users created here
