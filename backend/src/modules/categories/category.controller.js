const prisma = require('../../config/prisma');
const { success, created, notFound, badRequest } = require('../../utils/apiResponse');

const getCategories = async (req, res, next) => {
  try {
    const { search } = req.query;
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(search && { name: { contains: search } }),
      },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { _count: { select: { products: true } } },
    });
    if (!category) return notFound(res, 'Category not found.');
    return success(res, category);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const category = await prisma.category.create({
      data: { name, description, color },
    });
    return created(res, category, 'Category created successfully.');
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'Category not found.');

    const { name, description, color } = req.body;
    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
      },
    });
    return success(res, updated, 'Category updated successfully.');
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) return notFound(res, 'Category not found.');

    const productCount = await prisma.product.count({ where: { categoryId: req.params.id, deletedAt: null } });
    if (productCount > 0) return badRequest(res, `Cannot delete category with ${productCount} active products.`);

    await prisma.category.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    return success(res, null, 'Category deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
