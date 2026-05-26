const express = require('express');
const router = express.Router();
const controller = require('./category.controller');
const { authenticate, managerOrAdmin } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category management
 */

router.use(authenticate);

router.get('/', controller.getCategories);
router.get('/:id', controller.getCategoryById);
router.post('/', managerOrAdmin, controller.createCategory);
router.put('/:id', managerOrAdmin, controller.updateCategory);
router.delete('/:id', managerOrAdmin, controller.deleteCategory);

module.exports = router;
