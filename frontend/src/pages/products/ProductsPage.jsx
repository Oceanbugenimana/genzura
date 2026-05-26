import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Package } from 'lucide-react';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useStores } from '../../hooks/useStores';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StockBadge from '../../components/ui/StockBadge';
import ProductForm from './ProductForm';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

export default function ProductsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['ADMIN', 'STOCK_MANAGER']);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const { data, isLoading } = useProducts({ page, limit: 20, search, storeId, categoryId, lowStock: lowStock || undefined });
  const { data: categories } = useCategories();
  const { data: storesData } = useStores();
  const deleteProduct = useDeleteProduct();

  const stores = storesData?.data || [];

  const handleEdit = (product) => { setEditProduct(product); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditProduct(null); };
  const handleDelete = (id) => {
    if (window.confirm('Delete this product?')) deleteProduct.mutate(id);
  };

  const columns = [
    {
      key: 'imageUrl', label: '', width: 48,
      render: (val, row) => (
        <div className="w-9 h-9 rounded-lg bg-slate-700 overflow-hidden flex items-center justify-center">
          {val ? <img src={val} alt={row.name} className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-500" />}
        </div>
      ),
    },
    { key: 'name', label: t('products.name'), render: (v, row) => (
      <div>
        <p className="font-medium text-slate-100">{v}</p>
        <p className="text-xs text-slate-500">{row.sku}</p>
      </div>
    )},
    { key: 'category', label: t('products.category'), render: (v) => v ? (
      <span className="badge-info">{v.name}</span>
    ) : '—' },
    { key: 'store', label: t('products.store'), render: (v) => v?.name || '—' },
    { key: 'quantity', label: t('products.quantity'), render: (v, row) => (
      <div>
        <span className="font-semibold text-white">{v}</span>
        <span className="text-slate-500 text-xs ml-1">/ min {row.minimumStock}</span>
      </div>
    )},
    { key: 'quantity', label: 'Status', render: (v, row) => <StockBadge quantity={v} minimumStock={row.minimumStock} /> },
    { key: 'sellingPrice', label: t('products.sellingPrice'), render: (v) => `RWF ${parseFloat(v).toLocaleString()}` },
    { key: 'supplier', label: t('products.supplier'), render: (v) => v || '—' },
    { key: 'createdAt', label: t('common.date'), render: (v) => format(new Date(v), 'MMM d, yyyy') },
    canManage && {
      key: 'id', label: t('common.actions'),
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(row)} className="text-xs text-primary-400 hover:text-primary-300 font-medium">{t('common.edit')}</button>
          <button onClick={() => handleDelete(id)} className="text-xs text-red-400 hover:text-red-300 font-medium">{t('common.delete')}</button>
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('products.title')}
        subtitle={`${data?.pagination?.total || 0} products total`}
        actions={canManage && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> {t('products.addProduct')}
          </button>
        )}
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 py-2 text-sm"
              placeholder={t('products.search')}
            />
          </div>
          <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
            <option value="">All Stores</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="input w-auto py-2 text-sm">
            <option value="">All Categories</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={lowStock} onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
              className="rounded border-slate-600 bg-dark-900 text-primary-600" />
            Low Stock Only
          </label>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage={t('products.noProducts')}
      />

      <Modal isOpen={showForm} onClose={handleClose} title={editProduct ? t('products.editProduct') : t('products.addProduct')} size="lg">
        <ProductForm product={editProduct} onSuccess={handleClose} />
      </Modal>
    </div>
  );
}
