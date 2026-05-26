const express = require('express');
const router = express.Router();
const controller = require('./report.controller');
const { authenticate, managerOrAdmin, adminOnly } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytics and reporting
 */

router.use(authenticate);

router.get('/dashboard', controller.getDashboardStats);
router.get('/stock-movement', controller.getStockMovement);
router.get('/low-stock', controller.getLowStockReport);
router.get('/top-products', controller.getTopProducts);
router.get('/dead-stock', controller.getDeadStock);
router.get('/store-analytics', managerOrAdmin, controller.getStoreAnalytics);
router.get('/audit-logs', adminOnly, controller.getAuditLogs);

module.exports = router;
