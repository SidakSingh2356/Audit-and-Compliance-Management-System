# Audit & Compliance Management System

A full-stack audit and compliance management application with a React frontend, an Express REST API, and PostgreSQL persistence. The system supports organization administration, user and role management, audit workflows, document requests/uploads, findings, notifications, and role-aware dashboards.

## Current Status

The backend modules and API routes are implemented for authentication, organizations, users, audits, documents, findings, notifications, and dashboards.

The frontend is a working Vite/React shell with authentication, protected routing, dashboards, organization management, user management, audit listing, and audit detail pages. The `/findings`, `/documents`, and `/notifications` frontend routes currently render placeholder views even though their backend API routes exist.

## Technology Stack

- **Frontend:** React 18, React Router 6, Axios, Vite
- **Backend:** Node.js, Express 4
- **Database:** PostgreSQL
- **Authentication:** JWT access and refresh tokens
- **Security:** Helmet, CORS, Morgan logging, bcrypt password hashing, Joi validation, parameterized PostgreSQL queries
- **File uploads:** Multer, stored in the root `uploads/` directory
- **Testing:** Jest and Supertest

## Features

- JWT login, refresh, logout, forgot-password, and reset-password flows
- Role-based access control for `admin`, `auditor`, and `client` users
- Organization creation, updates, public reads, and soft deactivation
- Admin-only user management with pagination, filters, bcrypt password hashing, and soft deactivation
- Audit creation, updates, pagination, search, status filtering, and auditor assignment
- Role-aware audit visibility:
  - Admins can access all audits
  - Auditors can access assigned audits
  - Clients can access audits belonging to their organization
- Document request creation, document listing, upload, and review workflows
- Findings, comments, resolution, and closure workflows
- Role-specific dashboard API endpoints
- Authenticated notifications with mark-one-read and mark-all-read actions
- Centralized validation and error responses
- Health check at `GET /api/health`

## Project Structure

```text
.
├── server.js                 # Backend entry point
├── package.json              # Backend scripts and dependencies
├── schema.sql                # PostgreSQL schema
├── scripts/
│   ├── migrate.js            # Applies schema.sql
│   └── seed.js               # Seeds organizations and test users
├── src/
│   ├── app.js                # Express middleware and route setup
│   ├── config/               # Database and environment configuration
│   ├── controllers/          # HTTP handlers
│   ├── middleware/           # Auth, validation, uploads, and errors
│   ├── repositories/         # PostgreSQL access layer
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic and access rules
│   ├── utils/                # ApiError and async handler helpers
│   └── validators/            # Joi request schemas
├── uploads/                  # Uploaded documents
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/              # Axios API client
│       ├── components/       # Layout and shared panels
│       ├── context/          # Authentication state
│       ├── pages/            # Application pages
│       └── routes/           # Protected and public routes
└── postman/                  # Collections, environments, mocks, and flows
```

Each backend module follows this flow:

```text
Route -> Middleware -> Controller -> Service -> Repository -> PostgreSQL
```

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL 13 or newer
- A PostgreSQL database created for this application

## Installation

Install backend dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Environment Configuration

Create a `.env` file in the project root. Do not commit real secrets.

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=audit_compliance
DB_USER=postgres
DB_PASSWORD=your-postgres-password

JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

The backend requires `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. `PORT` defaults to `3000`; the frontend Vite proxy expects the API at `http://127.0.0.1:3000`.

To use a different API URL from the frontend, create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Without this variable, the frontend uses `/api` and Vite proxies it to the backend during development.

## Database Setup

Create the PostgreSQL database, then apply the schema and seed data:

```bash
npm run migrate
npm run seed
```

The migration script reads the database connection values from `.env` and applies `schema.sql`. The schema creates tables for organizations, users, audits, assignments, document requests, documents, findings, comments, notifications, and activity logs.

## Running the Application

Run the backend from the project root:

```bash
npm run dev
```

The API is available at `http://localhost:3000`.

Run the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

The web application is available at `http://localhost:5173`.

For a production-style backend process:

```bash
npm start
```

To build and preview the frontend:

```bash
cd frontend
npm run build
npm run preview
```

## Seed Accounts

After `npm run seed`, the following accounts are available:

| Email | Password | Role | Access |
|---|---|---|---|
| `admin@example.com` | `admin123456` | `admin` | Full administrative access |
| `auditor@example.com` | `auditor123456` | `auditor` | Assigned audits, document review, findings workflow |
| `testuser@example.com` | `testuser123` | `client` | Organization audits, document uploads, finding comments/resolution |

Change or remove these development credentials before using the application outside local testing.

## Frontend Routes

| Route | Access | Current view |
|---|---|---|
| `/login` | Public | Login form |
| `/dashboard` | Authenticated | Dashboard |
| `/organizations` | Admin | Organization management |
| `/users` | Admin | User management |
| `/audits` | Admin in current route configuration | Audit list |
| `/audits/:id` | Authenticated | Audit detail |
| `/findings` | Authenticated | Placeholder view |
| `/documents` | Authenticated | Placeholder view |
| `/notifications` | Authenticated | Placeholder view |

The frontend stores the access token, refresh token, and logged-in user in `localStorage`. Axios automatically sends the access token as a Bearer token.

## API Reference

