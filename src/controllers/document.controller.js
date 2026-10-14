const documentService = require('../services/document.service');
const asyncHandler = require('../utils/asyncHandler');

const documentController = {
  createRequest: asyncHandler(async (req, res) => {
    const request = await documentService.createRequest(
      parseInt(req.body.auditId || req.body.audit_id, 10),
      req.body.name,
      req.body.description,
      req.body.dueDate,
      req.user
    );
    res.status(201).json({ success: true, data: request });
  }),

  getRequestsByAuditId: asyncHandler(async (req, res) => {
    const requests = await documentService.getRequestsByAuditId(
      parseInt(req.query.audit_id || req.query.auditId, 10),
      req.user
    );
    res.json({ success: true, data: requests });
  }),

  upload: asyncHandler(async (req, res) => {
    const document = await documentService.upload(
      req.file,
      req.body.document_request_id || req.body.documentRequestId || req.body.requestId,
      req.user
    );
    res.status(201).json({ success: true, data: document });
  }),

  review: asyncHandler(async (req, res) => {
    const request = await documentService.review(
      parseInt(req.params.id, 10),
      req.body.status,
      req.body.reviewComment || req.body.comment,
      req.user
    );
    res.json({ success: true, data: request });
  }),
};

module.exports = documentController;