const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const controller = require('./product.controller');
const { authenticate, managerOrAdmin } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { createProductSchema, updateProductSchema } = require('./product.schema');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

// Multer config for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

router.use(authenticate);

router.get('/', controller.getProducts);
router.get('/search/barcode/:barcode', controller.getByBarcode);
router.get('/:id', controller.getProductById);
router.post('/', managerOrAdmin, upload.single('image'), validate(createProductSchema), controller.createProduct);
router.put('/:id', managerOrAdmin, upload.single('image'), validate(updateProductSchema), controller.updateProduct);
router.delete('/:id', managerOrAdmin, controller.deleteProduct);

module.exports = router;
