const dashboardRepository = require('../repositories/dashboard.repository');
const ApiError = require('../utils/ApiError');

const dashboardService = {
  async getDashboard(user) {
    if (user.role === 'admin') {
      return dashboardRepository.getAdminDashboard();
    }
    if (user.role === 'auditor') {
      return dashboardRepository.getAuditorDashboard(user.id);
    }
    if (user.role === 'client') {
      return dashboardRepository.getClientDashboard(user.organizationId);
    }
    throw new ApiError('Unsupported user role', 403, 'FORBIDDEN');
  },
};

module.exports = dashboardService;