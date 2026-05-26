import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle size={64} className="text-slate-600 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-slate-700 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Page Not Found</h2>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <Home size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
