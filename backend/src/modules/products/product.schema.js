const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  quantity: z.coerce.number().int().min(0).default(0),
  minimumStock: z.coerce.number().int().min(0).default(10),
  unitPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  supplier: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
});

const updateProductSchema = createProductSchema.partial().omit({ storeId: true });

module.exports = { createProductSchema, updateProductSchema };
