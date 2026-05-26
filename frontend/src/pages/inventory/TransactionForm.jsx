import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { useCreateTransaction } from '../../hooks/useInventory';
import { useProducts } from '../../hooks/useProducts';
import { useTranslation } from 'react-i18next';
import StockBadge from '../../components/ui/StockBadge';

const schema = z.object({
  productId: z.string().uuid('Select a product'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().positive('Must be a positive number'),
  notes: z.string().max(500).optional(),
  referenceNo: z.string().max(100).optional(),
});

export default function TransactionForm({ defaultType = 'IN', onSuccess }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const createTransaction = useCreateTransaction();

  const { data: productsData } = useProducts({ search, limit: 10 });
  const products = productsData?.data || [];

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType, quantity: 1 },
  });

  const txnType = watch('type');

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setValue('productId', product.id);
    setSearch(product.name);
  };

  const onSubmit = async (values) => {
    await createTransaction.mutateAsync(values);
    onSuccess();
  };

  const typeColors = { IN: 'text-green-400', OUT: 'text-red-400', ADJUSTMENT: 'text-blue-400' };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Transaction Type */}
      <div>
        <label className="label">{t('inventory.type')}</label>
        <div className="grid grid-cols-3 gap-2">
          {['IN', 'OUT', 'ADJUSTMENT'].map((t) => (
            <label key={t} className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
              txnType === t
                ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                : 'border-slate-700 hover:border-slate-600 text-slate-400'
            }`}>
              <input {...register('type')} type="radio" value={t} className="sr-only" />
              <span className="text-sm font-medium">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Product Search */}
      <div className="relative">
        <label className="label">Product <span className="text-red-400">*</span></label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedProduct(null); setValue('productId', ''); }}
            className="input pl-9"
            placeholder="Search product by name or SKU..."
          />
        </div>
        {errors.productId && <p className="text-red-400 text-xs mt-1">{errors.productId.message}</p>}

        {/* Dropdown */}
        {search && !selectedProduct && products.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProduct(p)}
                className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{p.quantity}</p>
                    <StockBadge quantity={p.quantity} minimumStock={p.minimumStock} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        <input type="hidden" {...register('productId')} />
      </div>

      {/* Selected product info */}
      {selectedProduct && (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{selectedProduct.name}</p>
              <p className="text-xs text-slate-400">{selectedProduct.store?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Current Stock</p>
              <p className="text-lg font-bold text-white">{selectedProduct.quantity}</p>
              {txnType === 'OUT' && (
                <p className="text-xs text-slate-500">Max: {selectedProduct.quantity}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="label">
          Quantity <span className="text-red-400">*</span>
          {txnType === 'ADJUSTMENT' && <span className="text-slate-500 text-xs ml-2">(sets absolute value)</span>}
        </label>
        <input {...register('quantity')} type="number" min="1" className="input" placeholder="Enter quantity" />
        {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
      </div>

      <div>
        <label className="label">Reference No. <span className="text-slate-500 text-xs">(optional)</span></label>
        <input {...register('referenceNo')} className="input" placeholder="PO-2024-001" />
      </div>

      <div>
        <label className="label">Notes <span className="text-slate-500 text-xs">(optional)</span></label>
        <textarea {...register('notes')} className="input resize-none" rows={2} placeholder="Add notes..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedProduct}
          className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            txnType === 'OUT' ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'
          }`}
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Record {txnType === 'IN' ? 'Stock In' : txnType === 'OUT' ? 'Stock Out' : 'Adjustment'}
        </button>
      </div>
    </form>
  );
}
