import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useTransactions, useCreateTransaction, useInventorySummary } from '../../hooks/useInventory';
import { useProducts } from '../../hooks/useProducts';
import { useStores } from '../../hooks/useStores';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/ui/StatCard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

const txnSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().positive('Must be positive'),
  notes: z.string().optional(),
  referenceNo: z.string().optional(),
});

function TransactionForm({ onSuccess }) {
  const createTransaction = useCreateTransaction();
  const { data: productsData } = useProducts({ limit: 200 });
  const products = productsData?.data || [];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(txnSchema),
    defaultValues: { type: 'IN' },
  });

  const onSubmit = async (values) => {
    await createTransaction.mutateAsync(values);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Product <span className="text-red-400">*</span></label>
        <select {...register('productId')} className="input">
          <option value="">Select product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.sku} (Qty: {p.quantity})</option>
          ))}
        </select>
        {errors.productId && <p className="text-red-400 text-xs mt-1">{errors.productId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type <span className="text-red-400">*</span></label>
          <select {...register('type')} className="input">
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
        <div>
          <label className="label">Quantity <span className="text-red-400">*</span></label>
          <input {...register('quantity')} type="number" min="1" className="input" placeholder="0" />
          {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Reference No. <span className="text-slate-500">(optional)</span></label>
        <input {...register('referenceNo')} className="input" placeholder="PO-2024-001" />
      </div>

      <div>
        <label className="label">Notes <span className="text-slate-500">(optional)</span></label>
        <textarea {...register('notes')} className="input resize-none" rows={3} placeholder="Add notes..." />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Record Transaction
        </button>
      </div>
    </form>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [storeId, setStoreId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: summary } = useInventorySummary({ storeId });
  const { data, isLoading } = useTransactions({ page, limit: 20, type, storeId, startDate, endDate });
  const { data: storesData } = useStores();
  const stores = storesData?.data || [];

  const columns = [
    { key: 'product', label: 'Product', render: (v) => (
      <div>
        <p className="font-medium text-slate-100">{v?.name}</p>
        <p className="text-xs text-slate-500">{v?.sku}</p>
      </div>
    )},
    { key: 'product', label: 'Store', render: (v) => v?.store?.name || '—' },
    { key: 'type', label: 'Type', render: (v) => (
      <span className={`badge ${v === 'IN' ? 'badge-success' : v === 'OUT' ? 'badge-danger' : 'badge-info'}`}>{v}</span>
    )},
    { key: 'quantity', label: 'Qty', render: (v) => <span className="font-semibold text-white">{v}</span> },
    { key: 'previousQty', label: 'Before', render: (v) => <span className="text-slate-400">{v}</span> },
    { key: 'newQty', label: 'After', render: (v) => <span className="font-medium text-slate-200">{v}</span> },
    { key: 'referenceNo', label: 'Ref No.', render: (v) => v || '—' },
    { key: 'notes', label: 'Notes', render: (v) => <span className="truncate max-w-xs block text-slate-400">{v || '—'}</span> },
    { key: 'performedBy', label: 'By', render: (v) => v?.fullName || '—' },
    { key: 'createdAt', label: 'Date', render: (v) => (
      <span className="text-xs text-slate-500">{format(new Date(v), 'MMM d, yyyy HH:mm')}</span>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('inventory.title')}
        subtitle="Track all stock movements"
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <ArrowDownCircle size={16} /> New Transaction
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={summary?.totalProducts} icon={SlidersHorizontal} color="primary" />
        <StatCard title="Low Stock" value={summary?.lowStockProducts} icon={ArrowUpCircle} color="yellow" />
        <StatCard title="Out of Stock" value={summary?.outOfStockProducts} icon={ArrowDownCircle} color="red" />
        <StatCard title="Today's Transactions" value={summary?.todayTransactions} icon={SlidersHorizontal} color="blue" />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label text-xs">Type</label>
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input py-2 text-sm w-36">
              <option value="">All Types</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Store</label>
            <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="input py-2 text-sm w-44">
              <option value="">All Stores</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input py-2 text-sm" />
          </div>
          <div>
            <label className="label text-xs">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input py-2 text-sm" />
          </div>
          <button onClick={() => { setType(''); setStoreId(''); setStartDate(''); setEndDate(''); setPage(1); }}
            className="btn-secondary text-sm py-2">
            Clear
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No transactions found"
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Stock Transaction" size="md">
        <TransactionForm onSuccess={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
