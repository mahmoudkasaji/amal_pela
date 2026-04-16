import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { CalendarDays, Users, ClipboardList, Clock, ChevronLeft, TrendingUp } from 'lucide-react';
import { today, addDays, formatShortArabic, getGreeting } from '../../lib/date';

const formatDateShort = formatShortArabic;

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialized = useDataStore(s => s.initialized);
  const sessions = useDataStore(s => s.sessions);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const t = today();
  const weekEnd = addDays(t, 6);
  const mySessions       = sessions.filter(s => s.trainerId === user?.id);
  const todaySessions    = mySessions.filter(s => s.date === t);
  const upcomingSessions = mySessions.filter(s => s.date > t).slice(0, 4);
  const totalToday       = todaySessions.reduce((acc, s) => acc + s.enrolled, 0);
  const weekSessions     = mySessions.filter(s => s.date >= t && s.date <= weekEnd);

  const statusStyle = (status: string) => {
    if (status === 'open')      return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'مفتوحة' };
    if (status === 'full')      return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'مكتملة' };
    if (status === 'completed') return { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'منتهية' };
    return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'ملغاة' };
  };

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: '#f7f8fa', borderBottom: '1px solid #eef0f3' }}
      >
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
            {new Date(t).toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
            {getGreeting()}، {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: '#0f172a' }}
          onClick={() => navigate('/trainer/profile')}
        >
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>
            {user?.name?.slice(0, 1)}
          </span>
        </div>
      </div>

      <div className="px-5 py-5 max-w-2xl mx-auto space-y-5">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: CalendarDays, label: 'جلسات اليوم',  value: todaySessions.length,  to: '/trainer/schedule' },
            { icon: Users,        label: 'متدربة اليوم', value: totalToday,             to: '/trainer/trainees' },
            { icon: TrendingUp,   label: 'هذا الأسبوع',  value: weekSessions.length,    to: '/trainer/schedule' },
          ].map(stat => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.to)}
              className="rounded-2xl p-4 text-right transition-all hover:shadow-sm"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center mb-3"
                style={{ background: '#f1f5f9' }}
              >
                <stat.icon className="w-3.5 h-3.5" style={{ color: '#475569' }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: '1.8rem', color: '#0f172a', lineHeight: 1, letterSpacing: '-0.04em' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</p>
            </button>
          ))}
        </div>

        {/* ── Today's sessions ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              جلسات اليوم
            </p>
            <button
              onClick={() => navigate('/trainer/schedule')}
              className="flex items-center gap-1 transition-all"
              style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: '#e2e8f0' }} />
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>لا توجد جلسات اليوم</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(s => {
                const st = statusStyle(s.status);
                const fillPct = (s.enrolled / s.capacity) * 100;
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl p-4"
                    style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: '0.93rem', color: '#0f172a', marginBottom: '3px' }}>
                          {s.name}
                        </h3>
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.branch}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5" style={{ color: '#64748b' }}>
                          <Clock className="w-3.5 h-3.5" />
                          <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f172a' }}>{s.startTime}</span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ fontSize: '0.62rem', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>
                    {/* capacity bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${fillPct}%`, background: fillPct >= 90 ? '#d97706' : '#0f172a' }}
                        />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', flexShrink: 0 }}>
                        {s.enrolled} / {s.capacity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Upcoming sessions ── */}
        {upcomingSessions.length > 0 && (
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              قادمة قريباً
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              {upcomingSessions.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: i < upcomingSessions.length - 1 ? '1px solid #f8fafc' : 'none' }}
                >
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.85rem', color: '#334155' }}>{s.name}</p>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                      {formatDateShort(s.date)} · {s.startTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                    <Users className="w-3.5 h-3.5" />
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.enrolled}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            وصول سريع
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'تسجيل الحضور', desc: 'سجّلي حضور الجلسات', icon: ClipboardList, to: '/trainer/attendance' },
              { label: 'المتدربون',     desc: 'قائمة متدرباتك',    icon: Users,         to: '/trainer/trainees' },
            ].map(action => (
              <button
                key={action.to}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-start p-4 rounded-2xl text-right transition-all hover:shadow-sm"
                style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#f1f5f9' }}
                >
                  <action.icon className="w-4 h-4" style={{ color: '#475569' }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', marginBottom: '2px' }}>{action.label}</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{action.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Reminder ── */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: '#f8fafc', border: '1px solid #eef0f3' }}
        >
          <ClipboardList className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#475569' }}>تذكير</p>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.6 }}>
              لا تنسي تسجيل الحضور بعد انتهاء كل جلسة
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
