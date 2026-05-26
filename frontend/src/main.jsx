import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './i18n';
import './index.css';
import { useUIStore } from './store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
  },
});

function ThemeInit() {
  const { initTheme } = useUIStore();
  useEffect(() => { initTheme(); }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInit />
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #111827)',
              color: 'var(--toast-color, #f9fafb)',
              border: '1px solid var(--toast-border, #374151)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f9fafb' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
          }}
        />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
