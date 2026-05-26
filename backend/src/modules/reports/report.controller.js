const prisma = require('../../config/prisma');
const { success } = require('../../utils/apiResponse');

// ── Date helpers ─────────────────────────────────────────────
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return { start, end: now };
};

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Dashboard summary stats
 *     tags: [Reports]
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const productWhere = { deletedAt: null, isActive: true, ...(storeId && { storeId }) };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalProducts,
      totalStores,
      totalCategories,
      allProducts,
      todayIn,
      todayOut,
      monthIn,
      monthOut,
    ] = await Promise.all([
      prisma.product.count({ where: productWhere }),
      prisma.store.count({ where: { deletedAt: null, isArchived: false } }),
      prisma.category.count({ where: { deletedAt: null } }),
      prisma.product.findMany({ where: productWhere, select: { quantity: true, minimumStock: true, unitPrice: true } }),
      prisma.stockTransaction.aggregate({
        where: { type: 'IN', createdAt: { gte: today }, ...(storeId && { product: { storeId } }) },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.aggregate({
        where: { type: 'OUT', createdAt: { gte: today }, ...(storeId && { product: { storeId } }) },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.aggregate({
        where: { type: 'IN', createdAt: { gte: thisMonth }, ...(storeId && { product: { storeId } }) },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.aggregate({
        where: { type: 'OUT', createdAt: { gte: thisMonth }, ...(storeId && { product: { storeId } }) },
        _sum: { quantity: true },
      }),
    ]);

    const lowStockCount = allProducts.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock).length;
    const outOfStockCount = allProducts.filter((p) => p.quantity === 0).length;
    const totalInventoryValue = allProducts.reduce((sum, p) => sum + p.quantity * parseFloat(p.unitPrice), 0);

    return success(res, {
      totalProducts,
      totalStores,
      totalCategories,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
      todayStockIn: todayIn._sum.quantity || 0,
      todayStockOut: todayOut._sum.quantity || 0,
      monthStockIn: monthIn._sum.quantity || 0,
      monthStockOut: monthOut._sum.quantity || 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/reports/stock-movement:
 *   get:
 *     summary: Stock movement chart data
 *     tags: [Reports]
 */
const getStockMovement = async (req, res, next) => {
  try {
    const { period = 'monthly', storeId } = req.query;
    const { start } = getDateRange(period);

    const transactions = await prisma.stockTransaction.findMany({
      where: {
        createdAt: { gte: start },
        ...(storeId && { product: { storeId } }),
      },
      select: { type: true, quantity: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped = {};
    for (const txn of transactions) {
      const date = txn.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = { date, stockIn: 0, stockOut: 0 };
      if (txn.type === 'IN') grouped[date].stockIn += txn.quantity;
      if (txn.type === 'OUT') grouped[date].stockOut += txn.quantity;
    }

    return success(res, Object.values(grouped));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/reports/low-stock:
 *   get:
 *     summary: Low stock products report
 *     tags: [Reports]
 */
const getLowStockReport = async (req, res, next) => {
  try {
    const { storeId } = req.query;

    const products = await prisma.product.findMany({
      where: { deletedAt: null, isActive: true, ...(storeId && { storeId }) },
      include: {
        category: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { quantity: 'asc' },
    });

    const lowStock = products.filter((p) => p.quantity <= p.minimumStock);

    return success(res, {
      total: lowStock.length,
      outOfStock: lowStock.filter((p) => p.quantity === 0).length,
      critical: lowStock.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock * 0.5).length,
      products: lowStock,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/reports/top-products:
 *   get:
 *     summary: Most moved products
 *     tags: [Reports]
 */
const getTopProducts = async (req, res, next) => {
  try {
    const { period = 'monthly', storeId, limit = 10 } = req.query;
    const { start } = getDateRange(period);

    const topProducts = await prisma.stockTransaction.groupBy({
      by: ['productId'],
      where: {
        type: 'OUT',
        createdAt: { gte: start },
        ...(storeId && { product: { storeId } }),
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: parseInt(limit),
    });

    const enriched = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, sku: true, category: { select: { name: true } } },
        });
        return { ...product, totalSold: item._sum.quantity };
      })
    );

    return success(res, enriched);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/reports/dead-stock:
 *   get:
 *     summary: Dead stock (no movement in 30+ days)
 *     tags: [Reports]
 */
const getDeadStock = async (req, res, next) => {
  try {
    const { storeId, days = 30 } = req.query;
    const cutoff = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        quantity: { gt: 0 },
        ...(storeId && { storeId }),
      },
      include: {
        store: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, type: true },
        },
      },
    });

    const deadStock = products.filter((p) => {
      if (p.transactions.length === 0) return true;
      return p.transactions[0].createdAt < cutoff;
    });

    return success(res, {
      total: deadStock.length,
      products: deadStock.map((p) => ({
        ...p,
        lastMovement: p.transactions[0]?.createdAt || null,
        transactions: undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/reports/store-analytics:
 *   get:
 *     summary: Per-store analytics
 *     tags: [Reports]
 */
const getStoreAnalytics = async (req, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      where: { deletedAt: null, isArchived: false },
      include: {
        _count: { select: { products: true } },
        products: {
          where: { deletedAt: null, isActive: true },
          select: { quantity: true, minimumStock: true, unitPrice: true },
        },
      },
    });

    const analytics = stores.map((store) => {
      const lowStock = store.products.filter((p) => p.quantity <= p.minimumStock).length;
      const totalValue = store.products.reduce((sum, p) => sum + p.quantity * parseFloat(p.unitPrice), 0);
      return {
        id: store.id,
        name: store.name,
        location: store.location,
        totalProducts: store._count.products,
        lowStockCount: lowStock,
        totalValue: parseFloat(totalValue.toFixed(2)),
      };
    });

    return success(res, analytics);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/reports/audit-logs:
 *   get:
 *     summary: Audit log history
 *     tags: [Reports]
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, entity, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(userId && { userId }),
      ...(entity && { entity }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return success(res, { logs, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getStockMovement,
  getLowStockReport,
  getTopProducts,
  getDeadStock,
  getStoreAnalytics,
  getAuditLogs,
};
