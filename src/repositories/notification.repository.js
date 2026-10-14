const pool = require('../config/db');

const notificationRepository = {
  async create(userId, message, relatedEntityType, relatedEntityId) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, message, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, message, is_read, related_entity_type, related_entity_id, created_at, updated_at`,
      [userId, message, relatedEntityType || null, relatedEntityId || null]
    );
    return result.rows[0];
  },

  async findByUser(userId, limit, offset) {
    const result = await pool.query(
      `SELECT id, user_id, message, is_read, related_entity_type, related_entity_id, created_at, updated_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY is_read ASC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async countByUser(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  async markRead(id, userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, message, is_read, related_entity_type, related_entity_id, created_at, updated_at`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async markAllRead(userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return result.rowCount;
  },
};

module.exports = notificationRepository;