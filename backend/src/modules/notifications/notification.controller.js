const prisma = require('../../config/prisma');
const { success, paginated, buildPagination, notFound } = require('../../utils/apiResponse');
const { retryFailedNotifications } = require('../../services/notification.service');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notification history
 *     tags: [Notifications]
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(req.user.role !== 'ADMIN' && { userId: req.user.id }),
      ...(status && { status }),
      ...(type && { type }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, fullName: true } },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return paginated(res, notifications, buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 */
const getNotificationById = async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!notification) return notFound(res, 'Notification not found.');
    return success(res, notification);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/notifications/retry:
 *   post:
 *     summary: Retry all failed notifications
 *     tags: [Notifications]
 */
const retryFailed = async (req, res, next) => {
  try {
    await retryFailedNotifications();
    return success(res, null, 'Retry job triggered successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 */
const getStats = async (req, res, next) => {
  try {
    const [total, sent, failed, pending] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
      prisma.notification.count({ where: { status: 'PENDING' } }),
    ]);
    return success(res, { total, sent, failed, pending });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, getNotificationById, retryFailed, getStats };
