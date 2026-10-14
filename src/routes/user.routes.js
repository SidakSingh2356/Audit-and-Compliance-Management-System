const express = require('express');
const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// Get all users (with pagination and filters)
router.get('/', userController.getAll);

// Get single user
router.get('/:id', userController.getById);

// Create new user
router.post('/', validate(userValidator.create), userController.create);

// Update user
router.put('/:id', validate(userValidator.update), userController.update);

// Deactivate user
router.patch('/:id/deactivate', userController.deactivate);

module.exports = router;
