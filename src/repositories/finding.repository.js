const pool = require('../config/db');

const findingRepository = {
  async findById(id) {
    const result = await pool.query(
      `SELECT f.id, f.audit_id, f.title, f.description, f.severity, f.status,
              f.assigned_to, f.due_date, f.created_by, f.created_at, f.updated_at,
              a.organization_id
       FROM findings f
       JOIN audits a ON a.id = f.audit_id
       WHERE f.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findAll(auditId, severity, status, user) {
    const params = [auditId];
    let query = `
      SELECT f.id, f.audit_id, f.title, f.description, f.severity, f.status,
             f.assigned_to, f.due_date, f.created_by, f.created_at, f.updated_at
      FROM findings f
      JOIN audits a ON a.id = f.audit_id
      WHERE f.audit_id = $1`;

    if (user.role === 'client') {
      params.push(user.organizationId);
      query += ` AND a.organization_id = $${params.length}`;
    } else if (user.role === 'auditor') {
      params.push(user.id);
      query += ` AND EXISTS (
        SELECT 1 FROM audit_assignments aa
        WHERE aa.audit_id = f.audit_id AND aa.auditor_id = $${params.length}
      )`;
    }
    if (severity) {
      params.push(severity);
      query += ` AND f.severity = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND f.status = $${params.length}`;
    }
    query += ' ORDER BY f.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  },

  async create(auditId, title, description, severity, assignedTo, dueDate, createdBy) {
    const result = await pool.query(
      `INSERT INTO findings (audit_id, title, description, severity, assigned_to, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, audit_id, title, description, severity, status, assigned_to, due_date, created_by, created_at, updated_at`,
      [auditId, title, description, severity, assignedTo, dueDate, createdBy]
    );
    return result.rows[0];
  },

  async createComment(findingId, userId, commentText) {
    const result = await pool.query(
      `INSERT INTO finding_comments (finding_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING id, finding_id, user_id, comment_text, created_at, updated_at`,
      [findingId, userId, commentText]
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE findings
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, audit_id, title, description, severity, status, assigned_to, due_date, created_by, created_at, updated_at`,
      [status, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = findingRepository;