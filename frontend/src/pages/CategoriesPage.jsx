import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  color: z.string().default('#6366f1'),
});

const PRESET_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316'];

function CategoryForm({ category, onSuccess }) {
  const isEdit = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: category || { color: '#6366f1' },
  });

  const selectedColor = watch('color');

  const onSubmit = async (values) => {
    if (isEdit) await updateCategory.mutateAsync({ id: category.id, data: values });
    else await createCategory.mutateAsync(values);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Category Name <span className="text-red-400">*</span></label>
        <input {...register('name')} className="input" placeholder="Beverages" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <input {...register('description')} className="input" placeholder="Optional description" />
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: selectedColor === c ? 'white' : 'transparent' }}
            />
          ))}
        </div>
        <input type="hidden" {...register('color')} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['ADMIN', 'STOCK_MANAGER']);

  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const handleEdit = (cat) => { setEditCategory(cat); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditCategory(null); };
  const handleDelete = (id) => { if (window.confirm('Delete this category?')) deleteCategory.mutate(id); };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('nav.categories')}
        subtitle={`${categories?.length || 0} categories`}
        actions={canManage && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Category
          </button>
        )}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-slate-700/30" />)}
        </div>
      ) : categories?.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p>No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories?.map((cat) => (
            <div key={cat.id} className="card hover:border-slate-600 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}>
                  <Tag size={18} style={{ color: cat.color }} />
                </div>
                {canManage && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-white">{cat.name}</h3>
              {cat.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{cat.description}</p>}
              <p className="text-xs text-slate-400 mt-2">{cat._count?.products || 0} products</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={handleClose} title={editCategory ? 'Edit Category' : 'Add Category'} size="sm">
        <CategoryForm category={editCategory} onSuccess={handleClose} />
      </Modal>
    </div>
  );
}
