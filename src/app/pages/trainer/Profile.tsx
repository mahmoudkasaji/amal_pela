import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { User, Mail, Phone, MapPin, Star, LogOut, Lock, ChevronLeft, CheckCircle2, Bell } from 'lucide-react';

export default function TrainerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const trainers = useDataStore(s => s.trainers);
  const sessions = useDataStore(s => s.sessions);
  const bookings = useDataStore(s => s.bookings);
  const trainer = trainers.find(t => t.id === user?.id);

  const [showPassForm, setShowPassForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState([true, false, true]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  // Stats
  const mySessionsAll = sessions.filter(s => s.trainerId === user?.id);
  const totalSessions = mySessionsAll.length;
  const completed     = mySessionsAll.filter(s => s.status === 'completed').length;
  const myBookings    = bookings.filter(b => b.trainerName === user?.name);
  const uniqueTrainees = new Set(myBookings.map(b => b.traineeId)).size;

  async function handleSave() {
    setPassError(null);
    if (!newPassword || !confirmPassword) {
      setPassError('أدخل كلمة المرور الجديدة وتأكيدها');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
      return;
    }
    setPassLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPassError(error.message);
        return;
      }
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setSaved(false); setShowPassForm(false); }, 2000);
    } catch {
      setPassError('حدث خطأ غير متوقع');
    } finally {
      setPassLoading(false);
    }
  }

  function handleLogout() {
    if (!window.confirm('هل أنت متأكد من تسجيل الخروج؟')) return;
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #eef0f3' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
          ملفي الشخصي
        </h1>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
          معلوماتك ومعطياتك كمدربة
        </p>
      </div>

      <div className="px-5 py-5 space-y-4 max-w-2xl mx-auto">

        {/* ── Avatar + identity ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0f172a' }}
        >
          <div className="p-6 text-center">
            <div
              className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ width: '72px', height: '72px', background: 'rgba(255,255,255,0.1)' }}
            >
              <span style={{ fontWeight: 800, fontSize: '1.8rem', color: '#ffffff' }}>
                {user?.name?.slice(0, 1)}
              </span>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff', marginBottom: '4px' }}>
              {user?.name}
            </h2>
            {trainer?.specialty && (
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '12px' }}>
                {trainer.specialty}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                className="px-3 py-1 rounded-full"
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                مدربة فعالة
              </span>
              {trainer?.branch && (
                <span className="flex items-center gap-1" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
                  <MapPin className="w-3 h-3" />
                  {trainer.branch}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {[
              { label: 'إجمالي الجلسات', value: totalSessions },
              { label: 'جلسات مكتملة',   value: completed },
              { label: 'متدربات',          value: uniqueTrainees },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center py-4"
                style={{ background: '#0f172a' }}
              >
                <p style={{ fontWeight: 800, fontSize: '1.5rem', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Personal info ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f172a' }}>البيانات الشخصية</p>
          </div>
          <div>
            {[
              { Icon: User,  label: 'الاسم الكامل',    value: user?.name        || '—' },
              { Icon: Mail,  label: 'البريد الإلكتروني', value: user?.email      || '—' },
              { Icon: Phone, label: 'رقم الهاتف',       value: user?.phone      || '—' },
              { Icon: Star,  label: 'التخصص',           value: trainer?.specialty || '—' },
              { Icon: MapPin,label: 'الفرع',            value: trainer?.branch   || '—' },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#f1f5f9' }}
                >
                  <row.Icon className="w-4 h-4" style={{ color: '#64748b' }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>{row.label}</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Change password ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
        >
          <button
            onClick={() => setShowPassForm(!showPassForm)}
            className="w-full flex items-center justify-between px-5 py-4 transition-all hover:bg-slate-50"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                <Lock className="w-4 h-4" style={{ color: '#64748b' }} />
              </div>
              <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155' }}>تغيير كلمة المرور</span>
            </div>
            <ChevronLeft
              className="w-4 h-4 transition-transform"
              style={{ color: '#cbd5e1', transform: showPassForm ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            />
          </button>

          {showPassForm && (
            <div className="px-5 pb-5 space-y-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
              <div className="pt-4 space-y-2.5">
                {([
                  { ph: 'كلمة المرور الحالية', value: currentPassword, set: setCurrentPassword },
                  { ph: 'كلمة المرور الجديدة', value: newPassword, set: setNewPassword },
                  { ph: 'تأكيد كلمة المرور', value: confirmPassword, set: setConfirmPassword },
                ] as const).map(field => (
                  <input
                    key={field.ph}
                    type="password"
                    placeholder={field.ph}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl outline-none transition-all"
                    style={{
                      fontSize: '0.85rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#334155',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#94a3b8';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                  />
                ))}
              </div>
              {passError && (
                <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>{passError}</p>
              )}
              <button
                onClick={handleSave}
                disabled={passLoading}
                className="w-full py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ fontWeight: 700, fontSize: '0.85rem', background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                {saved
                  ? <span className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> تم الحفظ</span>
                  : passLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'
                }
              </button>
            </div>
          )}
        </div>

        {/* ── Notifications ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
        >
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
              <Bell className="w-4 h-4" style={{ color: '#64748b' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f172a' }}>الإشعارات</p>
          </div>
          <div>
            {['إشعار قبل الجلسة', 'تذكير تسجيل الحضور', 'إشعار عند حجز متدربة جديدة'].map((item, i, arr) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none' }}
              >
                <span style={{ fontSize: '0.83rem', color: '#475569' }}>{item}</span>
                <button
                  onClick={() => setNotifications(prev => prev.map((v, idx) => idx === i ? !v : v))}
                  className="relative flex-shrink-0"
                  style={{
                    width: '38px', height: '22px',
                    borderRadius: '9999px',
                    background: notifications[i] ? '#0f172a' : '#e2e8f0',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <span
                    className="absolute top-1"
                    style={{
                      width: '14px', height: '14px',
                      borderRadius: '9999px',
                      background: '#ffffff',
                      left: notifications[i] ? '20px' : '4px',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-slate-100"
          style={{ fontWeight: 600, fontSize: '0.875rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>

      </div>
    </div>
  );
}
