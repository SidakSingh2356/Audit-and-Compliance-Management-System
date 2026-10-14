const pool = require('../config/db');

const auditRepository = {
  async findAll(limit = 10, offset = 0, filters = {}) {
    const { status, organizationId, search } = filters;
    let query = `
      SELECT id, title, description, organization_id, status, start_date, due_date, 
             created_by, created_at, updated_at 
      FROM audits
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND organization_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND title ILIKE $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  async findAllForUser(limit = 10, offset = 0, filters = {}, user) {
    const { status, organizationId, search } = filters;
    const params = [];
    let query = `
      SELECT DISTINCT a.id, a.title, a.description, a.organization_id, a.status,
             a.start_date, a.due_date, a.created_by, a.created_at, a.updated_at
      FROM audits a`;

    if (user.role === 'auditor') {
      query += ' JOIN audit_assignments aa ON aa.audit_id = a.id';
    }

    query += ' WHERE 1=1';
    if (user.role === 'auditor') {
      params.push(user.id);
      query += ' AND aa.auditor_id = $1';
    } else if (user.role === 'client') {
      params.push(user.organizationId);
      query += ' AND a.organization_id = $1';
    }

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (organizationId) {
      params.push(organizationId);
      query += ` AND a.organization_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND a.title ILIKE $${params.length}`;
    }

    const countQuery = query.replace(/^\s*SELECT DISTINCT[\s\S]*?FROM audits a/, 'SELECT COUNT(DISTINCT a.id) AS count FROM audits a');
    const countResult = await pool.query(countQuery, params);

    params.push(limit, offset);
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(query, params);

    return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async count(filters = {}) {
    const { status, organizationId, search } = filters;
    let query = 'SELECT COUNT(*) as count FROM audits WHERE 1=1';
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND organization_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND title ILIKE $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT id, title, description, organization_id, status, start_date, due_date, 
              created_by, created_at, updated_at 
       FROM audits WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getAuditDetail(id) {
    // Main audit
    const auditResult = await pool.query(
      `SELECT id, title, description, organization_id, status, start_date, due_date, 
              created_by, created_at, updated_at 
       FROM audits WHERE id = $1`,
      [id]
    );

    if (auditResult.rows.length === 0) {
      return null;
    }

    const audit = auditResult.rows[0];

    // Get assigned auditors
    const auditorsResult = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, aa.assignment_date
       FROM audit_assignments aa
       JOIN users u ON aa.auditor_id = u.id
       WHERE aa.audit_id = $1
       ORDER BY aa.assignment_date DESC`,
      [id]
    );

    // Get document requests
    const documentsResult = await pool.query(
      `SELECT id, name, description, due_date, status, created_by, created_at
       FROM document_requests
       WHERE audit_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // Get findings
    const findingsResult = await pool.query(
      `SELECT id, title, description, severity, status, assigned_to, due_date, created_by, created_at
       FROM findings
       WHERE audit_id = $1
       ORDER BY severity DESC, created_at DESC`,
      [id]
    );

    // Get recent activity logs
    const activityResult = await pool.query(
      `SELECT id, user_id, action, entity_type, entity_id, previous_value, new_value, ip_address, created_at
       FROM activity_logs
       WHERE entity_type = 'audit' AND entity_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [id]
    );

    return {
      ...audit,
      assignedAuditors: auditorsResult.rows,
      documentRequests: documentsResult.rows,
      findings: findingsResult.rows,
      recentActivity: activityResult.rows,
    };
  },

  async create(title, description, organizationId, startDate, dueDate, createdBy) {
    const result = await pool.query(
      `INSERT INTO audits (title, description, organization_id, start_date, due_date, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
       RETURNING id, title, description, organization_id, status, start_date, due_date, created_by, created_at, updated_at`,
      [title, description, organizationId, startDate, dueDate, createdBy]
    );
    return result.rows[0];
  },

  async update(id, title, description, status, startDate, dueDate) {
    const result = await pool.query(
      `UPDATE audits 
       SET title = $1, description = $2, status = $3, start_date = $4, due_date = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, title, description, organization_id, status, start_date, due_date, created_by, created_at, updated_at`,
      [title, description, status, startDate, dueDate, id]
    );
    return result.rows[0] || null;
  },

  async assignAuditor(auditId, auditorId, assignedBy) {
    // First check if already assigned (for reassignment check)
    const existing = await pool.query(
      'SELECT id FROM audit_assignments WHERE audit_id = $1 AND auditor_id = $2',
      [auditId, auditorId]
    );

    if (existing.rows.length > 0) {
      // Already assigned, just return the existing assignment
      return existing.rows[0];
    }

    // Insert new assignment
    const result = await pool.query(
      `INSERT INTO audit_assignments (audit_id, auditor_id, assigned_by, assignment_date)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING id, audit_id, auditor_id, assigned_by, assignment_date, created_at`,
      [auditId, auditorId, assignedBy]
    );
    return result.rows[0];
  },

  async getAssignedAuditors(auditId) {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, aa.assignment_date
       FROM audit_assignments aa
       JOIN users u ON aa.auditor_id = u.id
       WHERE aa.audit_id = $1`,
      [auditId]
    );
    return result.rows;
  },

  async isAuditorAssignedToAudit(auditId, auditorId) {
    const result = await pool.query(
      'SELECT id FROM audit_assignments WHERE audit_id = $1 AND auditor_id = $2',
      [auditId, auditorId]
    );
    return result.rows.length > 0;
  },
};

module.exports = auditRepository;
