const express = require('express');
const router = express.Router();
const controller = require('./notification.controller');
const { authenticate, adminOnly } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: WhatsApp notification management
 */

router.use(authenticate);

router.get('/', controller.getNotifications);
router.get('/stats', adminOnly, controller.getStats);
router.get('/:id', controller.getNotificationById);
router.post('/retry', adminOnly, controller.retryFailed);

module.exports = router;
