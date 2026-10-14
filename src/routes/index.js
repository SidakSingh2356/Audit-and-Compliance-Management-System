const express = require('express');
const authRoutes = require('./auth.routes');
const organizationRoutes = require('./organization.routes');
const userRoutes = require('./user.routes');
const auditRoutes = require('./audit.routes');
const documentRoutes = require('./document.routes');
const findingRoutes = require('./finding.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/audits', auditRoutes);
router.use('/documents', documentRoutes);
router.use('/findings', findingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
