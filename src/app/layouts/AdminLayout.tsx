import { NavLink, Navigate, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { InitErrorBanner } from '../components/InitErrorBanner';
import {
  LayoutDashboard, Users, UserCheck, CalendarDays,
  Package, BookOpen, BarChart2, Settings, LogOut, Flower2, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/admin',           label: 'الرئيسية',  icon: LayoutDashboard, end: true },
  { to: '/admin/trainees',  label: 'المتدربون', icon: Users },
  { to: '/admin/trainers',  label: 'المدربون',  icon: UserCheck },
  { to: '/admin/sessions',  label: 'الجلسات',   icon: CalendarDays },
  { to: '/admin/packages',  label: 'الباقات',   icon: Package },
  { to: '/admin/bookings',  label: 'الحجوزات',  icon: BookOpen },
  { to: '/admin/reports',   label: 'التقارير',  icon: BarChart2 },
  { to: '/admin/settings',  label: 'الإعدادات', icon: Settings },
];

function SidebarContent({ onClose, user, logout, navigate }: {
  onClose?: () => void;
  user: any;
  logout: () => void;
  navigate: (to: string) => void;
}) {
  function handleLogout() {
    if (!window.confirm('هل أنت متأكد من تسجيل الخروج؟')) return;
    logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between" style={{ borderBottom: '1px solid #f0f1f3' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#0f172a' }}>
            <Flower2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              استوديو سيرين
            </p>
            <p style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.04em' }}>Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #f0f1f3' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>
              {user?.name?.slice(0, 1)}
            </span>
          </div>
          <div className="min-w-0">
            <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#1e293b' }} className="truncate">{user?.name}</p>
            <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>مدير النظام</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? '' : 'hover:bg-slate-50'}`
            }
            style={({ isActive }) => ({
              background: isActive ? '#0f172a' : 'transparent',
              color: isActive ? '#ffffff' : '#64748b',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? 'rgba(255,255,255,0.75)' : '#94a3b8' }} />
                <span style={{ fontWeight: isActive ? 600 : 400, fontSize: '0.85rem' }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid #f0f1f3' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-50"
          style={{ color: '#94a3b8', fontSize: '0.85rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || user.role !== 'admin') {
    return <Navigate to={`/${user?.role || 'login'}`} replace />;
  }

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ fontFamily: "'Cairo', sans-serif", background: '#f7f8fa' }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 fixed top-0 right-0 h-full z-20"
        style={{ background: '#ffffff', borderLeft: '1px solid #f0f1f3' }}
      >
        <SidebarContent user={user} logout={logout} navigate={navigate} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex" dir="rtl">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            className="relative w-64 h-full shadow-2xl mr-auto"
            style={{ background: '#ffffff', zIndex: 40 }}
          >
            <SidebarContent user={user} logout={logout} navigate={navigate} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-4"
        style={{ background: '#ffffff', borderBottom: '1px solid #f0f1f3' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#0f172a' }}>
            <Flower2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>استوديو سيرين</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl"
          style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
        >
          {mobileOpen ? <X className="w-5 h-5" style={{ color: '#64748b' }} /> : <Menu className="w-5 h-5" style={{ color: '#64748b' }} />}
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 md:mr-60 mt-14 md:mt-0 min-h-screen" style={{ background: '#f7f8fa' }}>
        <InitErrorBanner />
        <Outlet />
      </main>
    </div>
  );
}
