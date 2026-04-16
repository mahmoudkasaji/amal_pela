import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { CalendarDays, Clock, MapPin, CheckCircle2, XCircle, Clock3, AlertTriangle, X } from 'lucide-react';
import { today, formatShortArabic, formatLongArabic } from '../../lib/date';

type TabType = 'upcoming' | 'past' | 'cancelled';

const formatDate = formatLongArabic;
const formatDateShort = formatShortArabic;

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.FC<{ className?: string }>;
  bg: string;
  color: string;
  border: string;
}> = {
  confirmed:             { label: 'مؤكدة',         icon: Clock3,         bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  attended:              { label: 'حضرت',           icon: CheckCircle2,   bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  absent:                { label: 'غياب',           icon: XCircle,        bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
  cancelled_with_refund: { label: 'ملغاة — مُسترد', icon: CheckCircle2,   bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  cancelled_no_refund:   { label: 'إلغاء متأخر',    icon: AlertTriangle,  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  waitlist:              { label: 'انتظار',          icon: Clock3,         bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
};

export default function TraineeBookings() {
  const { user } = useAuth();

  const initialized   = useDataStore(s => s.initialized);
  const bookings      = useDataStore(s => s.bookings);
  const allSessions   = useDataStore(s => s.sessions);
  const cancelBooking = useDataStore(s => s.cancelBooking);

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const myBookings = bookings.filter(b => b.traineeId === user?.id);
  const upcoming  = myBookings.filter(b => b.status === 'confirmed' && b.date >= today());
  const past      = myBookings.filter(b => b.status === 'attended' || b.status === 'absent' || b.date < today());
  const cancelled = myBookings.filter(b => b.status === 'cancelled_with_refund' || b.status === 'cancelled_no_refund');

  const currentList = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled;

  async function handleCancel(bookingId: string) {
    const res = await cancelBooking(bookingId);
    setCancelTarget(null);
    if (res.ok) {
      setCancelFeedback(
        res.refunded
          ? 'تم إلغاء الحجز وإعادة الجلسة إلى رصيدك'
          : 'تم الإلغاء — خارج نافذة الاسترداد، لم يُعَد الرصيد'
      );
      setTimeout(() => setCancelFeedback(null), 3200);
    } else {
      setCancelFeedback(res.reason ?? 'تعذّر إلغاء الحجز');
      setTimeout(() => setCancelFeedback(null), 3200);
    }
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'upcoming',  label: 'القادمة',  count: upcoming.length },
    { key: 'past',      label: 'السابقة',  count: past.length },
    { key: 'cancelled', label: 'الملغاة',  count: cancelled.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
          حجوزاتي
        </h1>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
          سجل جلساتك وحجوزاتك
        </p>

        {/* Tabs */}
        <div
          className="flex gap-1 mt-4 p-1 rounded-xl"
          style={{ background: '#f1f5f9' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-200"
              style={{
                background: activeTab === tab.key ? '#ffffff' : 'transparent',
                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
                border: 'none',
                color: activeTab === tab.key ? '#0f172a' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full"
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    background: activeTab === tab.key ? '#0f172a' : '#e2e8f0',
                    color: activeTab === tab.key ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-5 py-4 space-y-3 max-w-2xl mx-auto">
        {currentList.length === 0 && (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              لا توجد {tabs.find(t => t.key === activeTab)?.label} حتى الآن
            </p>
          </div>
        )}

        {currentList.map(booking => {
          const session = allSessions.find(s => s.id === booking.sessionId);
          const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
          const StatusIcon = cfg.icon;

          return (
            <div
              key={booking.id}
              className="rounded-2xl p-4"
              style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontWeight: 600, fontSize: '0.93rem', color: '#0f172a', marginBottom: '3px' }}>
                    {booking.sessionName}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>مع {booking.trainerName}</p>
                </div>
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0 mr-3"
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 mb-3" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDateShort(booking.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {booking.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {booking.branch}
                </span>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid #f1f5f9' }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: booking.sessionDeducted ? '#cbd5e1' : '#16a34a',
                    fontWeight: booking.sessionDeducted ? 400 : 600,
                  }}
                >
                  {booking.sessionDeducted ? '− جلسة مخصومة' : '↩ لم تُخصم جلسة'}
                </span>

                {booking.status === 'confirmed' && activeTab === 'upcoming' && (
                  <button
                    onClick={() => setCancelTarget(booking.id)}
                    className="px-3 py-1.5 rounded-lg transition-all hover:opacity-70"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      background: 'transparent',
                      color: '#94a3b8',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    إلغاء الحجز
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Cancel confirm modal ── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setCancelTarget(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl p-6"
            style={{ background: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: '#fffbeb' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: '#d97706' }} />
              </div>
              <button
                onClick={() => setCancelTarget(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#f1f5f9', border: 'none' }}
              >
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>

            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '6px' }}>
              تأكيد الإلغاء
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.7, marginBottom: '20px' }}>
              الإلغاء قبل 3 ساعات يُعيد الجلسة لرصيدك.
              الإلغاء المتأخر لن يُسترد منه رصيد.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 rounded-xl transition-all"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                }}
              >
                رجوع
              </button>
              <button
                onClick={() => handleCancel(cancelTarget)}
                className="flex-1 py-2.5 rounded-xl transition-all"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel feedback toast ── */}
      {cancelFeedback && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
          style={{ background: '#0f172a', color: '#ffffff', maxWidth: '90vw' }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <p style={{ fontSize: '0.83rem', fontWeight: 500 }}>{cancelFeedback}</p>
        </div>
      )}
    </div>
  );
}
