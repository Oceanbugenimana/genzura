const prisma = require('../config/prisma');
const logger = require('../utils/logger');

/**
 * Creates an audit log entry.
 * Call this helper from controllers after mutations.
 */
const createAuditLog = async ({ userId, storeId, action, entity, entityId, oldValues, newValues, req }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        storeId: storeId || null,
        action,
        entity,
        entityId,
        oldValues: oldValues || null,
        newValues: newValues || null,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    });
  } catch (err) {
    logger.error('Failed to create audit log:', err);
  }
};

module.exports = { createAuditLog };
