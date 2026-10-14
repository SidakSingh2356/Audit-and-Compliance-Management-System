# Audits Module Implementation Guide

Complete implementation details for the Audits module with role-based access control architecture.

---

## Module Overview

The Audits module implements a role-based access control system where:
- **Admins** have complete control over all audits
- **Auditors** can only view/access audits they are assigned to
- **Clients** can only view audits in their organization

This guide covers the complete implementation pattern.

---

## Architecture

### 5-Layer Pattern

```
1. Route Handler (audit.routes.js)
   ↓ [authenticate] [authorize if needed] [validate if needed]
2. Controller (audit.controller.js)
   ↓ [asyncHandler wrapper] [extract params] [call service]
3. Service (audit.service.js)
   ↓ [business logic] [role-based access checks] [call repository]
4. Repository (audit.repository.js)
   ↓ [database queries] [SQL operations]
5. PostgreSQL Database
   ↓
Response → Controller → Route → Client
```

### Access Control Flow

```
Request arrives with JWT token
    ↓
authenticate middleware extracts req.user (id, role, organizationId)
    ↓
authorize middleware checks role (if required)
    ↓
Controller passes req.user to service
    ↓
Service applies role-based business logic:
  - Admin: no filter, full access
  - Auditor: query audit_assignments to see assigned audits only
  - Client: filter by organization_id matching req.user.organizationId
    ↓
Repository executes SQL query
    ↓
Response returned to client
```

---

## File Structure

```
src/
├── repositories/
│   └── audit.repository.js        # Database queries
├── services/
│   └── audit.service.js           # Business logic with role checks
├── controllers/
│   └── audit.controller.js        # HTTP handlers
├── validators/
│   └── audit.validator.js         # Joi schemas
├── routes/
│   ├── audit.routes.js            # Endpoint definitions
│   └── index.js                   # Route mounting (UPDATED)
└── middleware/
    ├── auth.js                    # Already sets req.user
    ├── validate.js
    └── errorHandler.js
```

---

## Repository Layer: audit.repository.js

### Database Query Methods

#### findAll(limit, offset, filters)
Retrieves paginated list of audits with optional filters.

```javascript
// Supports filters: { status, organizationId, search }
// Returns: array of audit records
const audits = await auditRepository.findAll(10, 0, {
  status: 'In Progress',
  organizationId: 1,
  search: 'financial'
});
```

**SQL**: SELECT with WHERE clauses, LIMIT/OFFSET pagination

#### count(filters)
Returns total count of audits matching filters (for pagination).

```javascript
const total = await auditRepository.count({ status: 'Draft' });
// For calculating totalPages = Math.ceil(total / limit)
```

#### findById(id)
Basic audit lookup without related data.

```javascript
const audit = await auditRepository.findById(1);
// Returns: { id, title, description, status, ... }
```

#### getAuditDetail(id)
Full audit detail with related data in one call.

```javascript
const detail = await auditRepository.getAuditDetail(1);
// Returns: { ...audit, assignedAuditors[], documentRequests[], findings[], recentActivity[] }
```

**Joins**: Performs 4 additional queries:
- audit_assignments → users (assigned auditors)
- document_requests (for this audit)
- findings (for this audit)
- activity_logs (for this audit, limit 20)

#### create(title, description, organizationId, startDate, dueDate, createdBy)
Insert new audit record.

```javascript
const newAudit = await auditRepository.create(
  'Q4 Audit',
  'Financial review',
  1,                    // organizationId
  '2026-09-01',         // startDate
  '2026-12-31',         // dueDate
  2                     // createdBy (user ID)
);
// Default status: 'Draft'
// Returns: newly created audit record
```

#### update(id, title, description, status, startDate, dueDate)
Update audit fields.

```javascript
const updated = await auditRepository.update(
  1,
  'Updated Title',
  'New description',
  'In Progress',
  '2026-09-01',
  '2026-12-20'
);
// Returns: updated audit record
```

#### assignAuditor(auditId, auditorId, assignedBy)
Create or verify assignment in audit_assignments.

