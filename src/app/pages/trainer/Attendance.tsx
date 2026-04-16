import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { CheckCircle2, XCircle, Clock3, ChevronRight, ClipboardList, CalendarDays } from 'lucide-react';
import { today } from '../../lib/date';

type AttStatus = 'attended' | 'absent' | 'late' | null;

const ATT_OPTIONS = [
  {
    key: 'attended' as const,
    label: 'حضر',
    icon: CheckCircle2,
    active: { bg: '#0f172a', color: '#ffffff', border: '#0f172a' },
    idle:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
  },
  {
    key: 'absent' as const,
    label: 'غاب',
    icon: XCircle,
    active: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    idle:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
  },
  {
    key: 'late' as const,
    label: 'متأخر',
    icon: Clock3,
    active: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    idle:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
  },
] as const;

export default function TrainerAttendance() {
  const { user } = useAuth();

  const sessions        = useDataStore(s => s.sessions);
  const bookings        = useDataStore(s => s.bookings);
  const markAttendance  = useDataStore(s => s.markAttendance);

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const completedSessions = sessions.filter(
    s => s.trainerId === user?.id && (s.status === 'completed' || s.date === today())
  );

  const currentSession = completedSessions.find(s => s.id === selectedSession);
  const sessionBookings = selectedSession
    ? bookings.filter(b => b.sessionId === selectedSession)
    : [];

  /** الحالة الحالية للحجز إن كانت من حالات الحضور، وإلا null. */
  function getStatus(bookingId: string): AttStatus {
    const b = bookings.find(x => x.id === bookingId);
    if (b?.status === 'attended' || b?.status === 'absent' || b?.status === 'late') return b.status;
    return null;
  }

  /** تغيير الحالة يُحفَظ فوراً في الـ store (لا حفظ مؤجَّل). */
  async function setStatus(bookingId: string, status: AttStatus) {
    if (!status) return;
    const res = await markAttendance(bookingId, status);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  const attendedCount = sessionBookings.filter(b => getStatus(b.id) === 'attended').length;
  const markedCount   = sessionBookings.filter(b => getStatus(b.id) !== null).length;

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #eef0f3' }}>
        {selectedSession ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedSession(null); setSaved(false); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-slate-100"
              style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: '#64748b' }} />
            </button>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                تسجيل الحضور
              </h1>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>
                {currentSession?.name}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
              تسجيل الحضور
            </h1>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              اختاري جلسة لتسجيل حضور المتدربات
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-5 max-w-2xl mx-auto">

        {/* ── Sessions picker ── */}
        {!selectedSession && (
          <div className="space-y-3">
            {completedSessions.length === 0 && (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
              >
                <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>لا توجد جلسات لتسجيل الحضور</p>
              </div>
            )}

            {completedSessions.map(s => {
              const count = bookings.filter(b => b.sessionId === s.id).length;
              const isToday = s.date === today();
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-right transition-all hover:shadow-sm"
                  style={{ background: '#ffffff', border: '1px solid #eef0f3', cursor: 'pointer' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isToday ? '#0f172a' : '#f1f5f9' }}
                  >
                    <CalendarDays className="w-5 h-5" style={{ color: isToday ? '#ffffff' : '#64748b' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '3px' }}>
                      {s.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {new Date(s.date).toLocaleDateString('ar-SA', { weekday: 'long', month: 'short', day: 'numeric' })}
                      {' · '}{s.startTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#64748b',
                      }}
                    >
                      {count} متدربة
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: '#cbd5e1', transform: 'rotate(180deg)' }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Attendance form ── */}
        {selectedSession && (
          <div>
            {/* Session summary */}
            {currentSession && (
              <div
                className="rounded-2xl p-4 mb-5"
                style={{ background: '#0f172a' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: '3px' }}>
                      الجلسة
                    </p>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                      {currentSession.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                      {new Date(currentSession.date).toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}
                      {' · '}{currentSession.startTime}
                    </p>
                  </div>
                  {sessionBookings.length > 0 && (
                    <div className="text-center">
                      <p style={{ fontWeight: 800, fontSize: '1.6rem', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em' }}>
                        {markedCount}
                      </p>
                      <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        / {sessionBookings.length} مسجّل
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress */}
                {sessionBookings.length > 0 && (
                  <div className="mt-4">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(markedCount / sessionBookings.length) * 100}%`,
                          background: 'rgba(255,255,255,0.6)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No bookings */}
            {sessionBookings.length === 0 && (
              <div
                className="rounded-2xl p-8 text-center mb-4"
                style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
              >
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  لا يوجد متدربون مسجلون في هذه الجلسة
                </p>
              </div>
            )}

            {/* Trainee rows */}
            {sessionBookings.length > 0 && (
              <div className="space-y-3 mb-5">
                {sessionBookings.map(booking => {
                  const status  = getStatus(booking.id);

                  return (
                    <div
                      key={booking.id}
                      className="rounded-2xl p-4"
                      style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
                    >
                      {/* Trainee info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: '#f1f5f9' }}
                        >
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>
                            {booking.traineeName.slice(0, 1)}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                            {booking.traineeName}
                          </p>
                          <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                            {booking.branch}
                          </p>
                        </div>
                        {status && (
                          <div className="mr-auto">
                            {status === 'attended' && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a' }}>✓ حضر</span>
                            )}
                            {status === 'absent' && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#dc2626' }}>✗ غاب</span>
                            )}
                            {status === 'late' && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#d97706' }}>⏱ متأخر</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        {ATT_OPTIONS.map(opt => {
                          const isActive = status === opt.key;
                          const style    = isActive ? opt.active : opt.idle;
                          const Icon     = opt.icon;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => setStatus(booking.id, opt.key)}
                              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: isActive ? 700 : 400,
                                background: style.bg,
                                color: style.color,
                                border: `1px solid ${style.border}`,
                                cursor: 'pointer',
                              }}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status bar — الحفظ يتم لحظياً عند ضغط كل زر */}
            {sessionBookings.length > 0 && (
              <div
                className="w-full py-3.5 rounded-2xl text-center transition-colors"
                style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  background: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #eef0f3',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
                  تم تسجيل {markedCount} من {sessionBookings.length} · حضر {attendedCount}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Save feedback toast ── */}
      {saved && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
          style={{ background: '#0f172a', color: '#ffffff' }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <p style={{ fontSize: '0.83rem', fontWeight: 500 }}>تم الحفظ</p>
        </div>
      )}
    </div>
  );
}
