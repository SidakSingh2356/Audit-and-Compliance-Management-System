const pool = require('../config/db');

const organizationRepository = {
  async findAll(limit = 10, offset = 0, searchName = null) {
    let query = 'SELECT id, name, contact_info, industry, is_active, created_at, updated_at FROM organizations';
    const params = [];

    if (searchName) {
      query += ' WHERE name ILIKE $1';
      params.push(`%${searchName}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  async count(searchName = null) {
    let query = 'SELECT COUNT(*) as count FROM organizations';
    const params = [];

    if (searchName) {
      query += ' WHERE name ILIKE $1';
      params.push(`%${searchName}%`);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, name, contact_info, industry, is_active, created_at, updated_at FROM organizations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create(name, contactInfo, industry) {
    const result = await pool.query(
      `INSERT INTO organizations (name, contact_info, industry, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, name, contact_info, industry, is_active, created_at, updated_at`,
      [name, contactInfo, industry]
    );
    return result.rows[0];
  },

  async update(id, name, contactInfo, industry) {
    const result = await pool.query(
      `UPDATE organizations SET name = $1, contact_info = $2, industry = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, contact_info, industry, is_active, created_at, updated_at`,
      [name, contactInfo, industry, id]
    );
    return result.rows[0] || null;
  },

  async deactivate(id) {
    const result = await pool.query(
      `UPDATE organizations SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, is_active, updated_at`,
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = organizationRepository;
