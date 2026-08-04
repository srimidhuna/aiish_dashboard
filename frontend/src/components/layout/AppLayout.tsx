import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../ThemeProvider';
import {
  Baby,
  BarChart3,
  Calendar,
  LayoutDashboard,
  Settings,
  Hospital,
  Moon,
  Bell,
  ChevronLeft,
  UserPlus,
  Users,
  Maximize2,
  Repeat,
} from 'lucide-react';
import { useState } from 'react';

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Register Child', path: '/children/register', icon: UserPlus },
    { label: 'Children', path: '/children', icon: Baby },
    { label: 'Re-Screening', path: '/rescreening', icon: Repeat },
    { label: 'Follow-ups', path: '/follow-ups', icon: Calendar },
    { label: 'Staff', path: '/staff', icon: Users },
    { label: 'Hospitals', path: '/hospitals', icon: Hospital },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f4f6fb] dark:bg-background overflow-hidden print:h-auto print:bg-white print:overflow-visible">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-60' : 'w-[72px]'} transition-all duration-300 flex flex-col shrink-0 relative print:hidden`}
        style={{
          background: isDark 
            ? 'linear-gradient(160deg, #020617 0%, #1e1b4b 100%)' 
            : 'linear-gradient(160deg, #1a0a4e 0%, #2d1580 30%, #5b21b6 65%, #7c3aed 100%)',
        }}
      >
        {/* Decorative wave at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 130%, rgba(139,92,246,0.5) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="h-16 flex items-center px-4 gap-3 shrink-0">
          <img src="/aiish-logo.png" alt="AIISH Logo" className="w-10 h-10 rounded-xl shrink-0 object-cover bg-white" />
          {sidebarOpen && (
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-white text-base tracking-wide">AIISH NHSFMS</span>
              <span className="text-[10px] text-white/50 font-medium">Newborn Hearing Screening</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10">
          {navItems.map((item) => {
            const isActive = item.path === '/children/register'
              ? location.pathname === '/children/register'
              : location.pathname.startsWith(item.path) && !location.pathname.startsWith(item.path + '/register');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'text-white shadow-lg'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                style={isActive ? {
                  background: isDark 
                    ? 'linear-gradient(135deg, #9d4edd 0%, #5a189a 100%)' // Softer, lower contrast purple
                    : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  boxShadow: isDark ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.4)',
                } : {}}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                {sidebarOpen && (
                  <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/70'}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 px-4 py-4 text-white/60 hover:text-white border-t border-white/10 transition-colors text-sm relative z-10"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
          {sidebarOpen && <span className="text-xs font-medium">Toggle Sidebar</span>}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        {/* Top Header — Dark AIISH Banner */}
        <header
          className="h-20 flex items-center justify-end px-6 shrink-0 relative border-b border-white/5 print:hidden"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, #020617 0%, #0f172a 50%, #020617 100%)'
              : 'linear-gradient(90deg, #1e1145 0%, #2d1a6e 50%, #1e1145 100%)',
          }}
        >
          {/* Center: AIISH Logo + Title */}
          <div className="absolute left-[47%] -translate-x-1/2 flex items-center gap-5 w-max">
            {/* AIISH emblem */}
            <img src="/aiish-logo.png" alt="AIISH Logo" className="w-16 h-16 rounded-full shrink-0 object-cover bg-white shadow-sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-extrabold text-white tracking-wide uppercase">
                AIISH Newborn Hearing Screening &amp;
                <br />
                Follow-Up Management System (NHSFMS)
              </span>
              <span className="text-[10px] text-blue-300/80 font-medium uppercase tracking-wider mt-0.5">
                Department of Prevention of Communication Disorders (POCD)
              </span>
              <span className="text-[9px] text-blue-300/50 font-medium mt-0.5">
                Web Portal &amp; Mobile Application for Nationwide Newborn Hearing Screening Services
              </span>
            </div>
          </div>

          {/* Right: Icons + Avatar */}
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <Moon className="h-4 w-4" />
            </button>

            {/* Bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1e1145]" />
            </button>

            {/* Fullscreen */}
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-white/10" />

            {/* Avatar + name */}
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(user.name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-white">{user.name ?? 'User'}</span>
                <span className="text-[10px] text-white/40">{(user as any).role ?? 'admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-6 bg-[#f4f6fb] dark:bg-background print:overflow-visible print:bg-white print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
