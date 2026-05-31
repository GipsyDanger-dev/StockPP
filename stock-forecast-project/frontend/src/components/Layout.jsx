import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, PieChart, Lightbulb, FileText,
  Activity, Menu, X, Settings, LogOut, User, Shield, Target,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SIDEBAR_WIDTH = 256;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/market', icon: BarChart3, label: 'Market' },
    { path: '/analytics', icon: PieChart, label: 'Analytics' },
    { path: '/predictions', icon: Target, label: 'Predictions' },
    { path: '/insights', icon: Lightbulb, label: 'Insights' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  const adminItems = [
    { path: '/admin', icon: Settings, label: 'Admin Panel' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[var(--dark-bg)] text-white">
      <aside
        className="fixed inset-y-0 left-0 z-40 bg-[var(--dark-surface)] border-r border-[var(--dark-border)] flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div
          className="p-5 flex items-center gap-3 border-b border-[var(--dark-border)] cursor-pointer hover:bg-[var(--dark-border)] transition-colors"
          onClick={() => handleNav('/dashboard')}
          role="button"
          aria-label="Go to Dashboard"
          tabIndex={0}
        >
          <div className="w-9 h-9 bg-[var(--dark-navy)] rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={18} />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white">PRECISION</span>
            <span className="block text-[10px] text-[var(--gray-mid)] tracking-wider">ANALYTICS</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-[var(--gray-mid)] uppercase tracking-wider">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <div
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  active
                    ? 'bg-[var(--dark-navy)] text-white shadow-sm'
                    : 'text-[var(--gray-mid)] hover:bg-[var(--dark-border)] hover:text-white'
                }`}
                role="button"
                aria-label={item.label}
                tabIndex={0}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-[10px] font-semibold text-[var(--gray-mid)] uppercase tracking-wider">
                  Administration
                </p>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <div
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                      active
                        ? 'bg-[var(--dark-navy)] text-white shadow-sm'
                        : 'text-[var(--gray-mid)] hover:bg-[var(--dark-border)] hover:text-white'
                    }`}
                    role="button"
                    aria-label={item.label}
                    tabIndex={0}
                  >
                    <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                    <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-[var(--dark-border)]">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 bg-[var(--dark-navy)] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-[var(--gray-mid)] truncate">{user?.email || ''}</p>
            </div>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-semibold flex-shrink-0">
                <Shield size={10} />
                Admin
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-[var(--gray-mid)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen && window.innerWidth >= 1024 ? `${SIDEBAR_WIDTH}px` : '0' }}
      >
        <header className="sticky top-0 z-20 bg-[var(--dark-surface)]/80 backdrop-blur-md border-b border-[var(--dark-border)] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--dark-border)] rounded-lg transition-colors relative"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <div className="w-5 h-5 relative">
              <span
                className={`absolute left-0 top-1/2 w-5 h-[1.5px] bg-white transition-all duration-300 ${
                  sidebarOpen ? 'rotate-45 top-[9px]' : '-translate-y-[5px]'
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 w-5 h-[1.5px] bg-white transition-all duration-300 ${
                  sidebarOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 w-5 h-[1.5px] bg-white transition-all duration-300 ${
                  sidebarOpen ? '-rotate-45 top-[9px]' : 'translate-y-[5px]'
                }`}
              />
            </div>
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            role="button"
            aria-label="Go to Dashboard"
            tabIndex={0}
          >
            <span className="text-sm font-bold text-white tracking-wide">PRECISION</span>
            <span className="text-[10px] text-[var(--gray-mid)] font-medium">ANALYTICS</span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
