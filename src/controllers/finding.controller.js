const findingService = require('../services/finding.service');
const asyncHandler = require('../utils/asyncHandler');

const findingController = {
  create: asyncHandler(async (req, res) => {
    const finding = await findingService.create(
      req.body.auditId,
      req.body.title,
      req.body.description,
      req.body.severity,
      req.body.assignedTo,
      req.body.dueDate,
      req.user
    );
    res.status(201).json({ success: true, data: finding });
  }),

  list: asyncHandler(async (req, res) => {
    const findings = await findingService.list(
      parseInt(req.query.auditId, 10),
      req.query.severity,
      req.query.status,
      req.user
    );
    res.json({ success: true, data: findings });
  }),

  addComment: asyncHandler(async (req, res) => {
    const comment = await findingService.addComment(
      parseInt(req.params.id, 10),
      req.body.commentText,
      req.user
    );
    res.status(201).json({ success: true, data: comment });
  }),

  resolve: asyncHandler(async (req, res) => {
    const finding = await findingService.resolve(parseInt(req.params.id, 10), req.user);
    res.json({ success: true, data: finding });
  }),

  close: asyncHandler(async (req, res) => {
    const finding = await findingService.close(parseInt(req.params.id, 10), req.user);
    res.json({ success: true, data: finding });
  }),
};

module.exports = findingController;