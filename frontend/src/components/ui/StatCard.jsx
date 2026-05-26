import clsx from 'clsx';

const VARIANTS = {
  violet:  { bg: 'from-violet-600/20 to-indigo-600/20', border: 'border-violet-500/30', icon: 'bg-violet-500/20 text-violet-400', glow: 'glow-violet', text: 'text-violet-400' },
  emerald: { bg: 'from-emerald-600/20 to-teal-600/20',  border: 'border-emerald-500/30', icon: 'bg-emerald-500/20 text-emerald-400', glow: 'glow-emerald', text: 'text-emerald-400' },
  amber:   { bg: 'from-amber-600/20 to-orange-600/20',  border: 'border-amber-500/30', icon: 'bg-amber-500/20 text-amber-400', glow: 'glow-amber', text: 'text-amber-400' },
  red:     { bg: 'from-red-600/20 to-rose-600/20',      border: 'border-red-500/30', icon: 'bg-red-500/20 text-red-400', glow: 'glow-red', text: 'text-red-400' },
  blue:    { bg: 'from-blue-600/20 to-cyan-600/20',     border: 'border-blue-500/30', icon: 'bg-blue-500/20 text-blue-400', glow: '', text: 'text-blue-400' },
};

export default function StatCard({ title, value, icon: Icon, variant = 'violet', subtitle, trend, loading }) {
  const v = VARIANTS[variant] || VARIANTS.violet;

  if (loading) return (
    <div className="card">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-32" />
    </div>
  );

  return (
    <div className={clsx(
      'relative overflow-hidden rounded-2xl border p-6 transition-all duration-300',
      'bg-gradient-to-br shadow-lg hover:-translate-y-1 hover:shadow-xl',
      v.bg, v.border
    )}>
      {/* Background glow blob */}
      <div className={clsx('absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl', v.icon)} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-white mt-1.5 tabular-nums">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={clsx('flex items-center gap-1 mt-2 text-xs font-semibold', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-3 rounded-xl shrink-0', v.icon)}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
