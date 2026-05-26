import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Package, Zap, Loader2 } from 'lucide-react';
import api from '../lib/axios';
import PageHeader from '../components/ui/PageHeader';
import { useStores } from '../hooks/useStores';

const URGENCY_STYLES = {
  critical: 'border-red-600/40 bg-red-900/10',
  high:     'border-yellow-600/40 bg-yellow-900/10',
  medium:   'border-blue-600/40 bg-blue-900/10',
  low:      'border-slate-600/40 bg-slate-800/30',
};

const URGENCY_BADGE = {
  critical: 'badge-danger',
  high:     'badge-warning',
  medium:   'badge-info',
  low:      'badge bg-slate-700 text-slate-300',
};

const INSIGHT_ICONS = {
  critical: <AlertTriangle size={18} className="text-red-400" />,
  warning:  <AlertTriangle size={18} className="text-yellow-400" />,
  info:     <Package size={18} className="text-blue-400" />,
  success:  <Zap size={18} className="text-green-400" />,
};

export default function AIInsightsPage() {
  const [storeId, setStoreId] = useState('');
  const { data: storesData } = useStores();
  const stores = storesData?.data || [];

  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['ai-insights', storeId],
    queryFn: async () => {
      const { data } = await api.post('/ai/insights', { storeId: storeId || null });
      return data.data;
    },
    retry: false,
  });

  const { data: recommendations, isLoading: recoLoading, refetch: refetchReco } = useQuery({
    queryKey: ['ai-recommendations', storeId],
    queryFn: async () => {
      const { data } = await api.post('/ai/restock-recommendations', { storeId: storeId || null });
      return data.data;
    },
    retry: false,
  });

  const [activeTab, setActiveTab] = useState('insights');

  const healthScore = insights?.healthScore ?? null;
  const healthColor = healthScore >= 80 ? 'text-green-400' : healthScore >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Inventory Insights"
        subtitle="Powered by machine learning — restock recommendations and demand predictions"
        actions={
          <div className="flex items-center gap-2">
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="input py-2 text-sm w-44">
              <option value="">All Stores</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              onClick={() => { refetchInsights(); refetchReco(); }}
              className="btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        }
      />

      {/* Health Score */}
      {insights && (
        <div className="card flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Inventory Health Score</p>
            <p className={`text-6xl font-bold ${healthColor}`}>{healthScore}</p>
            <p className="text-slate-500 text-xs mt-1">out of 100</p>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Total Products', insights.summary?.totalProducts, 'text-white'],
              ['Out of Stock', insights.summary?.outOfStock, 'text-red-400'],
              ['Low Stock', insights.summary?.lowStock, 'text-yellow-400'],
              ['Dead Stock', insights.summary?.deadStock, 'text-blue-400'],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-dark-900/50 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 border border-slate-700/50 rounded-xl p-1">
        {[
          { id: 'insights', label: 'AI Insights', icon: Sparkles },
          { id: 'restock', label: 'Restock Recommendations', icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        insightsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-primary-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Analyzing inventory data...</p>
            </div>
          </div>
        ) : !insights ? (
          <div className="card text-center py-16 text-slate-500">
            <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
            <p>AI service unavailable. Make sure the AI service is running.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.insights?.length === 0 ? (
              <div className="card text-center py-12">
                <Sparkles size={32} className="mx-auto mb-3 text-green-400" />
                <p className="text-green-400 font-medium">Inventory looks healthy!</p>
                <p className="text-slate-500 text-sm mt-1">No critical issues detected.</p>
              </div>
            ) : insights.insights?.map((insight, i) => (
              <div key={i} className={`card border ${INSIGHT_ICONS[insight.type] ? '' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{INSIGHT_ICONS[insight.type]}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{insight.icon} {insight.title}</h4>
                    <p className="text-slate-400 text-sm mt-1">{insight.message}</p>
                    {insight.products?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {insight.products.map((p) => (
                          <span key={p.id} className="badge-info text-xs">
                            {p.name}{p.quantity !== undefined ? ` (${p.quantity})` : ''}{p.sold !== undefined ? ` — ${p.sold} sold` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Restock Tab */}
      {activeTab === 'restock' && (
        recoLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-primary-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Calculating restock recommendations...</p>
            </div>
          </div>
        ) : !recommendations ? (
          <div className="card text-center py-16 text-slate-500">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p>AI service unavailable.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">
                {recommendations.totalRecommendations} recommendations · Period: {recommendations.period}
              </p>
              <p className="text-xs text-slate-500">Generated: {new Date(recommendations.generatedAt).toLocaleString()}</p>
            </div>
            {recommendations.recommendations?.length === 0 ? (
              <div className="card text-center py-12">
                <TrendingUp size={32} className="mx-auto mb-3 text-green-400" />
                <p className="text-green-400 font-medium">All products are well stocked!</p>
              </div>
            ) : recommendations.recommendations?.map((rec) => (
              <div key={rec.productId} className={`card border ${URGENCY_STYLES[rec.urgency]}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{rec.productName}</h4>
                      <span className={URGENCY_BADGE[rec.urgency]}>{rec.urgency}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{rec.insight}</p>
                    <p className="text-xs text-slate-500 mt-1">Store: {rec.storeName} · SKU: {rec.sku}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                    <div className="bg-dark-900/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-white">{rec.currentQuantity}</p>
                      <p className="text-xs text-slate-500">Current</p>
                    </div>
                    <div className="bg-dark-900/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-slate-400">{rec.totalOut30Days}</p>
                      <p className="text-xs text-slate-500">Sold 30d</p>
                    </div>
                    <div className="bg-primary-900/30 border border-primary-600/30 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary-400">{rec.recommendedRestock}</p>
                      <p className="text-xs text-slate-500">Restock</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
