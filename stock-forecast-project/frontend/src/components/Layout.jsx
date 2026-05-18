import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, PieChart, Lightbulb, FileText, Activity, Menu, X } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/market', icon: BarChart3, label: 'Market' },
  { path: '/analytics', icon: PieChart, label: 'Analytics' },
  { path: '/insights', icon: Lightbulb, label: 'Insights' },
  { path: '/reports', icon: FileText, label: 'Reports' },
];

const SIDEBAR_WIDTH = 256; // w-64 = 16rem = 256px

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-white text-[#191C1E]">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 bg-[#F7F9FB] border-r border-[#C6C6CD] transition-all duration-300 ease-in-out"
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="p-6 flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">PRECISION</span>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <div
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#131B2E] text-white'
                    : 'text-[#45464D] hover:bg-slate-200'
                }`}
              >
                <Icon size={20} />
                <span className="font-bold">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area - shifts with sidebar */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{
          marginLeft: sidebarOpen ? `${SIDEBAR_WIDTH}px` : '0',
        }}
      >
        {/* Top bar with hamburger */}
        <div className="sticky top-0 z-20 bg-[#F7F9FB] border-b border-[#C6C6CD] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="text-sm font-bold text-[#45464D] tracking-wide">PRECISION</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
