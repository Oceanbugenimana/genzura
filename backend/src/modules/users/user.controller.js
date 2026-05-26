const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const { success, created, notFound, badRequest, paginated, buildPagination } = require('../../utils/apiResponse');
const { createAuditLog } = require('../../middleware/audit.middleware');

const SAFE_SELECT = {
  id: true, fullName: true, email: true, role: true,
  whatsappNumber: true, preferredLang: true, isActive: true, createdAt: true, updatedAt: true,
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Users]
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
        ],
      }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: SAFE_SELECT, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    return paginated(res, users, buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: SAFE_SELECT,
    });
    if (!user) return notFound(res, 'User not found.');
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Users]
 */
const updateUser = async (req, res, next) => {
  try {
    const { fullName, whatsappNumber, preferredLang, role, isActive } = req.body;

    const existing = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'User not found.');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(fullName && { fullName }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(preferredLang && { preferredLang }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: SAFE_SELECT,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: req.params.id,
      oldValues: existing,
      newValues: updated,
      req,
    });

    return success(res, updated, 'User updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Soft delete user (Admin only)
 *     tags: [Users]
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return badRequest(res, 'Cannot delete your own account.');

    const existing = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'User not found.');

    await prisma.user.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: req.params.id,
      req,
    });

    return success(res, null, 'User deleted successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Users]
 */
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, whatsappNumber, preferredLang } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(preferredLang && { preferredLang }),
      },
      select: SAFE_SELECT,
    });

    return success(res, updated, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, updateProfile };
