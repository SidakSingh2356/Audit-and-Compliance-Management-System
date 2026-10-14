const pool = require('../config/db');

const userRepository = {
  async findAll(limit = 10, offset = 0, organizationId = null, role = null) {
    let query = 'SELECT id, email, role, organization_id, full_name, is_active, created_at, updated_at FROM users';
    const params = [];
    const conditions = [];

    if (organizationId) {
      conditions.push(`organization_id = $${params.length + 1}`);
      params.push(organizationId);
    }

    if (role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  async count(organizationId = null, role = null) {
    let query = 'SELECT COUNT(*) as count FROM users';
    const params = [];
    const conditions = [];

    if (organizationId) {
      conditions.push(`organization_id = $${params.length + 1}`);
      params.push(organizationId);
    }

    if (role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, organization_id, full_name, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByOrganizationAndRole(organizationId, role) {
    const result = await pool.query(
      `SELECT id, email, role, organization_id, full_name, is_active
       FROM users
       WHERE organization_id = $1 AND role = $2 AND is_active = TRUE`,
      [organizationId, role]
    );
    return result.rows;
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, organization_id, full_name, is_active, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  async create(email, passwordHash, role, organizationId, fullName) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, organization_id, full_name, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, role, organization_id, full_name, is_active, created_at, updated_at`,
      [email, passwordHash, role, organizationId, fullName]
    );
    return result.rows[0];
  },

  async update(id, email, role, fullName) {
    const result = await pool.query(
      `UPDATE users SET email = $1, role = $2, full_name = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, role, organization_id, full_name, is_active, created_at, updated_at`,
      [email, role, fullName, id]
    );
    return result.rows[0] || null;
  },

  async updateRefreshToken(userId, refreshToken) {
    // Store refresh token in a separate table (for token management and logout)
    // For now, we'll use a simple in-memory approach or session-based
    // This would require a refresh_tokens table in production
    // Placeholder for future implementation
    return true;
  },

  async updatePassword(userId, newPasswordHash) {
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email',
      [newPasswordHash, userId]
    );
    return result.rows[0];
  },

  async deactivate(id) {
    const result = await pool.query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, role, is_active, updated_at`,
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = userRepository;
