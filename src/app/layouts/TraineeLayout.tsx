import { NavLink, Navigate, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CalendarDays, BookOpen, CreditCard, User, LogOut, Flower2 } from 'lucide-react';

const navItems = [
  { to: '/trainee',              label: 'الرئيسية',  icon: LayoutDashboard, end: true },
  { to: '/trainee/sessions',     label: 'الجلسات',   icon: CalendarDays },
  { to: '/trainee/bookings',     label: 'حجوزاتي',   icon: BookOpen },
  { to: '/trainee/subscription', label: 'اشتراكي',   icon: CreditCard },
  { to: '/trainee/profile',      label: 'ملفي',       icon: User },
];

export default function TraineeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'trainee') {
    return <Navigate to={`/${user?.role || 'login'}`} replace />;
  }

  function handleLogout() {
    if (!window.confirm('هل أنت متأكد من تسجيل الخروج؟')) return;
    logout();
    navigate('/login');
  }

  const initials = user?.name?.slice(0, 1) || 'م';

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: '#f7f8fa' }} className="min-h-screen flex">

      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden md:flex flex-col w-60 fixed top-0 right-0 h-full z-20"
        style={{ background: '#ffffff', borderLeft: '1px solid #f0f1f3' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #f0f1f3' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#0f172a' }}
            >
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                استوديو سيرين
              </p>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.04em' }}>Trainee Space</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #f0f1f3' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#f1f5f9' }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>{initials}</span>
            </div>
            <div className="min-w-0">
              <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#1e293b' }} className="truncate">
                {user?.name}
              </p>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>متدربة</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive ? '' : 'hover:bg-slate-50'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? '#0f172a' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? 'rgba(255,255,255,0.85)' : '#94a3b8' }}
                  />
                  <span style={{ fontWeight: isActive ? 600 : 400, fontSize: '0.85rem' }}>
                    {item.label}
                  </span>
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
            style={{ color: '#94a3b8', fontSize: '0.85rem' }}
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        className="flex-1 md:mr-60 pb-20 md:pb-0 min-h-screen"
        style={{ background: '#f7f8fa' }}
      >
        <Outlet />
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 px-4 py-2"
        style={{ background: '#ffffff', borderTop: '1px solid #f0f1f3' }}
      >
        <div className="flex justify-around">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-1 px-2 py-1">
                  <item.icon
                    className="w-5 h-5 transition-colors"
                    style={{ color: isActive ? '#0f172a' : '#cbd5e1' }}
                  />
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#0f172a' : '#94a3b8',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}