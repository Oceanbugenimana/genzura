import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export default function StockBadge({ quantity, minimumStock }) {
  if (quantity === 0) return (
    <span className="badge-danger">
      <XCircle size={10} /> Out of Stock
    </span>
  );
  if (quantity <= minimumStock) return (
    <span className="badge-warning">
      <AlertTriangle size={10} /> Low Stock
    </span>
  );
  return (
    <span className="badge-success">
      <CheckCircle size={10} /> In Stock
    </span>
  );
}
