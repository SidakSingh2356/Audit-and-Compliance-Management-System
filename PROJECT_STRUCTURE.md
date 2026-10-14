# Project Structure Overview

## Complete Directory Tree

```
Audit And Compliance Management System/
│
├── 📄 package.json                    # Dependencies & npm scripts
├── 📄 .env                            # Environment variables (create from .env.example)
├── 📄 .env.example                    # Environment template
├── 📄 .gitignore                      # Git ignore rules
├── 📄 server.js                       # Express server entry point
├── 📄 schema.sql                      # PostgreSQL database schema
│
├── 📁 src/                            # Application source code
│   ├── 📄 app.js                      # Express app configuration
│   │
│   ├── 📁 config/                     # Configuration modules
│   │   ├── 📄 db.js                   # PostgreSQL pool config
│   │   └── 📄 env.js                  # Environment validation
│   │
│   ├── 📁 repositories/               # Data access layer
│   │   ├── 📄 user.repository.js      # User DB queries
│   │   └── 📄 organization.repository.js # Organization DB queries
│   │
│   ├── 📁 services/                   # Business logic layer
│   │   ├── 📄 auth.service.js         # Auth business logic (login, refresh, etc.)
│   │   ├── 📄 user.service.js         # User business logic
│   │   └── 📄 organization.service.js # Organization business logic
│   │
│   ├── 📁 controllers/                # HTTP request handlers
│   │   ├── 📄 auth.controller.js      # Auth HTTP handlers
│   │   ├── 📄 user.controller.js      # User HTTP handlers
│   │   └── 📄 organization.controller.js # Organization HTTP handlers
│   │
│   ├── 📁 validators/                 # Input validation schemas
│   │   ├── 📄 auth.validator.js       # Auth input validation
│   │   ├── 📄 user.validator.js       # User input validation
│   │   └── 📄 organization.validator.js # Organization input validation
│   │
│   ├── 📁 routes/                     # API route definitions
│   │   ├── 📄 index.js                # Main router (mounts all routes)
│   │   ├── 📄 auth.routes.js          # Auth endpoints
│   │   ├── 📄 user.routes.js          # User endpoints
│   │   └── 📄 organization.routes.js  # Organization endpoints
│   │
│   ├── 📁 middleware/                 # Express middleware
│   │   ├── 📄 auth.js                 # JWT authentication & authorization
│   │   ├── 📄 validate.js             # Input validation middleware
│   │   ├── 📄 errorHandler.js         # Centralized error handler
│   │   └── 📄 notFound.js             # 404 handler
│   │
│   └── 📁 utils/                      # Utility functions & classes
│       ├── 📄 asyncHandler.js         # Async/await error wrapper
│       └── 📄 ApiError.js             # Custom error class
│
├── 📁 scripts/                        # Utility scripts
│   ├── 📄 migrate.js                  # Database migration runner
│   └── 📄 seed.js                     # Database seeding script
│
├── 📁 uploads/                        # File upload directory
│   └── 📄 .gitkeep                    # Placeholder
│
└── 📁 Documentation/                  # API & implementation docs
    ├── 📄 AUTH_MODULE_SUMMARY.md      # Auth module documentation
    ├── 📄 ORGANIZATIONS_USERS_API.md  # Full API reference
    ├── 📄 MODULES_IMPLEMENTATION_SUMMARY.md # Implementation details
    ├── 📄 QUICK_REFERENCE.md          # Quick command reference
    └── 📄 TESTING_GUIDE.md            # Testing procedures
```

---

## Module Architecture

### Layer Structure (Per Module)

Each module follows this 5-layer pattern:

```
Route Handler
    ↓
Controller (asyncHandler wrapper)
    ↓
Service (business logic)
    ↓
Repository (database queries)
    ↓
PostgreSQL Database
```

### Example: Creating an Organization

```
POST /api/organizations
    ↓
📁 routes/organization.routes.js
    - Middleware: authenticate, authorize('admin'), validate(schema)
    ↓
📁 controllers/organization.controller.js
    - Wrapped with asyncHandler
    - Calls service.createOrganization()
    ↓
📁 services/organization.service.js
    - Validates business rules
    - Calls repository.create()
    ↓
📁 repositories/organization.repository.js
    - Executes: INSERT INTO organizations...
    ↓
PostgreSQL: stores data, returns row
    ↓
Response: { success: true, data: { id, name, ... } }
```

---

## Middleware Flow

Request processing order:

```
Request
    ↓
helmet()              - Security headers
    ↓
cors()                - CORS handling
    ↓
morgan()              - Request logging
    ↓
express.json()        - Parse JSON body
    ↓
Routes
    ├─ Public routes (no middleware)
    │   ├─ GET /api/organizations
    │   ├─ GET /api/organizations/:id
    │   └─ POST /api/auth/login
    │
    ├─ Protected routes (authenticate only)
    │   └─ POST /api/auth/logout
    │
    └─ Admin routes (authenticate + authorize)
        ├─ POST /api/organizations
        ├─ PUT /api/organizations/:id
        ├─ PATCH /api/organizations/:id/deactivate
        ├─ GET /api/users
        ├─ POST /api/users
        ├─ PUT /api/users/:id
        └─ PATCH /api/users/:id/deactivate
    ↓
validate(schema)      - Input validation (if needed)
    ↓
Controller            - Handle request with asyncHandler
    ↓
Service               - Business logic
    ↓
Repository            - Database query
    ↓
Response              - JSON response
    ↓
errorHandler()        - Catches all errors
    ↓
Client
```

