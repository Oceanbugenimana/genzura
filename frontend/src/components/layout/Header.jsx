import { Menu, Bell, Globe, Sun, Moon, Search } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useNotifications } from '../../hooks/useNotifications';
import i18n from '../../i18n';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import NotificationPanel from '../ui/NotificationPanel';

const LANGUAGES = [
  { code: 'en', label: 'English',     flag: '🇬🇧' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'sw', label: 'Kiswahili',   flag: '🇹🇿' },
  { code: 'fr', label: 'Français',    flag: '🇫🇷' },
];

export default function Header() {
  const { toggleSidebar, darkMode, toggleDarkMode, toggleNotificationPanel, notificationPanelOpen } = useUIStore();
  const { user } = useAuthStore();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const { data: notifData } = useNotifications({ status: 'PENDING', limit: 1 });
  const pendingCount = notifData?.pagination?.total || 0;

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('genzura-lang', code);
    setLangOpen(false);
  };

  return (
    <>
      <header
        className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-20 backdrop-blur-xl"
        style={{
          background: 'rgba(var(--bg-surface-rgb, 15,23,42), 0.85)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="btn-icon lg:hidden">
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-56"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
            <input
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: 'var(--text-secondary)' }}
              placeholder="Quick search..."
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">

          {/* Dark / Light toggle */}
          <button
            onClick={toggleDarkMode}
            className="btn-icon p-2.5"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode
              ? <Sun size={18} className="text-amber-400" />
              : <Moon size={18} className="text-indigo-400" />
            }
          </button>

          {/* Language */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="btn-icon flex items-center gap-1.5 px-3 py-2"
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
              <span className="hidden sm:block text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {currentLang.code}
              </span>
            </button>
            {langOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-1.5 w-44 z-50 animate-scale-in"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors"
                    style={{
                      color: i18n.language === lang.code ? '#a78bfa' : 'var(--text-secondary)',
                      background: i18n.language === lang.code ? 'rgba(124,58,237,0.1)' : '',
                    }}
                    onMouseEnter={e => { if (i18n.language !== lang.code) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { if (i18n.language !== lang.code) e.currentTarget.style.background = ''; }}
                  >
                    <span>{lang.flag}</span>
                    <span className="flex-1">{lang.label}</span>
                    {i18n.language === lang.code && <span className="text-violet-400 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications bell */}
          <button
            onClick={toggleNotificationPanel}
            className={clsx('btn-icon relative p-2.5', notificationPanelOpen && 'bg-violet-500/15 text-violet-400')}
            title="Notifications"
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-black animate-bounce-in">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

          {/* Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg shadow-violet-500/30 shrink-0">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Notification slide-over panel */}
      <NotificationPanel />
    </>
  );
}
