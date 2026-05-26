import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';
import { useUsers, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const ROLE_BADGE = {
  ADMIN:         <span className="badge-danger flex items-center gap-1"><Shield size={10} /> Admin</span>,
  STOCK_MANAGER: <span className="badge-info flex items-center gap-1"><UserCheck size={10} /> Manager</span>,
  STAFF:         <span className="badge bg-slate-700 text-slate-300 flex items-center gap-1"><Users size={10} /> Staff</span>,
};

function EditUserForm({ user, onSuccess }) {
  const updateUser = useUpdateUser();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { fullName: user.fullName, role: user.role, isActive: user.isActive, whatsappNumber: user.whatsappNumber || '' },
  });

  const onSubmit = async (values) => {
    await updateUser.mutateAsync({ id: user.id, data: values });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input {...register('fullName')} className="input" />
      </div>
      <div>
        <label className="label">WhatsApp Number</label>
        <input {...register('whatsappNumber')} className="input" placeholder="+250700000000" />
      </div>
      <div>
        <label className="label">Role</label>
        <select {...register('role')} className="input">
          <option value="STAFF">Staff</option>
          <option value="STOCK_MANAGER">Stock Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" {...register('isActive')} id="isActive" className="rounded border-slate-600 bg-dark-900 text-primary-600" />
        <label htmlFor="isActive" className="text-sm text-slate-300 cursor-pointer">Active</label>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Update User
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [editUser, setEditUser] = useState(null);

  const { data, isLoading } = useUsers({ page, limit: 20, search, role });
  const deleteUser = useDeleteUser();

  const handleDelete = (id) => {
    if (id === currentUser.id) return;
    if (window.confirm('Delete this user?')) deleteUser.mutate(id);
  };

  const columns = [
    { key: 'fullName', label: 'Name', render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{v?.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="font-medium text-slate-100">{v}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (v) => ROLE_BADGE[v] || v },
    { key: 'whatsappNumber', label: 'WhatsApp', render: (v) => v || <span className="text-slate-600">—</span> },
    { key: 'preferredLang', label: 'Language', render: (v) => <span className="uppercase badge-purple">{v}</span> },
    { key: 'isActive', label: 'Status', render: (v) => v
      ? <span className="badge-success flex items-center gap-1"><UserCheck size={10} /> Active</span>
      : <span className="badge-danger flex items-center gap-1"><UserX size={10} /> Inactive</span>
    },
    { key: 'createdAt', label: 'Joined', render: (v) => <span className="text-xs text-slate-500">{format(new Date(v), 'MMM d, yyyy')}</span> },
    { key: 'id', label: 'Actions', render: (id, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditUser(row)} className="text-xs text-primary-400 hover:text-primary-300 font-medium">Edit</button>
        {id !== currentUser.id && (
          <button onClick={() => handleDelete(id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Delete</button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('nav.users')}
        subtitle={`${data?.pagination?.total || 0} users`}
      />

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input flex-1 min-w-48 py-2 text-sm"
            placeholder="Search by name or email..."
          />
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input w-40 py-2 text-sm">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STOCK_MANAGER">Stock Manager</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No users found"
      />

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="sm">
        {editUser && <EditUserForm user={editUser} onSuccess={() => setEditUser(null)} />}
      </Modal>
    </div>
  );
}
