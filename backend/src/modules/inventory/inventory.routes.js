const express = require('express');
const router = express.Router();
const controller = require('./inventory.controller');
const { authenticate, managerOrAdmin } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { transactionSchema, bulkTransactionSchema } = require('./inventory.schema');

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock transaction management
 */

router.use(authenticate);

router.get('/summary', controller.getInventorySummary);
router.get('/transactions', controller.getTransactions);
router.get('/transactions/:id', controller.getTransactionById);
router.post('/transaction', validate(transactionSchema), controller.createTransaction);
router.post('/bulk', managerOrAdmin, validate(bulkTransactionSchema), controller.bulkTransaction);

module.exports = router;
