const express = require('express');
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const documentUpload = require('../middleware/documentUpload');
const documentValidator = require('../validators/document.validator');

const router = express.Router();

router.use(authenticate);

router.post('/requests', authorize('auditor'), validate(documentValidator.createRequest), documentController.createRequest);
router.get('/requests', documentController.getRequestsByAuditId);
router.post('/upload', documentUpload, documentController.upload);
router.post('/:id/review', authorize('auditor'), validate(documentValidator.review), documentController.review);

module.exports = router;