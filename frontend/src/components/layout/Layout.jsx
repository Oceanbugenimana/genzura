import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../../store/uiStore';
import clsx from 'clsx';

export default function Layout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className={clsx(
        'flex flex-col flex-1 overflow-hidden transition-all duration-300',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]'
      )}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-950">
          {/* Subtle mesh background */}
          <div className="fixed inset-0 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.05) 0%, transparent 60%)' }}
          />
          <div className="relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