All API endpoints are prefixed with `/api`. Successful responses generally use `{ "success": true, "data": ... }`; errors use `{ "success": false, "message": ..., "errorCode": ... }`.

### Health and Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/login` | Public | Log in and receive access/refresh tokens |
| POST | `/api/auth/refresh` | Public | Issue a new access token |
| POST | `/api/auth/forgot-password` | Public | Create a password reset token |
| POST | `/api/auth/reset-password` | Public | Reset a password |
| POST | `/api/auth/logout` | Authenticated | Log out the current user |

### Organizations

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/organizations` | Public | Paginated, searchable organization list |
| GET | `/api/organizations/:id` | Public | Get an organization |
| POST | `/api/organizations` | Admin | Create an organization |
| PUT | `/api/organizations/:id` | Admin | Update an organization |
| PATCH | `/api/organizations/:id/deactivate` | Admin | Soft-deactivate an organization |

### Users

All user endpoints require an admin Bearer token.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users` | Paginated users with organization and role filters |
| GET | `/api/users/:id` | Get a user |
| POST | `/api/users` | Create a user |
| PUT | `/api/users/:id` | Update a user |
| PATCH | `/api/users/:id/deactivate` | Soft-deactivate a user |

### Audits

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/audits` | Authenticated | List audits with role-aware filtering, pagination, search, and status filters |
| GET | `/api/audits/:id` | Authenticated | Get audit details and related data |
| POST | `/api/audits` | Admin | Create an audit |
| PUT | `/api/audits/:id` | Admin | Update an audit |
| POST | `/api/audits/:id/assign` | Admin | Assign an auditor |

### Documents

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/documents/requests` | Auditor | Create a document request |
| GET | `/api/documents/requests` | Authenticated | List document requests by audit |
| POST | `/api/documents/upload` | Authenticated | Upload a document using multipart form data |
| POST | `/api/documents/:id/review` | Auditor | Review a document |

### Findings

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/findings` | Auditor | Create a finding |
| GET | `/api/findings` | Authenticated | List findings with query validation |
| POST | `/api/findings/:id/comments` | Auditor or client | Add a comment |
| POST | `/api/findings/:id/resolve` | Client | Resolve a finding |
| POST | `/api/findings/:id/close` | Auditor | Close a finding |

### Notifications and Dashboards

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/notifications` | Authenticated | List notifications |
| PATCH | `/api/notifications/read-all` | Authenticated | Mark all notifications read |
| PATCH | `/api/notifications/:id/read` | Authenticated | Mark one notification read |
| GET | `/api/dashboard/admin` | Admin | Admin dashboard data |
| GET | `/api/dashboard/auditor` | Auditor | Auditor dashboard data |
| GET | `/api/dashboard/client` | Client | Client dashboard data |

Use the `Authorization: Bearer <accessToken>` header for protected endpoints.

Example login request:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123456"}'
```

More detailed endpoint examples are available in [AUTH_API_GUIDE.md](AUTH_API_GUIDE.md), [ORGANIZATIONS_USERS_API.md](ORGANIZATIONS_USERS_API.md), and [AUDITS_API.md](AUDITS_API.md).

## Database Model

The main PostgreSQL entities are:

- `organizations`: organizations under audit
- `users`: accounts linked to organizations and assigned roles
- `audits`: audit records and lifecycle status
- `audit_assignments`: auditor-to-audit assignments
- `document_requests`: requested evidence for an audit
- `documents`: uploaded evidence and review metadata
- `findings`: audit issues with severity, status, assignment, and due dates
- `finding_comments`: discussion on findings
- `notifications`: user notifications and read status
- `activity_logs`: audit trail records

Important enum values include audit statuses (`Draft`, `Pending`, `In Progress`, `Under Review`, `Completed`, `Cancelled`, `Overdue`), finding severities (`Critical`, `High`, `Medium`, `Low`), and user roles (`admin`, `auditor`, `client`).

## Testing

Backend test commands:

```bash
npm test
npm run test:watch
```

Useful manual checks:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/organizations
```

The repository also includes Postman collections and supporting files under `postman/`. See [TESTING_GUIDE.md](TESTING_GUIDE.md) for seeded-user and endpoint test flows.

## Security and Operational Notes

- Store secrets only in environment variables.
- Use HTTPS and restrictive `CORS_ORIGIN` in deployed environments.
- Replace the development seed credentials before deployment.
- Uploaded files are written to `uploads/`; configure storage and file policies for production.
- JWT access tokens are short-lived by default (`15m`) and refresh tokens are long-lived by default (`7d`).
- The API uses Helmet, request logging, Joi validation, centralized errors, role authorization, and parameterized SQL queries.

## Additional Documentation

- [AUTH_API_GUIDE.md](AUTH_API_GUIDE.md): authentication endpoints and behavior
- [AUDITS_API.md](AUDITS_API.md): audit endpoint reference
- [ORGANIZATIONS_USERS_API.md](ORGANIZATIONS_USERS_API.md): organization and user endpoint reference
- [DEVELOPER_CHEATSHEET.md](DEVELOPER_CHEATSHEET.md): commands and curl examples
- [TESTING_GUIDE.md](TESTING_GUIDE.md): manual testing workflow
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md): layered architecture overview
- [schema.sql](schema.sql): complete database schema
