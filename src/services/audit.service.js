const auditRepository = require('../repositories/audit.repository');
const userRepository = require('../repositories/user.repository');
const organizationRepository = require('../repositories/organization.repository');
const ApiError = require('../utils/ApiError');

const auditService = {
  async getAllAudits(page = 1, limit = 10, filters = {}, user) {
    const offset = (page - 1) * limit;
    const result = await auditRepository.findAllForUser(limit, offset, filters, user);
    return {
      audits: result.rows,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    };
  },

  async getAuditById(id, user) {
    const audit = await auditRepository.getAuditDetail(id);

    if (!audit) {
      throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');
    }

    // Check access based on role
    if (user.role === 'client') {
      if (String(audit.organization_id) !== String(user.organizationId)) {
        throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
      }
    } else if (user.role === 'auditor') {
      // Check if auditor is assigned to this audit
      const isAssigned = await auditRepository.isAuditorAssignedToAudit(id, user.id);
      if (!isAssigned) {
        throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
      }
    }
    // admin has full access

    return audit;
  },

  async createAudit(title, description, organizationId, startDate, dueDate, createdBy) {
    // Validate required fields
    if (!title || title.trim() === '') {
      throw new ApiError('Audit title is required', 400, 'INVALID_INPUT');
    }

    if (!organizationId) {
      throw new ApiError('Organization ID is required', 400, 'INVALID_INPUT');
    }

    // Verify organization exists
    const org = await organizationRepository.findById(organizationId);
    if (!org) {
      throw new ApiError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
    }

    // Verify creator exists
    const creator = await userRepository.findById(createdBy);
    if (!creator) {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    const audit = await auditRepository.create(
      title,
      description || null,
      organizationId,
      startDate || null,
      dueDate || null,
      createdBy
    );

    return audit;
  },

  async updateAudit(id, title, description, status, startDate, dueDate) {
    const audit = await auditRepository.findById(id);

    if (!audit) {
      throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');
    }

    // Validate status is valid enum value
    const validStatuses = ['Draft', 'Pending', 'In Progress', 'Under Review', 'Completed', 'Cancelled', 'Overdue'];
    if (status && !validStatuses.includes(status)) {
      throw new ApiError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400,
        'INVALID_STATUS'
      );
    }

    const updatedAudit = await auditRepository.update(
      id,
      title !== undefined ? title : audit.title,
      description !== undefined ? description : audit.description,
      status !== undefined ? status : audit.status,
      startDate !== undefined ? startDate : audit.start_date,
      dueDate !== undefined ? dueDate : audit.due_date
    );

    return updatedAudit;
  },

  async assignAuditor(auditId, auditorId, assignedBy, user) {
    // Verify audit exists and user has access
    const audit = await auditRepository.findById(auditId);

    if (!audit) {
      throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');
    }

    // Only admin can assign auditors
    if (user.role !== 'admin') {
      throw new ApiError('Only admins can assign auditors', 403, 'FORBIDDEN');
    }

    // Verify auditor exists and is actually an auditor
    const auditor = await userRepository.findById(auditorId);

    if (!auditor) {
      throw new ApiError('Auditor not found', 404, 'USER_NOT_FOUND');
    }

    if (auditor.role !== 'auditor') {
      throw new ApiError('User must have auditor role to be assigned to audits', 400, 'INVALID_INPUT');
    }

    // Create assignment (handles duplicate check)
    const assignment = await auditRepository.assignAuditor(auditId, auditorId, assignedBy);

    return {
      auditId,
      auditorId,
      auditorEmail: auditor.email,
      auditorName: auditor.full_name,
      assignedBy,
      assignmentDate: assignment.assignment_date,
    };
  },
};

module.exports = auditService;
