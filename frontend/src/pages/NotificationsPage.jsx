import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useNotifications, useNotificationStats, useRetryNotifications } from '../hooks/useNotifications';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import StatCard from '../components/ui/StatCard';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const STATUS_BADGE = {
  SENT:     <span className="badge-success flex items-center gap-1"><CheckCircle size={11} /> Sent</span>,
  FAILED:   <span className="badge-danger flex items-center gap-1"><XCircle size={11} /> Failed</span>,
  PENDING:  <span className="badge-warning flex items-center gap-1"><Clock size={11} /> Pending</span>,
  RETRYING: <span className="badge-info flex items-center gap-1"><RefreshCw size={11} /> Retrying</span>,
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('ADMIN');

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useNotifications({ page, limit: 20, status });
  const { data: stats } = useNotificationStats();
  const retryMutation = useRetryNotifications();

  const columns = [
    { key: 'type', label: 'Type', render: (v) => <span className="badge-purple">{v}</span> },
    { key: 'product', label: 'Product', render: (v) => v?.name || '—' },
    { key: 'user', label: 'Recipient', render: (v) => v?.fullName || '—' },
    { key: 'whatsappTo', label: 'WhatsApp', render: (v) => <span className="text-slate-400 text-xs">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => STATUS_BADGE[v] || v },
    { key: 'retryCount', label: 'Retries', render: (v) => v > 0 ? <span className="text-yellow-400">{v}</span> : '0' },
    { key: 'sentAt', label: 'Sent At', render: (v) => v ? format(new Date(v), 'MMM d, HH:mm') : '—' },
    { key: 'createdAt', label: 'Created', render: (v) => <span className="text-xs text-slate-500">{format(new Date(v), 'MMM d, HH:mm')}</span> },
    { key: 'errorMsg', label: 'Error', render: (v) => v ? <span className="text-red-400 text-xs truncate max-w-xs block">{v}</span> : '—' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('notifications.title')}
        subtitle="WhatsApp alert history"
        actions={isAdmin && (
          <button
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {retryMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {t('notifications.retry')}
          </button>
        )}
      />

      {/* Stats */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total} icon={Bell} color="primary" />
          <StatCard title="Sent" value={stats.sent} icon={CheckCircle} color="green" />
          <StatCard title="Failed" value={stats.failed} icon={XCircle} color="red" />
          <StatCard title="Pending" value={stats.pending} icon={Clock} color="yellow" />
        </div>
      )}

      {/* Filter */}
      <div className="card p-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-40 py-2 text-sm">
          <option value="">All Status</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
          <option value="RETRYING">Retrying</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage={t('notifications.noNotifications')}
      />
    </div>
  );
}
