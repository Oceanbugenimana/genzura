const { z } = require('zod');

const transactionSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], { required_error: 'Transaction type is required' }),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  notes: z.string().max(500).optional(),
  referenceNo: z.string().max(100).optional(),
});

const bulkTransactionSchema = z.object({
  transactions: z.array(transactionSchema).min(1).max(50),
});

module.exports = { transactionSchema, bulkTransactionSchema };