```javascript
const assignment = await auditRepository.assignAuditor(
  1,        // auditId
  3,        // auditorId
  2         // assignedBy (admin user ID)
);
// Returns: assignment record (new or existing)
// UNIQUE constraint prevents duplicates
```

#### getAssignedAuditors(auditId)
Get list of auditors assigned to audit.

```javascript
const auditors = await auditRepository.getAssignedAuditors(1);
// Returns: array of { id, email, full_name, role, assignment_date }
```

#### isAuditorAssignedToAudit(auditId, auditorId)
Check if specific auditor is assigned (used for access control).

```javascript
const isAssigned = await auditRepository.isAuditorAssignedToAudit(1, 3);
// Returns: boolean - true if assigned, false otherwise
```

---

## Service Layer: audit.service.js

### Business Logic Methods

All methods receive `user` object with `{ id, role, organizationId }`.

#### getAllAudits(page, limit, filters, user)
List audits with role-based access control.

**Admin Flow**:
```
Admin request → No filter applied → Repository returns all audits → Response
```

**Auditor Flow**:
```
Auditor request → Query audit_assignments table → Find assigned audit IDs → 
Repository filters to only those IDs → Response shows only assigned audits
```

**Client Flow**:
```
Client request → Set filter.organizationId = user.organizationId → 
Repository filters by organization → Response shows only org audits
```

**Returns**: `{ audits: [...], pagination: { page, limit, total, totalPages } }`

#### getAuditById(id, user)
Get single audit with access control.

**Sequence**:
1. Fetch audit detail via repository.getAuditDetail()
2. Check user's role:
   - Admin: allow
   - Auditor: verify assignment via isAuditorAssignedToAudit()
   - Client: verify audit.organization_id === user.organizationId
3. If access denied → throw ApiError(403, 'FORBIDDEN')
4. Return complete audit detail

#### createAudit(title, description, organizationId, startDate, dueDate, createdBy)
Create new audit with validation.

**Validation**:
- title: required, non-empty
- organizationId: required, must exist
- createdBy: must be valid user

**Returns**: new audit record with status = 'Draft'

#### updateAudit(id, title, description, status, startDate, dueDate)
Update audit with validation.

**Validation**:
- title: required, non-empty
- status: must be valid enum value (Draft, Pending, In Progress, Under Review, Completed, Cancelled, Overdue)
- dates: dueDate >= startDate if both provided

**Returns**: updated audit record

#### assignAuditor(auditId, auditorId, assignedBy, user)
Assign auditor to audit.

**Access Control**:
- Only admin can call (throws 403 if not admin)

**Validation**:
- Audit must exist
- Auditor must exist and have role = 'auditor'
- Prevents non-auditors from being assigned

**Returns**: 
```javascript
{
  auditId,
  auditorId,
  auditorEmail,
  auditorName,
  assignedBy,
  assignmentDate
}
```

---

## Controller Layer: audit.controller.js

Thin HTTP handlers using asyncHandler wrapper.

### getAll
```javascript
// Extracts query params: page, limit, status, organizationId, search
// Calls service.getAllAudits() with filters and user
// Returns paginated response
```

### getById
```javascript
// Extracts URL param: id
// Calls service.getAuditById() with user
// Returns audit detail with related data
```

### create
```javascript
// Extracts body: title, description, organizationId, startDate, dueDate
// Calls service.createAudit() with req.user.id as createdBy
// Returns 201 Created
```

### update
```javascript
// Extracts URL param: id
// Extracts body: title, description, status, startDate, dueDate
// Calls service.updateAudit()
// Returns updated audit
```

### assign
```javascript
// Extracts URL param: id (auditId)
// Extracts body: auditorId
// Calls service.assignAuditor() with user
// Returns 201 Created with assignment details
```

---

## Routes Layer: audit.routes.js

### Route Definitions

