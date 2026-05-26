import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, XCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { useDashboardStats, useStockMovement, useTopProducts } from '../hooks/useReports';
import { useTransactions } from '../hooks/useInventory';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import { format } from 'date-fns';

const CHART_COLORS = { stockIn: '#22c55e', stockOut: '#ef4444' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-slate-700 rounded-lg p-3 text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: movement } = useStockMovement({ period: 'monthly' });
  const { data: topData } = useTopProducts({ period: 'monthly', limit: 5 });
  const { data: txnData } = useTransactions({ limit: 8 });

  const recentTransactions = txnData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t('dashboard.title')} subtitle="Real-time inventory overview" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalProducts')}
          value={statsLoading ? '...' : stats?.totalProducts?.toLocaleString()}
          icon={Package}
          color="primary"
        />
        <StatCard
          title={t('dashboard.lowStock')}
          value={statsLoading ? '...' : stats?.lowStockCount}
          icon={AlertTriangle}
          color="yellow"
          subtitle="Products below minimum"
        />
        <StatCard
          title={t('dashboard.outOfStock')}
          value={statsLoading ? '...' : stats?.outOfStockCount}
          icon={XCircle}
          color="red"
          subtitle="Needs immediate restock"
        />
        <StatCard
          title={t('dashboard.totalValue')}
          value={statsLoading ? '...' : `RWF ${stats?.totalInventoryValue?.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Today's activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title={t('dashboard.todayIn')}
          value={statsLoading ? '...' : stats?.todayStockIn}
          icon={TrendingUp}
          color="green"
          subtitle="Units received today"
        />
        <StatCard
          title={t('dashboard.todayOut')}
          value={statsLoading ? '...' : stats?.todayStockOut}
          icon={TrendingDown}
          color="red"
          subtitle="Units dispatched today"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Stock Movement Chart */}
        <div className="xl:col-span-2 card">
          <h3 className="text-base font-semibold text-white mb-4">{t('dashboard.stockMovement')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={movement || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="stockIn" name="Stock In" stroke="#22c55e" fill="url(#colorIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="#ef4444" fill="url(#colorOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Top Products (30d)</h3>
          {topData?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalSold" name="Sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-4">{t('dashboard.recentTransactions')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Product', 'Type', 'Qty', 'Previous', 'New', 'By', 'Date'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-slate-400 font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No transactions yet</td></tr>
              ) : recentTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-700/20">
                  <td className="py-2.5 px-3 text-slate-200 font-medium">{txn.product?.name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${txn.type === 'IN' ? 'badge-success' : txn.type === 'OUT' ? 'badge-danger' : 'badge-info'}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{txn.quantity}</td>
                  <td className="py-2.5 px-3 text-slate-400">{txn.previousQty}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">{txn.newQty}</td>
                  <td className="py-2.5 px-3 text-slate-400">{txn.performedBy?.fullName}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">
                    {format(new Date(txn.createdAt), 'MMM d, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
