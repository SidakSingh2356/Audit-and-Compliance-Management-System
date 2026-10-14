const express = require('express');
const organizationController = require('../controllers/organization.controller');
const organizationValidator = require('../validators/organization.validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', organizationController.getAll);
router.get('/:id', organizationController.getById);

// Admin-only routes
router.post('/', authenticate, authorize('admin'), validate(organizationValidator.create), organizationController.create);
router.put('/:id', authenticate, authorize('admin'), validate(organizationValidator.update), organizationController.update);
router.patch('/:id/deactivate', authenticate, authorize('admin'), organizationController.deactivate);

module.exports = router;
