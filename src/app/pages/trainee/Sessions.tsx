import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { CalendarDays, Clock, MapPin, Users, Search, SlidersHorizontal, CheckCircle2, X, AlertCircle } from 'lucide-react';
import type { Session } from '../../data/types';
import { today, formatShortArabic } from '../../lib/date';

const formatDate = formatShortArabic;

function getStatusBadge(s: Session, isBooked: boolean) {
  if (isBooked) return { text: 'محجوزة', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
  if (s.status === 'full') return { text: 'مكتملة', bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' };
  if (s.status === 'cancelled') return { text: 'ملغاة', bg: '#fef2f2', color: '#ef4444', border: '#fecaca' };
  if (s.status === 'completed') return { text: 'منتهية', bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' };
  return { text: 'متاحة', bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' };
}

export default function TraineeSessions() {
  const { user } = useAuth();

  // ─── البيانات من الـ Store (مصدر وحيد للحقيقة) ───
  const initialized = useDataStore(s => s.initialized);
  const allSessions = useDataStore(s => s.sessions);
  const trainees    = useDataStore(s => s.trainees);
  const bookings    = useDataStore(s => s.bookings);
  const bookSession = useDataStore(s => s.bookSession);

  // أنواع الجلسات والفروع من بيانات الجلسات الفعلية
  const SESSION_TYPES = useMemo(() => {
    const types = Array.from(new Set(allSessions.map(s => s.type))).sort();
    return ['الكل', ...types];
  }, [allSessions]);

  const BRANCHES = useMemo(() => {
    const branchNames = Array.from(new Set(allSessions.map(s => s.branch))).sort();
    return ['الكل', ...branchNames];
  }, [allSessions]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [branchFilter, setBranchFilter] = useState('الكل');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const trainee = trainees.find(t => t.id === user?.id);
  const sub = trainee?.subscription;
  const remaining = sub && sub.totalSessions !== 999 ? sub.totalSessions - sub.usedSessions : (sub?.totalSessions === 999 ? 999 : 0);

  const upcomingSessions = allSessions.filter(s => s.date >= today());
  const filtered = upcomingSessions.filter(s => {
    const matchSearch = s.name.includes(search) || s.trainerName.includes(search);
    const matchType = typeFilter === 'الكل' || s.type === typeFilter;
    const matchBranch = branchFilter === 'الكل' || s.branch === branchFilter;
    return matchSearch && matchType && matchBranch;
  });

  const activeFiltersCount = (typeFilter !== 'الكل' ? 1 : 0) + (branchFilter !== 'الكل' ? 1 : 0);

  function isBooked(sId: string) {
    return bookings.some(b => b.sessionId === sId && b.traineeId === user?.id && b.status === 'confirmed');
  }

  function canBook(s: Session) {
    if (!sub || sub.status !== 'active') return false;
    if (sub.totalSessions !== 999 && sub.totalSessions - sub.usedSessions <= 0) return false;
    if (s.status === 'full' || s.status === 'cancelled' || s.status === 'completed') return false;
    if (isBooked(s.id)) return false;
    return true;
  }

  async function handleBook(s: Session) {
    if (!user) return;
    setBookError(null);
    const result = await bookSession(user.id, s.id);
    if (result.ok) {
      setBookingSuccess(true);
      setTimeout(() => { setBookingSuccess(false); setSelectedSession(null); }, 2200);
    } else {
      setBookError(result.reason ?? 'تعذّر إتمام الحجز');
      setTimeout(() => setBookError(null), 3200);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 px-5 py-4" style={{ background: '#f7f8fa', borderBottom: '1px solid #eef0f3' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              الجلسات المتاحة
            </h1>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              {sub?.totalSessions === 999 ? 'اشتراك مفتوح ∞' : `${remaining} جلسة متبقية في رصيدك`}
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <span
              className="px-2.5 py-1 rounded-full"
              style={{ background: '#0f172a', color: 'white', fontSize: '0.68rem', fontWeight: 600 }}
            >
              {activeFiltersCount} فلتر
            </span>
          )}
        </div>

        {/* Search row */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ right: '12px', color: '#cbd5e1' }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحثي عن جلسة أو مدربة..."
              className="w-full py-2.5 rounded-xl outline-none transition-all"
              style={{
                paddingRight: '38px',
                paddingLeft: '14px',
                fontSize: '0.83rem',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155',
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: showFilters ? '#0f172a' : '#ffffff',
              border: `1px solid ${showFilters ? '#0f172a' : '#e2e8f0'}`,
            }}
          >
            <SlidersHorizontal
              className="w-4 h-4"
              style={{ color: showFilters ? '#ffffff' : '#64748b' }}
            />
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div
            className="mt-3 p-4 rounded-2xl"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: '10px' }}>
              نوع الجلسة
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {SESSION_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className="px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: typeFilter === t ? 600 : 400,
                    background: typeFilter === t ? '#0f172a' : '#f1f5f9',
                    color: typeFilter === t ? '#ffffff' : '#64748b',
                    border: 'none',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: '10px' }}>
              الفرع
            </p>
            <div className="flex flex-wrap gap-1.5">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  onClick={() => setBranchFilter(b)}
                  className="px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: branchFilter === b ? 600 : 400,
                    background: branchFilter === b ? '#0f172a' : '#f1f5f9',
                    color: branchFilter === b ? '#ffffff' : '#64748b',
                    border: 'none',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sessions list ── */}
      <div className="px-5 py-4 space-y-3 max-w-2xl mx-auto">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>لا توجد جلسات بهذه المعايير</p>
          </div>
        )}

        {filtered.map(s => {
          const booked = isBooked(s.id);
          const bookable = canBook(s);
          const badge = getStatusBadge(s, booked);
          const availableSeats = s.capacity - s.enrolled;

          return (
            <div
              key={s.id}
              onClick={() => setSelectedSession(s)}
              className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md"
              style={{
                background: '#ffffff',
                border: `1px solid ${booked ? '#bbf7d0' : '#eef0f3'}`,
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 style={{ fontWeight: 600, fontSize: '0.93rem', color: '#0f172a' }}>{s.name}</h3>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>مع {s.trainerName}</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-lg flex-shrink-0 mr-3"
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: '#f1f5f9',
                    color: '#475569',
                    letterSpacing: '0.03em',
                  }}
                >
                  {s.type}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-3" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(s.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {s.startTime} – {s.endTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {s.branch}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                <span className="flex items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <Users className="w-3.5 h-3.5" />
                  {availableSeats > 0 ? `${availableSeats} مقعد متاح` : 'مكتملة'}
                </span>

                {booked ? (
                  <span className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    محجوزة
                  </span>
                ) : bookable ? (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedSession(s); }}
                    className="px-4 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ fontSize: '0.75rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none' }}
                  >
                    احجزي
                  </button>
                ) : s.status === 'full' ? (
                  <span
                    className="px-3 py-1.5 rounded-lg"
                    style={{ fontSize: '0.75rem', background: '#f8fafc', color: '#94a3b8' }}
                  >
                    قائمة انتظار
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>غير متاحة</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Session detail modal ── */}
      {selectedSession && !bookingSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6"
            style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{selectedSession.name}</h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>مع {selectedSession.trainerName}</p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-slate-100"
                style={{ background: '#f1f5f9', border: 'none' }}
              >
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-5">
              {[
                { icon: CalendarDays, label: 'التاريخ', value: formatDate(selectedSession.date) },
                { icon: Clock, label: 'الوقت', value: `${selectedSession.startTime} – ${selectedSession.endTime}` },
                { icon: MapPin, label: 'المكان', value: selectedSession.branch },
                { icon: Users, label: 'المقاعد المتبقية', value: `${selectedSession.capacity - selectedSession.enrolled} من ${selectedSession.capacity}` },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f1f5f9' }}
                  >
                    <row.icon className="w-4 h-4" style={{ color: '#64748b' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{row.label}</p>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem', color: '#1e293b' }}>{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Policy note */}
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <p style={{ fontSize: '0.775rem', color: '#92400e', lineHeight: 1.6 }}>
                سياسة الإلغاء: يُسمح مجاناً قبل {sub?.cancellationHours || 3} ساعات من الجلسة
              </p>
            </div>

            {/* Action */}
            {canBook(selectedSession) ? (
              <button
                onClick={() => handleBook(selectedSession)}
                className="w-full py-3.5 rounded-2xl transition-all hover:opacity-90"
                style={{ fontWeight: 700, fontSize: '0.9rem', background: '#0f172a', color: '#ffffff', border: 'none' }}
              >
                تأكيد الحجز — خصم جلسة واحدة
              </button>
            ) : isBooked(selectedSession.id) ? (
              <div
                className="w-full py-3.5 rounded-2xl text-center"
                style={{ fontWeight: 600, fontSize: '0.9rem', background: '#f0fdf4', color: '#16a34a' }}
              >
                ✓ هذه الجلسة محجوزة بالفعل
              </div>
            ) : (
              <div
                className="w-full py-3.5 rounded-2xl text-center"
                style={{ fontWeight: 500, fontSize: '0.9rem', background: '#f8fafc', color: '#94a3b8' }}
              >
                الحجز غير متاح
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error toast ── */}
      {bookError && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
          style={{ background: '#fef2f2', border: '1px solid #fecaca', maxWidth: '90vw' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />
          <p style={{ fontSize: '0.83rem', color: '#991b1b', fontWeight: 500 }}>{bookError}</p>
        </div>
      )}

      {/* ── Success modal ── */}
      {bookingSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="p-8 rounded-3xl text-center shadow-2xl mx-4"
            style={{ background: '#ffffff', maxWidth: '280px', width: '100%' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#f0fdf4' }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: '#16a34a' }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '6px' }}>
              تم الحجز بنجاح
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>تم خصم جلسة واحدة من رصيدك</p>
          </div>
        </div>
      )}
    </div>
  );
}
