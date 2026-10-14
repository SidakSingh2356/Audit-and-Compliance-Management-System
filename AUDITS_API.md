# Audits Module API Reference

Complete API documentation for the Audits module with role-based access control.

---

## Overview

The Audits module manages audit operations with strict role-based access control:

- **Admin**: Full access to all audits (create, read, update, assign auditors)
- **Auditor**: Can only view audits they are assigned to
- **Client**: Can only view audits for their organization

---

## Authentication

All endpoints require Bearer token authentication (see Auth Module):

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/audits
```

---

## Endpoints

### 1. GET /api/audits
**List all audits (paginated, filterable, searchable)**

**Access**: Authenticated users (role-based filtering applied)
- Admin: sees all audits
- Auditor: sees only assigned audits
- Client: sees only audits in their organization

**Query Parameters**:
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| page | integer | Page number (default: 1) | ?page=1 |
| limit | integer | Results per page (default: 10) | ?limit=20 |
| status | string | Filter by status | ?status=In%20Progress |
| organizationId | integer | Filter by org ID (admin only) | ?organizationId=1 |
| search | string | Search audit title (case-insensitive) | ?search=financial |

**Example Request**:
```bash
curl "http://localhost:3000/api/audits?page=1&limit=10&status=In%20Progress" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Q4 Financial Audit",
      "description": "Comprehensive audit",
      "organization_id": 1,
      "status": "In Progress",
      "start_date": "2026-09-01",
      "due_date": "2026-12-31",
      "created_by": 2,
      "created_at": "2026-09-01T09:45:00.000Z",
      "updated_at": "2026-09-01T09:50:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: Insufficient permissions (non-authenticated user)

---

### 2. GET /api/audits/:id
**Get audit detail with related data**

**Access**: Authenticated users (role-based)
- Admin: can view any audit
- Auditor: can only view if assigned to this audit
- Client: can only view if audit is in their organization

**URL Parameters**:
- `id` (integer, required): Audit ID

