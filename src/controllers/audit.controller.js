const auditService = require('../services/audit.service');
const asyncHandler = require('../utils/asyncHandler');

const auditController = {
  getAll: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, organizationId, search } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (organizationId) filters.organizationId = parseInt(organizationId, 10);
    if (search) filters.search = search;

    const result = await auditService.getAllAudits(
      parseInt(page, 10),
      parseInt(limit, 10),
      filters,
      req.user
    );

    res.json({
      success: true,
      data: result.audits,
      pagination: result.pagination,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const audit = await auditService.getAuditById(parseInt(id, 10), req.user);

    res.json({
      success: true,
      data: audit,
    });
  }),

  create: asyncHandler(async (req, res) => {
    const { title, description, organizationId, startDate, dueDate } = req.body;

    const audit = await auditService.createAudit(
      title,
      description,
      organizationId,
      startDate,
      dueDate,
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: audit,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, status, startDate, dueDate } = req.body;

    const audit = await auditService.updateAudit(
      parseInt(id, 10),
      title,
      description,
      status,
      startDate,
      dueDate
    );

    res.json({
      success: true,
      data: audit,
    });
  }),

  assign: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { auditorId } = req.body;

    const result = await auditService.assignAuditor(
      parseInt(id, 10),
      auditorId,
      req.user.id,
      req.user
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  }),
};

module.exports = auditController;
