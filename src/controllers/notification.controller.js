const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

const notificationController = {
  list: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await notificationService.getNotifications(req.user.id, page, limit);

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(
      parseInt(req.params.id, 10),
      req.user.id
    );
    res.json({ success: true, data: notification });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const result = await notificationService.markAllRead(req.user.id);
    res.json({ success: true, data: result });
  }),
};

module.exports = notificationController;