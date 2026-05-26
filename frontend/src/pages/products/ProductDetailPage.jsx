import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Package, Edit, Trash2 } from 'lucide-react';
import { useProduct, useDeleteProduct } from '../../hooks/useProducts';
import { useCreateTransaction } from '../../hooks/useInventory';
import StockBadge from '../../components/ui/StockBadge';
import Modal from '../../components/ui/Modal';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const txnSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().positive('Must be positive'),
  notes: z.string().optional(),
  referenceNo: z.string().optional(),
});

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['ADMIN', 'STOCK_MANAGER']);

  const { data: product, isLoading } = useProduct(id);
  const deleteProduct = useDeleteProduct();
  const createTransaction = useCreateTransaction();

  const [showTxnModal, setShowTxnModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(txnSchema),
    defaultValues: { type: 'IN' },
  });

  const handleDelete = async () => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct.mutateAsync(id);
      navigate('/products');
    }
  };

  const onTxnSubmit = async (values) => {
    await createTransaction.mutateAsync({ ...values, productId: id });
    setShowTxnModal(false);
    reset();
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-primary-400" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 text-slate-400">Product not found.</div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/products')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Products
        </button>
        {canManage && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTxnModal(true)} className="btn-primary text-sm">
              + Stock Transaction
            </button>
            <button onClick={handleDelete} className="btn-danger text-sm flex items-center gap-1">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center justify-center py-10">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-40 h-40 object-cover rounded-xl" />
          ) : (
            <div className="w-40 h-40 bg-slate-700 rounded-xl flex items-center justify-center">
              <Package size={48} className="text-slate-500" />
            </div>
          )}
          <h2 className="text-xl font-bold text-white mt-4 text-center">{product.name}</h2>
          <p className="text-slate-400 text-sm mt-1">{product.sku}</p>
          <div className="mt-3">
            <StockBadge quantity={product.quantity} minimumStock={product.minimumStock} />
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <h3 className="text-base font-semibold text-white mb-4">Product Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Barcode', product.barcode || '—'],
              ['Category', product.category?.name || '—'],
              ['Store', product.store?.name || '—'],
              ['Supplier', product.supplier || '—'],
              ['Current Qty', <span className="text-2xl font-bold text-white">{product.quantity}</span>],
              ['Min Stock', product.minimumStock],
              ['Unit Price', `RWF ${parseFloat(product.unitPrice).toLocaleString()}`],
              ['Selling Price', `RWF ${parseFloat(product.sellingPrice).toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} className="bg-dark-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm text-slate-200 font-medium">{value}</p>
              </div>
            ))}
          </div>
          {product.description && (
            <div className="mt-4 p-3 bg-dark-900/50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Type', 'Qty', 'Previous', 'New', 'Notes', 'By', 'Date'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-slate-400 font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {product.transactions?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No transactions yet</td></tr>
              ) : product.transactions?.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-700/20">
                  <td className="py-2.5 px-3">
                    <span className={`badge ${txn.type === 'IN' ? 'badge-success' : txn.type === 'OUT' ? 'badge-danger' : 'badge-info'}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">{txn.quantity}</td>
                  <td className="py-2.5 px-3 text-slate-400">{txn.previousQty}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-medium">{txn.newQty}</td>
                  <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{txn.notes || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-400">{txn.performedBy?.fullName}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">{format(new Date(txn.createdAt), 'MMM d, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      <Modal isOpen={showTxnModal} onClose={() => setShowTxnModal(false)} title="Stock Transaction" size="sm">
        <form onSubmit={handleSubmit(onTxnSubmit)} className="space-y-4">
          <div>
            <label className="label">Transaction Type</label>
            <select {...register('type')} className="input">
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input {...register('quantity')} type="number" min="1" className="input" placeholder="Enter quantity" />
            {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="label">Reference No. <span className="text-slate-500">(optional)</span></label>
            <input {...register('referenceNo')} className="input" placeholder="e.g. PO-2024-001" />
          </div>
          <div>
            <label className="label">Notes <span className="text-slate-500">(optional)</span></label>
            <textarea {...register('notes')} className="input resize-none" rows={3} placeholder="Add notes..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowTxnModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Record Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
