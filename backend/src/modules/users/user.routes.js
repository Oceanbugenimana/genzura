const express = require('express');
const router = express.Router();
const controller = require('./user.controller');
const { authenticate, adminOnly } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

router.use(authenticate);

router.get('/', adminOnly, controller.getUsers);
router.get('/:id', adminOnly, controller.getUserById);
router.put('/profile', controller.updateProfile);
router.put('/:id', adminOnly, controller.updateUser);
router.delete('/:id', adminOnly, controller.deleteUser);

module.exports = router;
