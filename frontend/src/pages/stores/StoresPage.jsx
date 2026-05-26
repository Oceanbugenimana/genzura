import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Store, MapPin, Package, User } from 'lucide-react';
import { useStores, useCreateStore, useUpdateStore, useDeleteStore } from '../../hooks/useStores';
import { useUsers } from '../../hooks/useUsers';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  name: z.string().min(1, 'Store name required'),
  category: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

function StoreForm({ store, onSuccess }) {
  const isEdit = !!store;
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const { data: usersData } = useUsers({ role: 'STOCK_MANAGER', limit: 100 });
  const managers = usersData?.data || [];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: store || {},
  });

  const onSubmit = async (values) => {
    if (isEdit) await updateStore.mutateAsync({ id: store.id, data: values });
    else await createStore.mutateAsync(values);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Store Name <span className="text-red-400">*</span></label>
        <input {...register('name')} className="input" placeholder="Kigali Main Store" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <input {...register('category')} className="input" placeholder="Retail, Wholesale..." />
        </div>
        <div>
          <label className="label">Location</label>
          <input {...register('location')} className="input" placeholder="Kigali, Rwanda" />
        </div>
      </div>
      <div>
        <label className="label">Manager</label>
        <select {...register('managerId')} className="input">
          <option value="">No Manager</option>
          {managers.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea {...register('description')} className="input resize-none" rows={3} placeholder="Store description..." />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Update Store' : 'Create Store'}
        </button>
      </div>
    </form>
  );
}

export default function StoresPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['ADMIN', 'STOCK_MANAGER']);

  const [showForm, setShowForm] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useStores({ search });
  const deleteStore = useDeleteStore();
  const stores = data?.data || [];

  const handleEdit = (store) => { setEditStore(store); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditStore(null); };
  const handleDelete = (id) => { if (window.confirm('Delete this store?')) deleteStore.mutate(id); };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('stores.title')}
        subtitle={`${stores.length} stores`}
        actions={canManage && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> {t('stores.addStore')}
          </button>
        )}
      />

      <div className="card p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-sm py-2 text-sm"
          placeholder="Search stores..."
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-slate-700/30" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <Store size={40} className="mx-auto mb-3 opacity-30" />
          <p>No stores found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div key={store.id} className="card hover:border-slate-600 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-primary-600/10 rounded-xl border border-primary-600/20">
                  <Store size={20} className="text-primary-400" />
                </div>
                {store.isArchived && <span className="badge-warning">Archived</span>}
              </div>
              <h3 className="font-semibold text-white text-base">{store.name}</h3>
              {store.category && <p className="text-xs text-slate-500 mt-0.5">{store.category}</p>}

              <div className="mt-3 space-y-1.5">
                {store.location && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin size={12} /> {store.location}
                  </div>
                )}
                {store.manager && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <User size={12} /> {store.manager.fullName}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Package size={12} /> {store._count?.products || 0} products
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(store)} className="text-xs text-primary-400 hover:text-primary-300 font-medium">Edit</button>
                  <button onClick={() => handleDelete(store.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={handleClose} title={editStore ? 'Edit Store' : 'Add Store'} size="md">
        <StoreForm store={editStore} onSuccess={handleClose} />
      </Modal>
    </div>
  );
}
