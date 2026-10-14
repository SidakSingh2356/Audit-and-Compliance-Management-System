const pool = require('../config/db');

const documentRepository = {
  async createRequest(auditId, name, description, dueDate, createdBy) {
    const result = await pool.query(
      `INSERT INTO document_requests (audit_id, name, description, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, audit_id, name, description, due_date, status, created_by, created_at, updated_at`,
      [auditId, name, description, dueDate, createdBy]
    );
    return result.rows[0];
  },

  async findRequestsByAuditId(auditId) {
    
    const result = await pool.query(
      `SELECT id, audit_id, name, description, due_date, status, created_by, created_at, updated_at
       FROM document_requests
       WHERE audit_id = $1
       ORDER BY created_at DESC`,
      [auditId]
    );
    return result.rows;
  },

  async findRequestWithAudit(id) {
    const result = await pool.query(
      `SELECT dr.id, dr.audit_id, dr.name, dr.description, dr.due_date, dr.status,
              dr.created_by, a.organization_id
       FROM document_requests dr
       JOIN audits a ON a.id = dr.audit_id
       WHERE dr.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findDocumentWithRequestAudit(id) {
    const result = await pool.query(
      `SELECT d.id, d.document_request_id, d.uploaded_by, dr.audit_id, dr.name, a.organization_id
       FROM documents d
       JOIN document_requests dr ON dr.id = d.document_request_id
       JOIN audits a ON a.id = dr.audit_id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async createDocumentAndMarkUploaded({ requestId, originalName, storedName, mimeType, size, uploadedBy }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const documentResult = await client.query(
        `INSERT INTO documents (document_request_id, original_name, stored_name, mime_type, size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, document_request_id, original_name, stored_name, mime_type, size, uploaded_by, uploaded_at`,
        [requestId, originalName, storedName, mimeType, size, uploadedBy]
      );
      await client.query(
        `UPDATE document_requests
         SET status = 'Uploaded', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [requestId]
      );
      await client.query('COMMIT');
      return documentResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async reviewDocument(documentId, status, reviewComment) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const documentResult = await client.query(
        `UPDATE documents
         SET review_comment = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, document_request_id, original_name, stored_name, mime_type,
                   size, uploaded_by, review_comment, uploaded_at, created_at, updated_at`,
        [reviewComment, documentId]
      );
      const requestResult = await client.query(
        `UPDATE document_requests
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = (SELECT document_request_id FROM documents WHERE id = $2)
         RETURNING id, audit_id, name, description, due_date, status, created_by,
                   created_at, updated_at`,
        [status, documentId]
      );
      await client.query('COMMIT');
      return { document: documentResult.rows[0], request: requestResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = documentRepository;