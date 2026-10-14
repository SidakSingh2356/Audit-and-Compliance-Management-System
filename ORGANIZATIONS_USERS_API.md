# Organizations & Users Modules - API Reference

## Overview

Two complete REST API modules built following the repository/service/controller/validator/routes pattern:

1. **Organizations** - Manage audit organizations
2. **Users** - Manage system users with role-based access control

Both modules use the existing auth middleware for protection and authorization.

## File Structure

```
src/
├── repositories/
│   ├── organization.repository.js
│   └── user.repository.js (enhanced from auth module)
├── services/
│   ├── organization.service.js
│   └── user.service.js
├── controllers/
│   ├── organization.controller.js
│   └── user.controller.js
├── validators/
│   ├── organization.validator.js
│   └── user.validator.js
├── routes/
│   ├── organization.routes.js
│   ├── user.routes.js
│   └── index.js (updated to mount both)
└── middleware/
    └── (existing: auth.js, validate.js, errorHandler.js)
```

---

## Organizations API

### Endpoints

#### 1. GET /api/organizations
Get all organizations with pagination and search.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Results per page
- `search` (string, optional) - Search organizations by name (case-insensitive)

**Public Route** ✅

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": 1,
        "name": "Test Organization",
        "contact_info": {"phone": "555-0000"},
        "industry": "Technology",
        "is_active": true,
        "created_at": "2026-09-01T09:00:00.000Z",
        "updated_at": "2026-09-01T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/organizations?page=1&limit=10&search=Test"
```

---

#### 2. GET /api/organizations/:id
Get a specific organization by ID.

**Parameters:**
- `id` (path, required) - Organization ID

**Public Route** ✅

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Test Organization",
    "contact_info": {"phone": "555-0000"},
    "industry": "Technology",
    "is_active": true,
    "created_at": "2026-09-01T09:00:00.000Z",
    "updated_at": "2026-09-01T09:00:00.000Z"
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/organizations/1
```

---

#### 3. POST /api/organizations
Create a new organization. **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Request Body:**
```json
{
  "name": "New Organization",
  "contactInfo": {
    "phone": "555-1234",
    "email": "contact@org.com"
  },
  "industry": "Finance"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "New Organization",
    "contact_info": {"phone": "555-1234", "email": "contact@org.com"},
    "industry": "Finance",
    "is_active": true,
    "created_at": "2026-09-01T10:00:00.000Z",
    "updated_at": "2026-09-01T10:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Organization",
    "contactInfo": {"phone": "555-1234"},
    "industry": "Finance"
  }'
```

---

#### 4. PUT /api/organizations/:id
Update an organization. **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Parameters:**
- `id` (path, required) - Organization ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "contactInfo": {"phone": "555-9999"},
  "industry": "Healthcare"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Name",
    "contact_info": {"phone": "555-9999"},
    "industry": "Healthcare",
    "is_active": true,
    "created_at": "2026-09-01T09:00:00.000Z",
    "updated_at": "2026-09-01T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/organizations/1 \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "contactInfo": {"phone": "555-9999"},
    "industry": "Healthcare"
  }'
```

---

#### 5. PATCH /api/organizations/:id/deactivate
Deactivate an organization (soft delete). **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Parameters:**
- `id` (path, required) - Organization ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Test Organization",
    "is_active": false,
    "updated_at": "2026-09-01T10:45:00.000Z"
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/organizations/1/deactivate \
  -H "Authorization: Bearer <adminToken>"
```

---

## Users API

### Endpoints

All user endpoints require **Admin authentication** 🔒

#### 1. GET /api/users
Get all users with pagination and filters. **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Results per page
- `organizationId` (number, optional) - Filter by organization
- `role` (string, optional) - Filter by role (admin, auditor, client)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "admin@example.com",
        "role": "admin",
        "organization_id": 1,
        "full_name": "Admin User",
        "is_active": true,
        "created_at": "2026-09-01T09:00:00.000Z",
        "updated_at": "2026-09-01T09:00:00.000Z"
      },
      {
        "id": 2,
        "email": "testuser@example.com",
        "role": "client",
        "organization_id": 1,
        "full_name": "Test User",
        "is_active": true,
        "created_at": "2026-09-01T09:05:00.000Z",
        "updated_at": "2026-09-01T09:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/users?page=1&limit=10&organizationId=1&role=client" \
  -H "Authorization: Bearer <adminToken>"
```

---

#### 2. GET /api/users/:id
Get a specific user by ID. **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Parameters:**
- `id` (path, required) - User ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "testuser@example.com",
    "role": "client",
    "organization_id": 1,
    "full_name": "Test User",
    "is_active": true,
    "created_at": "2026-09-01T09:05:00.000Z",
    "updated_at": "2026-09-01T09:05:00.000Z"
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/users/2 \
  -H "Authorization: Bearer <adminToken>"
```

---

#### 3. POST /api/users
Create a new user. **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "role": "auditor",
  "organizationId": 1,
  "fullName": "New User"
}
```

**Validation Rules:**
- Email must be valid and unique
- Password must be at least 8 characters
- Role must be: admin, auditor, or client
- organizationId must be an existing organization
- fullName is required

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "email": "newuser@example.com",
    "role": "auditor",
    "organization_id": 1,
    "full_name": "New User",
    "is_active": true,
    "created_at": "2026-09-01T10:00:00.000Z",
    "updated_at": "2026-09-01T10:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "role": "auditor",
    "organizationId": 1,
    "fullName": "New User"
  }'
```

