const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/admin', authorize('admin'), dashboardController.get);
router.get('/auditor', authorize('auditor'), dashboardController.get);
router.get('/client', authorize('client'), dashboardController.get);

module.exports = router;