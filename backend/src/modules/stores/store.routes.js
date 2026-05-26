const express = require('express');
const router = express.Router();
const controller = require('./store.controller');
const { authenticate, managerOrAdmin } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management
 */

router.use(authenticate);

router.get('/', controller.getStores);
router.get('/:id', controller.getStoreById);
router.post('/', managerOrAdmin, controller.createStore);
router.put('/:id', managerOrAdmin, controller.updateStore);
router.delete('/:id', managerOrAdmin, controller.deleteStore);

module.exports = router;
