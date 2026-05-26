const prisma = require('../../config/prisma');
const { success, created, notFound, badRequest, paginated, buildPagination } = require('../../utils/apiResponse');
const { createAuditLog } = require('../../middleware/audit.middleware');
const notificationService = require('../../services/notification.service');

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
  store: { select: { id: true, name: true, location: true } },
};

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products with filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 */
const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, storeId, categoryId, lowStock, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      deletedAt: null,
      ...(storeId && { storeId }),
      ...(categoryId && { categoryId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
          { supplier: { contains: search } },
        ],
      }),
      // Low stock filter: quantity <= minimumStock
      ...(lowStock === 'true' && {
        AND: [{ quantity: { lte: prisma.product.fields.minimumStock } }],
      }),
    };

    // Handle lowStock filter manually since Prisma doesn't support column comparison in where
    let products, total;
    if (lowStock === 'true') {
      const allProducts = await prisma.product.findMany({
        where: { ...where, AND: undefined },
        include: PRODUCT_INCLUDE,
        orderBy: { quantity: 'asc' },
      });
      const filtered = allProducts.filter((p) => p.quantity <= p.minimumStock);
      total = filtered.length;
      products = filtered.slice(skip, skip + parseInt(limit));
    } else {
      [products, total] = await Promise.all([
        prisma.product.findMany({ where, include: PRODUCT_INCLUDE, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
        prisma.product.count({ where }),
      ]);
    }

    return paginated(res, products, buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        ...PRODUCT_INCLUDE,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { performedBy: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!product) return notFound(res, 'Product not found.');
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 */
const createProduct = async (req, res, next) => {
  try {
    const data = req.body;

    // Attach image URL if uploaded
    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.create({
      data,
      include: PRODUCT_INCLUDE,
    });

    await createAuditLog({
      userId: req.user.id,
      storeId: product.storeId,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      newValues: { name: product.name, sku: product.sku },
      req,
    });

    // Check low stock on creation
    if (product.quantity <= product.minimumStock) {
      await notificationService.sendLowStockAlert(product, req.user);
    }

    return created(res, product, 'Product created successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 */
const updateProduct = async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'Product not found.');

    const data = { ...req.body };
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: PRODUCT_INCLUDE,
    });

    await createAuditLog({
      userId: req.user.id,
      storeId: updated.storeId,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: req.params.id,
      oldValues: { quantity: existing.quantity, sellingPrice: existing.sellingPrice },
      newValues: { quantity: updated.quantity, sellingPrice: updated.sellingPrice },
      req,
    });

    return success(res, updated, 'Product updated successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Soft delete product
 *     tags: [Products]
 */
const deleteProduct = async (req, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'Product not found.');

    await prisma.product.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await createAuditLog({
      userId: req.user.id,
      storeId: existing.storeId,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: req.params.id,
      req,
    });

    return success(res, null, 'Product deleted successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/search/barcode/{barcode}:
 *   get:
 *     summary: Find product by barcode
 *     tags: [Products]
 */
const getByBarcode = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { barcode: req.params.barcode, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });
    if (!product) return notFound(res, 'Product not found.');
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getByBarcode };
