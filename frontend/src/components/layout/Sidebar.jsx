import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Package, Store, Tag, ArrowLeftRight,
  BarChart3, Bell, Users, Settings, Sparkles, LogOut,
  ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',   color: 'text-violet-400' },
  { to: '/products',     icon: Package,          label: 'Products',    color: 'text-blue-400' },
  { to: '/stores',       icon: Store,            label: 'Stores',      color: 'text-emerald-400' },
  { to: '/categories',   icon: Tag,              label: 'Categories',  color: 'text-amber-400' },
  { to: '/inventory',    icon: ArrowLeftRight,   label: 'Inventory',   color: 'text-cyan-400' },
  { to: '/reports',      icon: BarChart3,        label: 'Reports',     color: 'text-pink-400' },
  { to: '/ai-insights',  icon: Sparkles,         label: 'AI Insights', color: 'text-purple-400' },
  { to: '/notifications',icon: Bell,             label: 'Alerts',      color: 'text-orange-400' },
  { to: '/users',        icon: Users,            label: 'Users',       color: 'text-red-400', roles: ['ADMIN'] },
  { to: '/settings',     icon: Settings,         label: 'Settings',    color: 'text-gray-400' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const items = NAV.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={clsx(
        'fixed left-0 top-0 h-full z-30 flex flex-col',
        'bg-gray-950 border-r border-gray-800/80',
        'transition-all duration-300 ease-spring',
        sidebarOpen ? 'w-64' : 'w-[70px]',
        !sidebarOpen && '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800/80 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 flex-1 animate-fade-in">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <span className="font-black text-white text-lg tracking-tight">GENZURA</span>
                <p className="text-xs text-gray-600 -mt-0.5">Inventory Pro</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
              <Zap size={18} className="text-white" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex btn-icon p-1.5 ml-auto shrink-0"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {items.map(({ to, icon: Icon, label, color }, i) => (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                'animate-slide-left',
                isActive
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border border-violet-500/30 shadow-lg shadow-violet-500/10'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/60'
              )}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <Icon size={18} className={clsx('shrink-0 transition-colors', 'group-hover:' + color)} />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-800/80 p-3 shrink-0">
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 px-2 py-2 mb-1 rounded-xl bg-gray-800/40">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold">
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : undefined}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
