const prisma = require('../../config/prisma');
const { success, created, notFound, badRequest, paginated, buildPagination } = require('../../utils/apiResponse');
const { createAuditLog } = require('../../middleware/audit.middleware');
const notificationService = require('../../services/notification.service');

// ── Core transaction engine ──────────────────────────────────
/**
 * Performs a single stock transaction atomically.
 * Enforces: no negative stock, immutable history, audit trail.
 */
const performTransaction = async (productId, type, quantity, performedById, notes, referenceNo) => {
  return await prisma.$transaction(async (tx) => {
    // Lock the product row for update
    const product = await tx.product.findFirst({
      where: { id: productId, deletedAt: null, isActive: true },
    });

    if (!product) throw Object.assign(new Error('Product not found.'), { statusCode: 404 });

    let newQty = product.quantity;

    if (type === 'IN') {
      newQty = product.quantity + quantity;
    } else if (type === 'OUT') {
      if (product.quantity < quantity) {
        throw Object.assign(
          new Error(`Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`),
          { statusCode: 400 }
        );
      }
      newQty = product.quantity - quantity;
    } else if (type === 'ADJUSTMENT') {
      // ADJUSTMENT sets absolute quantity
      if (quantity < 0) throw Object.assign(new Error('Adjusted quantity cannot be negative.'), { statusCode: 400 });
      newQty = quantity;
    }

    // Update product quantity atomically
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { quantity: newQty },
    });

    // Create immutable transaction record
    const transaction = await tx.stockTransaction.create({
      data: {
        productId,
        type,
        quantity,
        previousQty: product.quantity,
        newQty,
        notes,
        performedById,
        referenceNo,
      },
      include: {
        product: { select: { id: true, name: true, sku: true, minimumStock: true } },
        performedBy: { select: { id: true, fullName: true } },
      },
    });

    return { transaction, product: updatedProduct };
  });
};

/**
 * @swagger
 * /api/inventory/transaction:
 *   post:
 *     summary: Perform a stock transaction (IN / OUT / ADJUSTMENT)
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, type, quantity]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               type: { type: string, enum: [IN, OUT, ADJUSTMENT] }
 *               quantity: { type: integer, minimum: 1 }
 *               notes: { type: string }
 *               referenceNo: { type: string }
 *     responses:
 *       201: { description: Transaction recorded }
 *       400: { description: Insufficient stock }
 *       404: { description: Product not found }
 */
const createTransaction = async (req, res, next) => {
  try {
    const { productId, type, quantity, notes, referenceNo } = req.body;

    const { transaction, product } = await performTransaction(
      productId, type, quantity, req.user.id, notes, referenceNo
    );

    await createAuditLog({
      userId: req.user.id,
      storeId: product.storeId,
      action: `STOCK_${type}`,
      entity: 'StockTransaction',
      entityId: transaction.id,
      newValues: { productId, type, quantity, previousQty: transaction.previousQty, newQty: transaction.newQty },
      req,
    });

    // Trigger low stock alert if needed
    if (product.quantity <= product.minimumStock) {
      const fullProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { store: true },
      });
      await notificationService.sendLowStockAlert(fullProduct, req.user);
    }

    return created(res, transaction, 'Transaction recorded successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/inventory/bulk:
 *   post:
 *     summary: Perform multiple transactions at once
 *     tags: [Inventory]
 */
const bulkTransaction = async (req, res, next) => {
  try {
    const { transactions } = req.body;
    const results = [];
    const errors = [];

    for (const txn of transactions) {
      try {
        const { transaction } = await performTransaction(
          txn.productId, txn.type, txn.quantity, req.user.id, txn.notes, txn.referenceNo
        );
        results.push(transaction);
      } catch (err) {
        errors.push({ productId: txn.productId, error: err.message });
      }
    }

    return success(res, { results, errors, total: transactions.length, succeeded: results.length, failed: errors.length });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/inventory/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Inventory]
 */
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, productId, type, storeId, startDate, endDate, performedById } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(productId && { productId }),
      ...(type && { type }),
      ...(performedById && { performedById }),
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      },
      ...(storeId && { product: { storeId } }),
    };

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true, store: { select: { id: true, name: true } } } },
          performedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.stockTransaction.count({ where }),
    ]);

    return paginated(res, transactions, buildPagination(page, limit, total));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/inventory/transactions/{id}:
 *   get:
 *     summary: Get single transaction
 *     tags: [Inventory]
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await prisma.stockTransaction.findUnique({
      where: { id: req.params.id },
      include: {
        product: { include: { store: true, category: true } },
        performedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!transaction) return notFound(res, 'Transaction not found.');
    return success(res, transaction);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/inventory/summary:
 *   get:
 *     summary: Get inventory summary stats
 *     tags: [Inventory]
 */
const getInventorySummary = async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const productWhere = { deletedAt: null, isActive: true, ...(storeId && { storeId }) };

    const [totalProducts, lowStockProducts, outOfStockProducts, totalValue] = await Promise.all([
      prisma.product.count({ where: productWhere }),
      prisma.product.findMany({ where: productWhere }).then((products) =>
        products.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock).length
      ),
      prisma.product.count({ where: { ...productWhere, quantity: 0 } }),
      prisma.product.findMany({ where: productWhere, select: { quantity: true, unitPrice: true } }).then((products) =>
        products.reduce((sum, p) => sum + p.quantity * parseFloat(p.unitPrice), 0)
      ),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await prisma.stockTransaction.count({
      where: { createdAt: { gte: today }, ...(storeId && { product: { storeId } }) },
    });

    return success(res, {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue: parseFloat(totalValue.toFixed(2)),
      todayTransactions,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTransaction, bulkTransaction, getTransactions, getTransactionById, getInventorySummary };