---

## Database Schema Overview

### Key Tables Used by Modules

```sql
organizations
├── id (PK)
├── name (indexed)
├── contact_info (JSONB)
├── industry
├── is_active
├── created_at, updated_at

users
├── id (PK)
├── email (unique, indexed)
├── password_hash
├── role (admin, auditor, client)
├── organization_id (FK → organizations, indexed)
├── full_name
├── is_active
├── created_at, updated_at

audits
├── id (PK)
├── title
├── organization_id (FK → organizations, indexed)
├── status (indexed)
├── created_by (FK → users)
├── due_date (indexed)
├── created_at, updated_at
└── ...

findings, documents, activity_logs, etc.
└── All follow similar pattern with created_at/updated_at
```

---

## Module Dependencies

```
auth.routes
    └─ auth.controller
        └─ auth.service
            ├─ user.repository
            └─ ApiError

organization.routes
    ├─ organization.controller
    │   └─ organization.service
    │       ├─ organization.repository
    │       └─ ApiError
    └─ auth middleware

user.routes
    ├─ user.controller
    │   └─ user.service
    │       ├─ user.repository
    │       ├─ bcrypt
    │       └─ ApiError
    └─ auth middleware

validate middleware
    └─ Joi schemas

errorHandler middleware
    └─ ApiError
```

---

## Environment Variables

```env
# Core
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=audit_compliance_db
DB_USER=postgres
DB_PASSWORD=...

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## npm Scripts

```json
{
  "start": "node server.js",           # Production: start server
  "dev": "nodemon server.js",          # Development: auto-reload on changes
  "migrate": "node scripts/migrate.js", # Run database migrations
  "seed": "node scripts/seed.js",      # Seed with test data
  "test": "jest --detectOpenHandles",  # Run tests
  "test:watch": "jest --watch"         # Run tests in watch mode
}
```

---

## File Sizes & Complexity

### By Module

| Module | Files | Lines | Complexity |
|--------|-------|-------|------------|
| Auth | 5 | ~400 | Medium |
| Organizations | 5 | ~300 | Low |
| Users | 5 | ~400 | Medium |
| Core/Middleware | 7 | ~200 | Low |
| **Total** | **22** | **~1,300** | **Low-Medium** |

---

## API Endpoints Summary

### Authentication (5 endpoints)
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Organizations (5 endpoints)
```
GET    /api/organizations              (public, paginated)
GET    /api/organizations/:id          (public)
POST   /api/organizations              (admin)
PUT    /api/organizations/:id          (admin)
PATCH  /api/organizations/:id/deactivate (admin)
```

### Users (5 endpoints)
```
GET    /api/users                      (admin, paginated, filterable)
GET    /api/users/:id                  (admin)
POST   /api/users                      (admin, bcrypt password)
PUT    /api/users/:id                  (admin)
PATCH  /api/users/:id/deactivate       (admin)
```

### Health (1 endpoint)
```
GET    /api/health                     (public, status check)
```

**Total: 16 endpoints built**

---

## Code Quality Metrics

✅ **DRY**: Shared middleware, error handling, validation
✅ **SOLID**: Single responsibility per file
✅ **Modular**: Independent repositories/services
✅ **Testable**: All business logic in services
✅ **Secure**: Bcrypt, JWT, SQL injection prevention
✅ **Documented**: Inline comments, README files
✅ **Consistent**: Same pattern across modules
✅ **Error Handling**: Centralized with meaningful codes

---

## Performance Optimizations

✅ **Database Indexes**: On email, organization_id, status, due_date
✅ **Pagination**: Prevent loading all records
✅ **Soft Delete**: Avoid data loss, fast deactivation
✅ **Connection Pooling**: pg.Pool for efficient connections
✅ **Middleware Order**: Fast checks first (validate → auth → business logic)
✅ **Error Catching**: asyncHandler prevents unhandled rejections

---

## Security Checklist

✅ Password hashing with bcrypt (10 rounds)
✅ JWT authentication & authorization
✅ Email uniqueness constraints
✅ SQL injection prevention (parameterized queries)
✅ Input validation (Joi schemas)
✅ Role-based access control
✅ Soft delete (no hard deletion)
✅ Error sanitization (no stack traces in responses)
✅ Self-protection (users can't escalate own role)
✅ CORS configured
✅ Helmet security headers

---

## Next Phase: Audit Module

To continue building, create:

```
src/
├── repositories/
│   ├── audit.repository.js
│   └── audit_assignment.repository.js
├── services/
│   ├── audit.service.js
│   └── audit_assignment.service.js
├── controllers/
│   ├── audit.controller.js
│   └── audit_assignment.controller.js
├── validators/
│   ├── audit.validator.js
│   └── audit_assignment.validator.js
└── routes/
    └── audit.routes.js
```

Will reference:
- organizations (organization_id FK)
- users (created_by, assigned_to FKs)
- audits table structure from schema.sql