**Example Request**:
```bash
curl http://localhost:3000/api/audits/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Q4 Financial Audit",
    "description": "Comprehensive audit",
    "organization_id": 1,
    "status": "In Progress",
    "start_date": "2026-09-01",
    "due_date": "2026-12-31",
    "created_by": 2,
    "created_at": "2026-09-01T09:45:00.000Z",
    "updated_at": "2026-09-01T09:50:00.000Z",
    "assignedAuditors": [
      {
        "id": 3,
        "email": "auditor@example.com",
        "full_name": "John Auditor",
        "role": "auditor",
        "assignment_date": "2026-09-01"
      }
    ],
    "documentRequests": [
      {
        "id": 1,
        "name": "Financial Statements",
        "description": "Quarterly financial statements",
        "due_date": "2026-09-15",
        "status": "Waiting for Upload",
        "created_by": 2,
        "created_at": "2026-09-01T09:45:00.000Z"
      }
    ],
    "findings": [
      {
        "id": 1,
        "title": "Missing documentation",
        "description": "Some records were not provided",
        "severity": "Medium",
        "status": "Open",
        "assigned_to": 3,
        "due_date": "2026-10-01",
        "created_by": 2,
        "created_at": "2026-09-01T09:46:00.000Z"
      }
    ],
    "recentActivity": [
      {
        "id": 1,
        "user_id": 2,
        "action": "CREATE",
        "entity_type": "audit",
        "entity_id": 1,
        "previous_value": null,
        "new_value": "Audit created",
        "ip_address": "::1",
        "created_at": "2026-09-01T09:45:00.000Z"
      }
    ]
  }
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: No access to this audit (role-based)
- 404 Not Found: Audit does not exist

---

### 3. POST /api/audits
**Create a new audit**

**Access**: Admin only

**Request Body**:
```json
{
  "title": "Compliance Audit 2026",
  "description": "Annual compliance review",
  "organizationId": 1,
  "startDate": "2026-09-01",
  "dueDate": "2026-12-31"
}
```

**Parameters**:
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| title | string | Yes | Audit title | "Q4 2026 Financial" |
| description | string | No | Audit description | null or string |
| organizationId | integer | Yes | Organization ID | 1 |
| startDate | date | No | Start date (ISO format) | "2026-09-01" or null |
| dueDate | date | No | Due date (ISO format) | "2026-12-31" or null |

**Validation**:
- `title`: Required, cannot be empty
- `organizationId`: Required, must exist in database
- `startDate` and `dueDate`: Optional, dueDate must be >= startDate if both provided
- Default status: "Draft"

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/audits \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q4 Financial Audit",
    "description": "Comprehensive financial review",
    "organizationId": 1,
    "startDate": "2026-09-01",
    "dueDate": "2026-12-31"
  }'
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Q4 Financial Audit",
    "description": "Comprehensive financial review",
    "organization_id": 1,
    "status": "Draft",
    "start_date": "2026-09-01",
    "due_date": "2026-12-31",
    "created_by": 2,
    "created_at": "2026-09-01T09:45:00.000Z",
    "updated_at": "2026-09-01T09:45:00.000Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation failed (missing fields, invalid values)
  ```json
  {
    "success": false,
    "message": "Audit title is required",
    "errorCode": "VALIDATION_ERROR"
  }
  ```
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: Not an admin
- 404 Not Found: Organization does not exist

---

### 4. PUT /api/audits/:id
**Update audit details**

**Access**: Admin only

**URL Parameters**:
- `id` (integer, required): Audit ID to update

**Request Body**:
```json
{
  "title": "Updated Audit Title",
  "description": "Updated description",
  "status": "In Progress",
  "startDate": "2026-09-01",
  "dueDate": "2026-12-15"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | New audit title |
| description | string | No | New description |
| status | enum | No | New status (see Status Enum below) |
| startDate | date | No | New start date |
| dueDate | date | No | New due date |

**Status Enum**:
- "Draft"
- "Pending"
- "In Progress"
- "Under Review"
- "Completed"
- "Cancelled"
- "Overdue"

**Example Request**:
```bash
curl -X PUT http://localhost:3000/api/audits/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q4 Financial Audit - Updated",
    "status": "In Progress",
    "dueDate": "2026-12-15"
  }'
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Q4 Financial Audit - Updated",
    "description": "Comprehensive financial review",
    "organization_id": 1,
    "status": "In Progress",
    "start_date": "2026-09-01",
    "due_date": "2026-12-15",
    "created_by": 2,
    "created_at": "2026-09-01T09:45:00.000Z",
    "updated_at": "2026-09-01T10:00:00.000Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid status or other validation error
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: Not an admin
- 404 Not Found: Audit does not exist

---

### 5. POST /api/audits/:id/assign
**Assign an auditor to an audit (or reassign)**

**Access**: Admin only

**URL Parameters**:
- `id` (integer, required): Audit ID

**Request Body**:
```json
{
  "auditorId": 3
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| auditorId | integer | Yes | ID of auditor user to assign |

**Behavior**:
- Creates a new assignment in `audit_assignments` table
- If auditor is already assigned to this audit, returns existing assignment (no duplicate)
- Auditor must have role "auditor"
- Prevents non-auditors from being assigned

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/audits/1/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auditorId": 3
  }'
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "auditId": 1,
    "auditorId": 3,
    "auditorEmail": "auditor@example.com",
    "auditorName": "John Auditor",
    "assignedBy": 2,
    "assignmentDate": "2026-09-01T09:49:00.000Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Auditor ID invalid or user is not an auditor
  ```json
  {
    "success": false,
    "message": "User must have auditor role to be assigned to audits",
    "errorCode": "INVALID_INPUT"
  }
  ```
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: Not an admin
- 404 Not Found: Audit or auditor does not exist

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Input validation failed |
| AUDIT_NOT_FOUND | Audit does not exist |
| ORGANIZATION_NOT_FOUND | Organization does not exist |
| USER_NOT_FOUND | User/auditor does not exist |
| INVALID_INPUT | Invalid input data |
| INVALID_STATUS | Invalid audit status |
| FORBIDDEN | Insufficient permissions |
| NOT_AUTHENTICATED | No valid authentication |

---

## Role-Based Access Control

### Admin
- ✅ View all audits
- ✅ Create new audits
- ✅ Update audits
- ✅ Assign auditors
- ✅ Filter by organization/status

### Auditor
- ✅ View only assigned audits (via audit_assignments)
- ✅ Cannot create audits
- ✅ Cannot update audits
- ✅ Cannot assign other auditors
- GET /api/audits returns only their assigned audits

### Client
- ✅ View only audits in their organization
- ✅ Cannot create audits
- ✅ Cannot update audits
- ✅ Cannot assign auditors
- GET /api/audits filtered to their organization_id

---

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // ... resource data
  },
  "pagination": {
    // ... pagination info (only for list endpoints)
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errorCode": "ERROR_CODE"
}
```

### Pagination (List Endpoints)
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

## Filtering Examples

### Get audits in "In Progress" status:
```bash
curl "http://localhost:3000/api/audits?status=In%20Progress" \
  -H "Authorization: Bearer $TOKEN"
