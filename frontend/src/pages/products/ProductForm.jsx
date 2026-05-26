import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useStores } from '../../hooks/useStores';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  sku: z.string().min(1, 'SKU required'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(0).default(0),
  minimumStock: z.coerce.number().int().min(0).default(10),
  unitPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  supplier: z.string().optional(),
  categoryId: z.string().optional(),
  storeId: z.string().min(1, 'Store required'),
});

export default function ProductForm({ product, onSuccess }) {
  const isEdit = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategories();
  const { data: storesData } = useStores();
  const stores = storesData?.data || [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isEdit ? schema.partial() : schema),
    defaultValues: product || {},
  });

  useEffect(() => { if (product) reset(product); }, [product, reset]);

  const onSubmit = async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, v); });

    if (isEdit) {
      await updateProduct.mutateAsync({ id: product.id, data: formData });
    } else {
      await createProduct.mutateAsync(formData);
    }
    onSuccess();
  };

  const Field = ({ name, label, type = 'text', placeholder, required }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input {...register(name)} type={type} className="input" placeholder={placeholder} />
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name].message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="name" label="Product Name" required placeholder="Coca Cola 50cl" />
        <Field name="sku" label="SKU" required placeholder="BEV-001" />
        <Field name="barcode" label="Barcode" placeholder="5000112637922" />
        <Field name="supplier" label="Supplier" placeholder="Bralirwa" />
        <Field name="quantity" label="Quantity" type="number" placeholder="0" />
        <Field name="minimumStock" label="Minimum Stock" type="number" placeholder="10" />
        <Field name="unitPrice" label="Unit Price (RWF)" type="number" placeholder="500" />
        <Field name="sellingPrice" label="Selling Price (RWF)" type="number" placeholder="700" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select {...register('categoryId')} className="input">
            <option value="">No Category</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Store <span className="text-red-400">*</span></label>
          <select {...register('storeId')} className="input">
            <option value="">Select Store</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.storeId && <p className="text-red-400 text-xs mt-1">{errors.storeId.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea {...register('description')} className="input resize-none" rows={3} placeholder="Optional description..." />
      </div>

      <div>
        <label className="label">Product Image</label>
        <input type="file" accept="image/*" {...register('image')} className="input py-1.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-600 file:text-white file:text-xs cursor-pointer" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