```javascript
// All routes protected: authenticate middleware required
router.use(authenticate);

// Public reads (all authenticated users, filtered by role)
router.get('/', auditController.getAll);
router.get('/:id', auditController.getById);

// Admin-only writes
router.post('/', authorize('admin'), validate(auditValidator.create), auditController.create);
router.put('/:id', authorize('admin'), validate(auditValidator.update), auditController.update);
router.post('/:id/assign', authorize('admin'), validate(auditValidator.assign), auditController.assign);
```

### Middleware Chain

```
GET /api/audits
    ↓
authenticate              # Verify JWT, set req.user
    ↓
auditController.getAll    # Service filters by role
    ↓
Response (role-filtered results)
```

```
POST /api/audits
    ↓
authenticate              # Verify JWT, set req.user
    ↓
authorize('admin')        # Verify req.user.role === 'admin'
    ↓
validate(schema)          # Validate request body
    ↓
auditController.create    # Create audit
    ↓
Response (201 Created)
```

---

## Validator Layer: audit.validator.js

Joi schemas for input validation.

### create Schema
```javascript
{
  title: Joi.string().required(),
  description: Joi.string().optional().allow(null, ''),
  organizationId: Joi.number().integer().required(),
  startDate: Joi.date().optional().allow(null),
  dueDate: Joi.date().optional().allow(null)
}
```

### update Schema
```javascript
{
  title: Joi.string().required(),
  description: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid(...enumValues).optional(),
  startDate: Joi.date().optional().allow(null),
  dueDate: Joi.date().optional().allow(null)
}
```

### assign Schema
```javascript
{
  auditorId: Joi.number().integer().required()
}
```

---

## Role-Based Access Control Implementation

### Admin Pattern
No restrictions. Full access to all operations.

```javascript
// In service
if (user.role === 'admin') {
  // Proceed without filters
  return await repository.findAll(limit, offset, allFilters);
}
```

### Auditor Pattern
Access only assigned audits via JOIN with audit_assignments.

```javascript
// In service
if (user.role === 'auditor') {
  // Query joins audit_assignments to see only assigned audits
  const query = `
    SELECT a.* FROM audits a
    INNER JOIN audit_assignments aa ON a.id = aa.audit_id
    WHERE aa.auditor_id = $1
  `;
  // Returns only audits where auditor_id matches user.id
}
```

### Client Pattern
Access only organization's audits via organization_id filter.

```javascript
// In service
if (user.role === 'client') {
  // Filter by user's organization
  filters.organizationId = user.organizationId;
  return await repository.findAll(limit, offset, filters);
}
```

### Detail Access Pattern
Multi-role check for single resource.

```javascript
// In service
if (user.role === 'client') {
  if (audit.organization_id !== user.organizationId) {
    throw new ApiError('Forbidden', 403, 'FORBIDDEN');
  }
} else if (user.role === 'auditor') {
  const isAssigned = await repository.isAuditorAssignedToAudit(id, user.id);
  if (!isAssigned) {
    throw new ApiError('Forbidden', 403, 'FORBIDDEN');
  }
}
// Admin: no check needed
```

---

## Error Handling

All errors propagate through asyncHandler → errorHandler middleware.

### ApiError Usage
```javascript
// Audit not found
throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');

// Insufficient permissions
throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');

// Validation failure
throw new ApiError('Audit title is required', 400, 'INVALID_INPUT');
```

### Error Response Format
```json
{
  "success": false,
  "message": "error message here",
  "errorCode": "ERROR_CODE"
}
```

---

## Database Relationships

### audits table
- id: Primary key
- title, description: Audit details
- organization_id: FK → organizations(id)
- status: Enum (Draft, Pending, In Progress, Under Review, Completed, Cancelled, Overdue)
- start_date, due_date: Dates
- created_by: FK → users(id)
- created_at, updated_at: Timestamps

### audit_assignments table
- id: Primary key
- audit_id: FK → audits(id) (CASCADE delete)
- auditor_id: FK → users(id) (RESTRICT delete)
- assigned_by: FK → users(id) (RESTRICT delete)
- assignment_date: Date
- UNIQUE(audit_id, auditor_id): Prevents duplicate assignments

