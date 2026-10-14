const notificationRepository = require('../repositories/notification.repository');
const ApiError = require('../utils/ApiError');

const createNotification = (userId, message, relatedEntityType, relatedEntityId) => {
  return notificationRepository.create(userId, message, relatedEntityType, relatedEntityId);
};

const notificationService = {
  createNotification,

  async getNotifications(userId, page = 1, limit = 10) {
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      throw new ApiError('Page and limit must be positive integers', 400, 'VALIDATION_ERROR');
    }
    const offset = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      notificationRepository.findByUser(userId, limit, offset),
      notificationRepository.countByUser(userId),
    ]);
    return {
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async markRead(id, userId) {
    const notification = await notificationRepository.markRead(id, userId);
    if (!notification) {
      throw new ApiError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }
    return notification;
  },

  async markAllRead(userId) {
    const count = await notificationRepository.markAllRead(userId);
    return { updated: count };
  },
};

module.exports = notificationService;