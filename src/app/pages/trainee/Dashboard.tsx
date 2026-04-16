import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import {
  CalendarDays, Clock, CheckCircle2, ChevronLeft,
  Sparkles, TrendingUp, BookOpen, ArrowLeft,
} from 'lucide-react';
import { today, daysBetween, formatShortArabic, getGreeting } from '../../lib/date';

const formatDateShort = formatShortArabic;

// Hero banner image
const BANNER = 'https://images.unsplash.com/photo-1758791837823-6552cf6774a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200';

export default function TraineeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialized = useDataStore(s => s.initialized);
  const trainees = useDataStore(s => s.trainees);
  const bookings = useDataStore(s => s.bookings);
  const sessions = useDataStore(s => s.sessions);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const trainee = trainees.find(t => t.id === user?.id);
  const sub = trainee?.subscription;

  const myBookings = bookings.filter(b => b.traineeId === user?.id);
  const upcoming   = myBookings.filter(b => b.status === 'confirmed' && b.date >= today());
  const attended   = myBookings.filter(b => b.status === 'attended').length;

  const nextBooking = [...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextSession = nextBooking ? sessions.find(s => s.id === nextBooking.sessionId) : null;

  const remaining   = sub ? (sub.totalSessions === 999 ? 999 : sub.totalSessions - sub.usedSessions) : 0;
  const progressPct = sub && sub.totalSessions !== 999
    ? Math.min((sub.usedSessions / sub.totalSessions) * 100, 100)
    : 0;
  const daysLeft = sub ? Math.max(0, daysBetween(today(), sub.endDate)) : 0;

  const quickLinks = [
    { label: 'الجلسات',   icon: CalendarDays, to: '/trainee/sessions',      desc: 'احجزي جلسة جديدة' },
    { label: 'حجوزاتي',  icon: BookOpen,      to: '/trainee/bookings',      desc: 'جدولك القادم' },
    { label: 'اشتراكي',  icon: TrendingUp,    to: '/trainee/subscription',  desc: 'رصيد ومتابعة' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: '#f7f8fa', borderBottom: '1px solid #eef0f3' }}
      >
        <div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
            {new Date(today()).toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
            {getGreeting()}، {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: '#0f172a' }}
          onClick={() => navigate('/trainee/profile')}
        >
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>
            {user?.name?.slice(0, 1)}
          </span>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-5">

        {/* ── Banner / Subscription card ── */}
        {sub ? (
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ background: '#0f172a', minHeight: '180px' }}
          >
            {/* Background image */}
            <img
              src={BANNER}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center opacity-20"
            />

            <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: '180px' }}>
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    الباقة الحالية
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', marginTop: '2px' }}>
                    {sub.packageName}
                  </p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    background: sub.status === 'active' ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.2)',
                    color: sub.status === 'active' ? 'rgba(255,255,255,0.7)' : '#fca5a5',
                    border: '1px solid rgba(255,255,255,0.12)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {sub.status === 'active' ? 'فعّالة' : sub.status === 'frozen' ? 'مجمدة' : 'منتهية'}
                </span>
              </div>

              {/* Sessions count */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span style={{ fontWeight: 800, fontSize: '3.2rem', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em' }}>
                    {sub.totalSessions === 999 ? '∞' : remaining}
                  </span>
                  {sub.totalSessions !== 999 && (
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      / {sub.totalSessions} جلسة
                    </span>
                  )}
                </div>

                {sub.totalSessions !== 999 && (
                  <div>
                    <div
                      className="h-1 rounded-full overflow-hidden mb-1.5"
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.7)' }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
                        {sub.usedSessions} مستخدمة
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
                        ينتهي خلال {daysLeft} يوم
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>لا يوجد اشتراك فعال حالياً</p>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-4"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#f1f5f9' }}
              >
                <CalendarDays className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>جلسات قادمة</p>
            </div>
            <p style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', lineHeight: 1, letterSpacing: '-0.04em' }}>
              {upcoming.length}
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#f1f5f9' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>جلسات حضرت</p>
            </div>
            <p style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', lineHeight: 1, letterSpacing: '-0.04em' }}>
              {attended}
            </p>
          </div>
        </div>

        {/* ── Next Session ── */}
        {nextSession && nextBooking && (
          <div
            className="rounded-2xl p-5"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  جلستك القادمة
                </p>
              </div>
              <button
                onClick={() => navigate('/trainee/bookings')}
                className="flex items-center gap-1 transition-all"
                style={{ fontSize: '0.72rem', color: '#94a3b8' }}
              >
                كل الحجوزات
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '6px' }}>
                  {nextSession.name}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    <CalendarDays className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    {formatDateShort(nextBooking.date)}
                  </span>
                  <span className="flex items-center gap-1.5" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    {nextSession.startTime}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                  مع {nextSession.trainerName} · {nextSession.branch}
                </p>
              </div>
              <button
                onClick={() => navigate('/trainee/bookings')}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-slate-100"
                style={{ background: '#f1f5f9', flexShrink: 0 }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            وصول سريع
          </p>
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map(link => (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className="flex flex-col items-start p-4 rounded-2xl transition-all hover:border-slate-200 hover:shadow-sm"
                style={{ background: '#ffffff', border: '1px solid #eef0f3', textAlign: 'right' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#f1f5f9' }}
                >
                  <link.icon className="w-4 h-4" style={{ color: '#475569' }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#1e293b', marginBottom: '2px' }}>
                  {link.label}
                </p>
                <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{link.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Primary CTA ── */}
        <button
          onClick={() => navigate('/trainee/sessions')}
          className="w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all hover:opacity-90"
          style={{ background: '#0f172a' }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
            احجزي جلسة جديدة
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* ── Alerts ── */}
        {sub && daysLeft <= 7 && daysLeft > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#92400e' }}>
              اشتراكك ينتهي خلال {daysLeft} أيام
            </p>
            <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
              تواصلي مع الإدارة لتجديد اشتراكك
            </p>
          </div>
        )}
        {sub && remaining <= 2 && sub.totalSessions !== 999 && remaining > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#f8f4ff', border: '1px solid #e9d5ff' }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#6b21a8' }}>
              لديكِ {remaining} جلسة متبقية فقط
            </p>
            <p style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '2px' }}>
              تواصلي مع الإدارة لتجديد أو ترقية باقتك
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