---

#### 4. PUT /api/users/:id
Update a user. **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Parameters:**
- `id` (path, required) - User ID

**Request Body:**
```json
{
  "email": "updated@example.com",
  "role": "client",
  "fullName": "Updated Name"
}
```

**Validation Rules:**
- Email must be valid and unique (can't be taken by another user)
- Role must be: admin, auditor, or client
- fullName is required
- **Security**: User cannot change their own role unless they're admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "email": "updated@example.com",
    "role": "client",
    "organization_id": 1,
    "full_name": "Updated Name",
    "is_active": true,
    "created_at": "2026-09-01T10:00:00.000Z",
    "updated_at": "2026-09-01T10:30:00.000Z"
  }
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/users/3 \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "role": "client",
    "fullName": "Updated Name"
  }'
```

---

#### 5. PATCH /api/users/:id/deactivate
Deactivate a user (soft delete). **Admin only** 🔒

**Headers:**
- `Authorization: Bearer <accessToken>` (admin token required)

**Parameters:**
- `id` (path, required) - User ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "email": "newuser@example.com",
    "role": "auditor",
    "is_active": false,
    "updated_at": "2026-09-01T10:45:00.000Z"
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/users/3/deactivate \
  -H "Authorization: Bearer <adminToken>"
```

---

## Test Credentials

After running `npm run seed`:

| Email | Password | Role | Use |
|-------|----------|------|-----|
| admin@example.com | admin123456 | admin | Create users, organizations |
| auditor@example.com | auditor123456 | auditor | Perform audits (when available) |
| testuser@example.com | testuser123 | client | Test client access |

---

## Common Error Responses

### 400 - Bad Request (Validation Error)
```json
{
  "success": false,
  "message": "Email must be a valid email address",
  "errorCode": "VALIDATION_ERROR"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Missing or invalid token",
  "errorCode": "MISSING_TOKEN"
}
```

### 403 - Forbidden (Insufficient Permissions)
```json
{
  "success": false,
  "message": "Forbidden - Insufficient permissions",
  "errorCode": "FORBIDDEN"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Organization not found",
  "errorCode": "ORGANIZATION_NOT_FOUND"
}
```

### 409 - Conflict (Email Already Exists)
```json
{
  "success": false,
  "message": "Email already in use",
  "errorCode": "EMAIL_ALREADY_EXISTS"
}
```

---

## Error Codes Reference

| Code | Status | Meaning |
|------|--------|---------|
| VALIDATION_ERROR | 400 | Invalid input data |
| INVALID_INPUT | 400 | Missing or invalid required fields |
| INVALID_ROLE | 400 | Role not in (admin, auditor, client) |
| CANNOT_CHANGE_OWN_ROLE | 403 | Non-admin user trying to change their role |
| ALREADY_DEACTIVATED | 400 | Resource already deactivated |
| EMAIL_ALREADY_EXISTS | 409 | Email taken by another user |
| MISSING_TOKEN | 401 | No Bearer token provided |
| INVALID_TOKEN | 401 | Token malformed or tampered |
| FORBIDDEN | 403 | Insufficient permissions (not admin) |
| ORGANIZATION_NOT_FOUND | 404 | Organization doesn't exist |
| USER_NOT_FOUND | 404 | User doesn't exist |

---

## Testing with cURL

### Login to Get Admin Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123456"}'
```

Extract `accessToken` from response, then use in subsequent requests:

### Create Organization (Admin)
```bash
ADMIN_TOKEN="<accessToken from login>"

curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Org","industry":"Technology"}'
```

### Create User (Admin)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@test.com",
    "password":"password123",
    "role":"auditor",
    "organizationId":1,
    "fullName":"New User"
  }'
```

---

## Design Patterns Applied

✓ **Repository Pattern** - Database queries abstracted
✓ **Service Layer** - Business logic in services
✓ **Controller Pattern** - HTTP request handling
✓ **Middleware** - Auth, validation, error handling
✓ **Joi Validation** - Input validation schemas
✓ **Async Wrapper** - Error handling in controllers
✓ **Role-Based Access Control** - authorize() middleware
✓ **Pagination** - GET endpoints support pagination
✓ **Filtering** - Users support organizationId/role filters
✓ **Soft Delete** - is_active boolean instead of hard delete

---

## What's Next

These modules are ready for integration with:
- Audits module (POST /audits)
- Documents module
- Findings module
- Notifications module
- Activity logging

Audit assignments and other operations will reference users and organizations created here.
