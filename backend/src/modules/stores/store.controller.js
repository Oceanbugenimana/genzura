const prisma = require('../../config/prisma');
const { success, created, notFound, paginated, buildPagination } = require('../../utils/apiResponse');
const { createAuditLog } = require('../../middleware/audit.middleware');

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: List all stores
 *     tags: [Stores]
 */
const getStores = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isArchived = 'false' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      deletedAt: null,
      isArchived: isArchived === 'true',
      ...(search && {
        OR: [
          { name: { contains: search } },
          { location: { contains: search } },
        ],
      }),
      // Non-admins only see their managed stores
      ...(req.user.role === 'STAFF' && { managerId: req.user.id }),
    };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          manager: { select: { id: true, fullName: true, email: true } },
          _count: { select: { products: true } },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return paginated(res, stores, buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 */
const getStoreById = async (req, res, next) => {
  try {
    const store = await prisma.store.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        manager: { select: { id: true, fullName: true, email: true } },
        _count: { select: { products: true } },
      },
    });
    if (!store) return notFound(res, 'Store not found.');
    return success(res, store);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 */
const createStore = async (req, res, next) => {
  try {
    const { name, category, location, description, managerId } = req.body;

    const store = await prisma.store.create({
      data: { name, category, location, description, managerId },
      include: { manager: { select: { id: true, fullName: true, email: true } } },
    });

    await createAuditLog({
      userId: req.user.id,
      storeId: store.id,
      action: 'CREATE_STORE',
      entity: 'Store',
      entityId: store.id,
      newValues: { name, location },
      req,
    });

    return created(res, store, 'Store created successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update store
 *     tags: [Stores]
 */
const updateStore = async (req, res, next) => {
  try {
    const existing = await prisma.store.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'Store not found.');

    const { name, category, location, description, managerId, isArchived } = req.body;

    const updated = await prisma.store.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(managerId !== undefined && { managerId }),
        ...(isArchived !== undefined && { isArchived }),
      },
      include: { manager: { select: { id: true, fullName: true, email: true } } },
    });

    await createAuditLog({
      userId: req.user.id,
      storeId: req.params.id,
      action: 'UPDATE_STORE',
      entity: 'Store',
      entityId: req.params.id,
      oldValues: existing,
      newValues: updated,
      req,
    });

    return success(res, updated, 'Store updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Soft delete store
 *     tags: [Stores]
 */
const deleteStore = async (req, res, next) => {
  try {
    const existing = await prisma.store.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'Store not found.');

    await prisma.store.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isArchived: true },
    });

    await createAuditLog({
      userId: req.user.id,
      storeId: req.params.id,
      action: 'DELETE_STORE',
      entity: 'Store',
      entityId: req.params.id,
      req,
    });

    return success(res, null, 'Store deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getStores, getStoreById, createStore, updateStore, deleteStore };
