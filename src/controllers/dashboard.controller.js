const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const dashboardController = {
  get: asyncHandler(async (req, res) => {
    const dashboard = await dashboardService.getDashboard(req.user);
    res.json({ success: true, data: dashboard });
  }),
};

module.exports = dashboardController;