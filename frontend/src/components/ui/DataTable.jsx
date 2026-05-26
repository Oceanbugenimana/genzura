import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

function Skeleton() {
  return (
    <div className="table-wrapper">
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-12" style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function DataTable({ columns, data, pagination, onPageChange, loading, emptyMessage, emptyIcon: EmptyIcon }) {
  if (loading) return <Skeleton />;

  return (
    <div className="table-wrapper animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key + col.label} className="table-header" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!data?.length ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                    {EmptyIcon && <EmptyIcon size={40} className="mb-3 opacity-30" />}
                    <p className="text-sm">{emptyMessage || 'No data available'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  className="table-row animate-fade-in"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {columns.map((col) => (
                    <td key={col.key + col.label} className="table-cell">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/50">
          <p className="text-xs text-gray-500">
            Showing <span className="text-gray-300 font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>–
            <span className="text-gray-300 font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="text-gray-300 font-medium">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(1)} disabled={pagination.page <= 1} className="btn-icon p-1.5 disabled:opacity-30">
              <ChevronsLeft size={14} />
            </button>
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1} className="btn-icon p-1.5 disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded-lg">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="btn-icon p-1.5 disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
            <button onClick={() => onPageChange(pagination.totalPages)} disabled={pagination.page >= pagination.totalPages} className="btn-icon p-1.5 disabled:opacity-30">
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