```

### Get audits for specific organization (admin only):
```bash
curl "http://localhost:3000/api/audits?organizationId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Search audits by title:
```bash
curl "http://localhost:3000/api/audits?search=financial" \
  -H "Authorization: Bearer $TOKEN"
```

### Combine filters:
```bash
curl "http://localhost:3000/api/audits?organizationId=1&status=Draft&search=audit" \
  -H "Authorization: Bearer $TOKEN"
```

### Pagination:
```bash
# Page 2, 20 results per page
curl "http://localhost:3000/api/audits?page=2&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Workflows

### Admin: Create and assign audit
```bash
# 1. Create audit
curl -X POST http://localhost:3000/api/audits \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Q4 Audit","organizationId":1,"dueDate":"2026-12-31"}'

# Response includes ID: 5

# 2. Assign auditor
curl -X POST http://localhost:3000/api/audits/5/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"auditorId":3}'

# 3. Update status when ready
curl -X PUT http://localhost:3000/api/audits/5 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Q4 Audit","status":"In Progress"}'
```

### Auditor: View assigned audits
```bash
# Automatically sees only assigned audits
curl http://localhost:3000/api/audits \
  -H "Authorization: Bearer $AUDITOR_TOKEN"

# Get detail of specific assigned audit
curl http://localhost:3000/api/audits/1 \
  -H "Authorization: Bearer $AUDITOR_TOKEN"
```

### Client: View organization audits
```bash
# Automatically sees only their organization's audits
curl http://localhost:3000/api/audits \
  -H "Authorization: Bearer $CLIENT_TOKEN"
```

---

## Database Schema

### audits table
```sql
CREATE TABLE audits (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    organization_id BIGINT NOT NULL (FK),
    status audit_status DEFAULT 'Draft',
    start_date DATE,
    due_date DATE,
    created_by BIGINT NOT NULL (FK),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### audit_assignments table
```sql
CREATE TABLE audit_assignments (
    id BIGINT PRIMARY KEY,
    audit_id BIGINT NOT NULL (FK),
    auditor_id BIGINT NOT NULL (FK),
    assigned_by BIGINT NOT NULL (FK),
    assignment_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE (audit_id, auditor_id)
);
```

---

## Notes

- Audit dates use ISO format: YYYY-MM-DD
- Timestamps are in ISO 8601 format with timezone (Z = UTC)
- All monetary values use database type BIGINT for audit IDs (auto-increment)
- Soft deletes are not implemented for audits (use status "Cancelled" instead)
- Audit assignments allow viewing related documents, findings, and activity logs
- Search on title is case-insensitive (uses ILIKE in PostgreSQL)
