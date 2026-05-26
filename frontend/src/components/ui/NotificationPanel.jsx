import { X, Bell, CheckCircle, XCircle, Clock, RefreshCw, Package, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useNotifications, useRetryNotifications } from '../../hooks/useNotifications';
import { format } from 'date-fns';
import clsx from 'clsx';

const STATUS_CONFIG = {
  SENT:     { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Sent' },
  FAILED:   { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Failed' },
  PENDING:  { icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Pending' },
  RETRYING: { icon: RefreshCw,   color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'Retrying' },
};

export default function NotificationPanel() {
  const { notificationPanelOpen, closeNotificationPanel } = useUIStore();
  const { data, isLoading, refetch } = useNotifications({ limit: 20 });
  const retryMutation = useRetryNotifications();
  const notifications = data?.data || [];

  if (!notificationPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-fast"
        onClick={closeNotificationPanel}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 notif-panel flex flex-col"
        style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/15 rounded-xl">
              <Bell size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{notifications.length} alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="btn-icon p-2 text-xs"
              title="Retry failed"
            >
              <RefreshCw size={15} className={retryMutation.isPending ? 'animate-spin' : ''} />
            </button>
            <button onClick={closeNotificationPanel} className="btn-icon p-2">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: 'Sent',    count: notifications.filter(n => n.status === 'SENT').length,    color: 'text-emerald-400' },
            { label: 'Pending', count: notifications.filter(n => n.status === 'PENDING').length,  color: 'text-amber-400' },
            { label: 'Failed',  count: notifications.filter(n => n.status === 'FAILED').length,   color: 'text-red-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className={`text-xl font-black ${color}`}>{count}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16"
              style={{ color: 'var(--text-muted)' }}>
              <Bell size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs mt-1 opacity-60">Low stock alerts will appear here</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {notifications.map((notif, i) => {
                const cfg = STATUS_CONFIG[notif.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-opacity-50 transition-colors animate-slide-right"
                    style={{ animationDelay: `${i * 0.04}s`, '--hover-bg': 'var(--bg-elevated)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx('p-2 rounded-xl shrink-0 mt-0.5', cfg.bg)}>
                        {notif.type === 'LOW_STOCK'
                          ? <AlertTriangle size={14} className={cfg.color} />
                          : <Package size={14} className={cfg.color} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {notif.product?.name || 'Low Stock Alert'}
                          </p>
                          <span className={clsx('badge shrink-0 text-xs', {
                            'badge-success': notif.status === 'SENT',
                            'badge-warning': notif.status === 'PENDING',
                            'badge-danger':  notif.status === 'FAILED',
                            'badge-info':    notif.status === 'RETRYING',
                          })}>
                            <StatusIcon size={9} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {notif.message?.split('\n')[0]}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            → {notif.whatsappTo}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {format(new Date(notif.createdAt), 'MMM d, HH:mm')}
                          </p>
                        </div>
                        {notif.errorMsg && (
                          <p className="text-xs text-red-400 mt-1 truncate">{notif.errorMsg}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => { refetch(); }}
            className="btn-secondary w-full text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>
    </>
  );
}
