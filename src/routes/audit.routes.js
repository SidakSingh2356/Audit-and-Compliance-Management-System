const express = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const auditValidator = require('../validators/audit.validator');

const router = express.Router();

// All audit routes require authentication
router.use(authenticate);

// GET all audits - all authenticated users can view (filtering by role in service)
router.get('/', auditController.getAll);

// GET audit detail - all authenticated users can view (filtering by role in service)
router.get('/:id', auditController.getById);

// POST create audit - admin only
router.post('/', authorize('admin'), validate(auditValidator.create), auditController.create);

// PUT update audit - admin only
router.put('/:id', authorize('admin'), validate(auditValidator.update), auditController.update);

// POST assign auditor - admin only
router.post('/:id/assign', authorize('admin'), validate(auditValidator.assign), auditController.assign);

module.exports = router;