### Related tables accessed via getAuditDetail()
- document_requests(audit_id)
- findings(audit_id)
- activity_logs(entity_type='audit', entity_id)

---

## Query Performance

### Indexes Used
- audits(status) - for filtering by status
- audits(organization_id) - for client org filtering
- audits(created_by) - for audit trail
- audit_assignments(audit_id) - for finding assignments
- audit_assignments(auditor_id) - for finding auditor's audits
- document_requests(audit_id)
- findings(audit_id)
- activity_logs(entity_type, entity_id)

### Pagination
- Default limit: 10
- Query: `LIMIT $limit OFFSET (page-1)*limit`
- Separate COUNT query for total pages

### Optimization Tips
- Use pagination for large result sets
- Filter by organization for clients (automatic)
- Use status filter to reduce auditor's audit list
- Keep audit detail queries minimal (related data can be large)

---

## Testing Scenarios

### Admin Tests
```bash
# Create audit
POST /api/audits → 201

# List all audits
GET /api/audits → 200, all audits shown

# Get audit detail
GET /api/audits/1 → 200, full detail

# Update audit
PUT /api/audits/1 → 200

# Assign auditor
POST /api/audits/1/assign → 201
```

### Auditor Tests
```bash
# Should see only assigned audits
GET /api/audits → 200, filtered to assigned

# Can get detail of assigned audit
GET /api/audits/1 → 200

# Cannot create (should fail)
POST /api/audits → 403 FORBIDDEN

# Cannot update (should fail)
PUT /api/audits/1 → 403 FORBIDDEN
```

### Client Tests
```bash
# Should see only org audits
GET /api/audits → 200, org_id filtered

# Cannot create (should fail)
POST /api/audits → 403 FORBIDDEN
```

---

## Integration Points

### With Auth Module
- Relies on authenticate middleware to set req.user
- req.user contains: { id, email, role, organizationId }

### With Organization Module
- Validates organizationId exists when creating audit
- Client access is based on their organizationId

### With Users Module
- Validates auditorId exists and has role='auditor' when assigning
- createdBy must be valid user when creating audit

### With Future Modules
- document_requests: Audit has many document requests
- findings: Audit has many findings
- activity_logs: Audit changes logged here

---

## Common Pitfalls & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| Auditor sees all audits | Missing audit_assignments JOIN | Verify service.getAllAudits() joins audit_assignments for auditors |
| Client sees wrong org audits | Missing filter | Verify organizationId filter applied in service for clients |
| Non-admin can create audit | Missing authorize middleware | Verify `authorize('admin')` on POST route |
| Duplicate assignments allowed | Missing UNIQUE constraint | Verify audit_assignments has UNIQUE(audit_id, auditor_id) |
| Audit not linked to creator | createdBy not set | Verify auditRepository.create() includes created_by parameter |
| Detail endpoint slow | No pagination on related data | Verify recentActivity limited to LIMIT 20 |

---

## Maintenance & Future Extensions

### Adding New Status
1. Update PostgreSQL audit_status ENUM
2. Update validator schema valid() list
3. Update service validation
4. No code changes needed (ENUM handled in DB)

### Adding New Filters
1. Add parameter to repository.findAll()
2. Add filter logic in WHERE clause
3. Update service.getAllAudits() to pass filter
4. Add to validator.query schema
5. Add to controller.getAll() extraction

### Adding Access Level (e.g., "supervisor")
1. Define in schema.sql user_role ENUM
2. Add role check in service methods
3. Add authorization middleware check
4. Add to validator for role validation

---

## Deployment Checklist

- [ ] schema.sql executed (audits, audit_assignments tables created)
- [ ] Indexes created on status, organization_id, auditor_id
- [ ] audit.routes.js mounted in src/routes/index.js
- [ ] All 5 files created (repository, service, controller, validator, routes)
- [ ] Database pool connection verified
- [ ] JWT tokens working (auth module)
- [ ] Error handling tested (404, 403, 400 responses)
- [ ] Role-based filtering tested (admin, auditor, client)
- [ ] Pagination tested (page, limit)
- [ ] Filters tested (status, organizationId, search)
