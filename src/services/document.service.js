const fs = require('fs/promises');
const auditRepository = require('../repositories/audit.repository');
const documentRepository = require('../repositories/document.repository');
const notificationService = require('./notification.service');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');

const documentService = {
  async createRequest(auditId, name, description, dueDate, user) {
    if (!Number.isInteger(auditId)) {
      throw new ApiError('Audit ID must be a number', 400, 'VALIDATION_ERROR');
    }
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');
    }
    if (user.role !== 'auditor' || !(await auditRepository.isAuditorAssignedToAudit(auditId, user.id))) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    const request = await documentRepository.createRequest(
      auditId, name, description || null, dueDate || null, user.id
    );
    const clients = await userRepository.findByOrganizationAndRole(audit.organization_id, 'client');
    await Promise.all(clients.map((client) => notificationService.createNotification(
      client.id,
      `New document request: ${request.name}`,
      'document_request',
      request.id
    )));
    return request;
  },

  async getRequestsByAuditId(auditId, user) {
    if (!Number.isInteger(auditId)) {
      throw new ApiError('audit_id query parameter is required', 400, 'VALIDATION_ERROR');
    }
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw new ApiError('Audit not found', 404, 'AUDIT_NOT_FOUND');
    }
    if (user.role === 'client' && audit.organization_id !== user.organizationId) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    if (user.role === 'auditor' && !(await auditRepository.isAuditorAssignedToAudit(auditId, user.id))) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    return documentRepository.findRequestsByAuditId(auditId);
  },

  async upload(file, requestId, user) {
    if (!file) {
      throw new ApiError('A file is required', 400, 'FILE_REQUIRED');
    }
    const parsedRequestId = Number(requestId);
    if (!Number.isSafeInteger(parsedRequestId) || parsedRequestId <= 0) {
      await fs.unlink(file.path).catch(() => {});
      throw new ApiError(
        'A valid document_request_id field is required in the multipart form data',
        400,
        'VALIDATION_ERROR'
      );
    }
    const request = await documentRepository.findRequestWithAudit(parsedRequestId);
    if (!request) {
      await fs.unlink(file.path).catch(() => {});
      throw new ApiError('Document request not found', 404, 'DOCUMENT_REQUEST_NOT_FOUND');
    }
    if (user.role === 'client' && request.organization_id !== user.organizationId) {
      await fs.unlink(file.path).catch(() => {});
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    try {
      return await documentRepository.createDocumentAndMarkUploaded({
        requestId: parsedRequestId,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: user.id,
      });
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  },

  async review(id, status, reviewComment, user) {
    if (!Number.isInteger(id)) {
      throw new ApiError('Document ID must be a number', 400, 'VALIDATION_ERROR');
    }
    const document = await documentRepository.findDocumentWithRequestAudit(id);
    if (!document) {
      throw new ApiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }
    if (!(await auditRepository.isAuditorAssignedToAudit(document.audit_id, user.id))) {
      throw new ApiError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }
    const reviewedDocument = await documentRepository.reviewDocument(id, status, reviewComment || null);
    if (status === 'Rejected') {
      await notificationService.createNotification(
        document.uploaded_by,
        `Document rejected: ${document.name}`,
        'document',
        document.id
      );
    }
    return reviewedDocument;
  },
};

module.exports = documentService;