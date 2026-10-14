const auditRepository = require('../repositories/audit.repository');
const findingRepository = require('../repositories/finding.repository');
const userRepository = require('../repositories/user.repository');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');

const findingService = {
  async getFinding(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new ApiError('Finding ID must be a positive integer', 400, 'VALIDATION_ERROR');
    }
    const finding = await findingRepository.findById(id);
    if (!finding) {
      throw new ApiError('Finding not found', 404, 'FINDING_NOT_FOUND');
    }
    return finding;
  },

  async assertAccess(finding, user) {
    if (user.role === 'client' && finding.organization_id !== user.organizationId) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    if (user.role === 'auditor' && !(await auditRepository.isAuditorAssignedToAudit(finding.audit_id, user.id))) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
  },

  async create(auditId, title, description, severity, assignedTo, dueDate, user) {
    if (!Number.isSafeInteger(auditId) || auditId <= 0) {
      throw new ApiError('Audit ID must be a positive integer', 400, 'VALIDATION_ERROR');
    }
    if (user.role !== 'auditor') {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');
    }
    if (!(await auditRepository.isAuditorAssignedToAudit(auditId, user.id))) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    const finding = await findingRepository.create(
      auditId,
      title,
      description || null,
      severity,
      assignedTo || null,
      dueDate || null,
      user.id
    );
    if (finding.assigned_to) {
      const assignee = await userRepository.findById(finding.assigned_to);
      if (assignee && ['client', 'auditor'].includes(assignee.role)) {
        await notificationService.createNotification(
          assignee.id,
          `New finding assigned: ${finding.title}`,
          'finding',
          finding.id
        );
      }
    }
    return finding;
  },

  async list(auditId, severity, status, user) {
    if (!Number.isSafeInteger(auditId) || auditId <= 0) {
      throw new ApiError('auditId query parameter is required', 400, 'VALIDATION_ERROR');
    }
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');
    }
    if (user.role === 'auditor' && !(await auditRepository.isAuditorAssignedToAudit(auditId, user.id))) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    if (user.role === 'client' && audit.organization_id !== user.organizationId) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    return findingRepository.findAll(auditId, severity, status, user);
  },

  async addComment(id, commentText, user) {
    if (!['auditor', 'client'].includes(user.role)) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    const finding = await this.getFinding(id);
    await this.assertAccess(finding, user);
    return findingRepository.createComment(id, user.id, commentText);
  },

  async resolve(id, user) {
    if (user.role !== 'client') {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    const finding = await this.getFinding(id);
    await this.assertAccess(finding, user);
    if (!['Open', 'In Progress'].includes(finding.status)) {
      throw new ApiError('Finding cannot be resolved from its current status', 409, 'INVALID_STATUS_TRANSITION');
    }
    const resolvedFinding = await findingRepository.updateStatus(id, 'Resolved');
    const auditors = await auditRepository.getAssignedAuditors(finding.audit_id);
    await Promise.all(auditors.map((auditor) => notificationService.createNotification(
      auditor.id,
      `Finding resolution submitted: ${finding.title}`,
      'finding',
      finding.id
    )));
    return resolvedFinding;
  },

  async close(id, user) {
    if (user.role !== 'auditor') {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    const finding = await this.getFinding(id);
    await this.assertAccess(finding, user);
    if (finding.status !== 'Resolved') {
      throw new ApiError('Finding must be resolved before it can be closed', 409, 'INVALID_STATUS_TRANSITION');
    }
    return findingRepository.updateStatus(id, 'Closed');
  },
};

module.exports = findingService;