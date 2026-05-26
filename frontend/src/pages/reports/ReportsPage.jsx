import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingDown, Package, AlertTriangle, Download } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  useStockMovement, useLowStockReport, useTopProducts,
  useDeadStock, useStoreAnalytics,
} from '../../hooks/useReports';
import PageHeader from '../../components/ui/PageHeader';
import StockBadge from '../../components/ui/StockBadge';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('monthly');
  const [activeTab, setActiveTab] = useState('movement');

  const { data: movement, isLoading: movLoading } = useStockMovement({ period });
  const { data: lowStockData } = useLowStockReport();
  const { data: topProducts } = useTopProducts({ period, limit: 10 });
  const { data: deadStockData } = useDeadStock({ days: 30 });
  const { data: storeAnalytics } = useStoreAnalytics();

  const tabs = [
    { id: 'movement', label: 'Stock Movement', icon: BarChart3 },
    { id: 'top', label: 'Top Products', icon: TrendingDown },
    { id: 'lowstock', label: 'Low Stock', icon: AlertTriangle },
    { id: 'dead', label: 'Dead Stock', icon: Package },
    { id: 'stores', label: 'Store Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('reports.title')}
        subtitle="Analytics and inventory insights"
        actions={
          <div className="flex items-center gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input py-2 text-sm w-32">
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button className="btn-secondary flex items-center gap-2 text-sm py-2">
              <Download size={15} /> Export
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 border border-slate-700/50 rounded-xl p-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === id
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Stock Movement */}
      {activeTab === 'movement' && (
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Stock Movement — {period}</h3>
          {movLoading ? (
            <div className="h-72 bg-slate-700/30 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={movement || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="stockIn" name="Stock In" stroke="#22c55e" fill="url(#gIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="#ef4444" fill="url(#gOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Top Products */}
      {activeTab === 'top' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Top Selling Products</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topProducts || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalSold" name="Units Sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Sales Distribution</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={topProducts || []} dataKey="totalSold" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {(topProducts || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Low Stock */}
      {activeTab === 'lowstock' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Low Stock Products</h3>
            <div className="flex gap-3 text-sm">
              <span className="badge-danger">{lowStockData?.outOfStock || 0} Out of Stock</span>
              <span className="badge-warning">{lowStockData?.critical || 0} Critical</span>
              <span className="badge-info">{lowStockData?.total || 0} Total</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Product', 'SKU', 'Store', 'Category', 'Current Qty', 'Min Stock', 'Status'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-slate-400 font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {lowStockData?.products?.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500">No low stock products 🎉</td></tr>
                ) : lowStockData?.products?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/20">
                    <td className="py-2.5 px-3 font-medium text-slate-100">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.sku}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.store?.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.category?.name || '—'}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{p.quantity}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.minimumStock}</td>
                    <td className="py-2.5 px-3"><StockBadge quantity={p.quantity} minimumStock={p.minimumStock} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dead Stock */}
      {activeTab === 'dead' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Dead Stock (No movement in 30 days)</h3>
            <span className="badge-warning">{deadStockData?.total || 0} products</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Product', 'SKU', 'Store', 'Qty', 'Last Movement', 'Value'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-slate-400 font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {deadStockData?.products?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-500">No dead stock found 🎉</td></tr>
                ) : deadStockData?.products?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/20">
                    <td className="py-2.5 px-3 font-medium text-slate-100">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.sku}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.store?.name}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{p.quantity}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">
                      {p.lastMovement ? new Date(p.lastMovement).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      RWF {(p.quantity * parseFloat(p.unitPrice)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Store Analytics */}
      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Inventory Value by Store</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={storeAnalytics || []} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalValue" name="Value (RWF)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Store Summary</h3>
            <div className="space-y-3">
              {storeAnalytics?.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-100 text-sm">{store.name}</p>
                    <p className="text-xs text-slate-500">{store.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{store.totalProducts} products</p>
                    <p className="text-xs text-slate-400">RWF {store.totalValue?.toLocaleString()}</p>
                    {store.lowStockCount > 0 && (
                      <span className="badge-warning text-xs">{store.lowStockCount} low</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
