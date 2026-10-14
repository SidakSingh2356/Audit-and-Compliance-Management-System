-- Audit & Compliance Management System schema

BEGIN;

CREATE TYPE user_role AS ENUM ('admin', 'auditor', 'client');
CREATE TYPE audit_status AS ENUM (
    'Draft',
    'Pending',
    'In Progress',
    'Under Review',
    'Completed',
    'Cancelled',
    'Overdue'
);
CREATE TYPE document_request_status AS ENUM (
    'Waiting for Upload',
    'Uploaded',
    'Under Review',
    'Accepted',
    'Rejected'
);
CREATE TYPE finding_severity AS ENUM ('Critical', 'High', 'Medium', 'Low');
CREATE TYPE finding_status AS ENUM (
    'Open',
    'In Progress',
    'Waiting for Client',
    'Resolved',
    'Closed'
);

CREATE TABLE organizations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    contact_info JSONB,
    industry TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    organization_id BIGINT NOT NULL,
    full_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
        ON DELETE RESTRICT
);

CREATE TABLE audits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    organization_id BIGINT NOT NULL,
    status audit_status NOT NULL DEFAULT 'Draft',
    start_date DATE,
    due_date DATE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audits_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
        ON DELETE RESTRICT,
    CONSTRAINT audits_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE RESTRICT,
    CONSTRAINT audits_date_order_check
        CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

CREATE TABLE audit_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    audit_id BIGINT NOT NULL,
    auditor_id BIGINT NOT NULL,
    assigned_by BIGINT NOT NULL,
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_assignments_audit_id_fkey
        FOREIGN KEY (audit_id) REFERENCES audits (id)
        ON DELETE CASCADE,
    CONSTRAINT audit_assignments_auditor_id_fkey
        FOREIGN KEY (auditor_id) REFERENCES users (id)
        ON DELETE RESTRICT,
    CONSTRAINT audit_assignments_assigned_by_fkey
        FOREIGN KEY (assigned_by) REFERENCES users (id)
        ON DELETE RESTRICT,
    CONSTRAINT audit_assignments_unique_assignment
        UNIQUE (audit_id, auditor_id)
);

CREATE TABLE document_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    audit_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status document_request_status NOT NULL DEFAULT 'Waiting for Upload',
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT document_requests_audit_id_fkey
        FOREIGN KEY (audit_id) REFERENCES audits (id)
        ON DELETE CASCADE,
    CONSTRAINT document_requests_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE RESTRICT
);

CREATE TABLE documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_request_id BIGINT NOT NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    review_comment TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_document_request_id_fkey
        FOREIGN KEY (document_request_id) REFERENCES document_requests (id)
        ON DELETE CASCADE,
    CONSTRAINT documents_uploaded_by_fkey
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
        ON DELETE RESTRICT,
    CONSTRAINT documents_size_check CHECK (size >= 0)
);

CREATE TABLE findings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    audit_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity finding_severity NOT NULL,
    status finding_status NOT NULL DEFAULT 'Open',
    assigned_to BIGINT,
    due_date DATE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT findings_audit_id_fkey
        FOREIGN KEY (audit_id) REFERENCES audits (id)
        ON DELETE CASCADE,
    CONSTRAINT findings_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES users (id)
        ON DELETE SET NULL,
    CONSTRAINT findings_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE RESTRICT
);

CREATE TABLE finding_comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    finding_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT finding_comments_finding_id_fkey
        FOREIGN KEY (finding_id) REFERENCES findings (id)
        ON DELETE CASCADE,
    CONSTRAINT finding_comments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE RESTRICT
);

CREATE TABLE notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity_type TEXT,
    related_entity_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE activity_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT,
    previous_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT activity_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_organization_id ON users (organization_id);
CREATE INDEX idx_audits_organization_id ON audits (organization_id);
CREATE INDEX idx_audits_created_by ON audits (created_by);
CREATE INDEX idx_audits_status ON audits (status);
CREATE INDEX idx_audits_due_date ON audits (due_date);
CREATE INDEX idx_audit_assignments_audit_id ON audit_assignments (audit_id);
CREATE INDEX idx_audit_assignments_auditor_id ON audit_assignments (auditor_id);
CREATE INDEX idx_document_requests_audit_id ON document_requests (audit_id);
CREATE INDEX idx_document_requests_status ON document_requests (status);
CREATE INDEX idx_document_requests_due_date ON document_requests (due_date);
CREATE INDEX idx_documents_document_request_id ON documents (document_request_id);
CREATE INDEX idx_findings_audit_id ON findings (audit_id);
CREATE INDEX idx_findings_status ON findings (status);
CREATE INDEX idx_findings_due_date ON findings (due_date);
CREATE INDEX idx_finding_comments_finding_id ON finding_comments (finding_id);
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs (entity_type, entity_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'organizations', 'users', 'audits', 'audit_assignments',
        'document_requests', 'documents', 'findings', 'finding_comments',
        'notifications', 'activity_logs'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE ON %I '
            'FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            table_name || '_set_updated_at', table_name
        );
    END LOOP;
END;
$$;

COMMIT;
