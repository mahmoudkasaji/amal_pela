import { useAuth } from '../../context/AuthContext';
import { useDataStore } from '../../store/useDataStore';
import { CreditCard, CalendarDays, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';
import { today, daysBetween } from '../../lib/date';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

export default function TraineeSubscription() {
  const { user } = useAuth();
  const trainees = useDataStore(s => s.trainees);
  const ledger   = useDataStore(s => s.ledger);

  const trainee = trainees.find(t => t.id === user?.id);
  const sub = trainee?.subscription;
  const myLedger = ledger.filter(l => l.traineeId === user?.id).slice().reverse();

  const remaining = sub ? (sub.totalSessions === 999 ? 999 : sub.totalSessions - sub.usedSessions) : 0;
  const progressPct = sub && sub.totalSessions !== 999
    ? Math.min((sub.usedSessions / sub.totalSessions) * 100, 100)
    : 0;
  const daysLeft = sub ? Math.max(0, daysBetween(today(), sub.endDate)) : 0;

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #eef0f3' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
          اشتراكي
        </h1>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
          تفاصيل باقتك وسجل حركة الرصيد
        </p>
      </div>

      <div className="px-5 py-5 space-y-4 max-w-2xl mx-auto">

        {!sub ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
          >
            <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>لا يوجد اشتراك فعال</p>
            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px' }}>
              تواصلي مع الإدارة لتفعيل باقة
            </p>
          </div>
        ) : (
          <>
            {/* ── Main package card ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0f172a' }}
            >
              <div className="p-5">
                {/* Top */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      الباقة الحالية
                    </p>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', marginTop: '3px' }}>
                      {sub.packageName}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      background: sub.status === 'active' ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.2)',
                      color: sub.status === 'active' ? 'rgba(255,255,255,0.65)' : '#fca5a5',
                      border: '1px solid rgba(255,255,255,0.1)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {sub.status === 'active' ? 'فعّالة' : sub.status === 'frozen' ? 'مجمدة' : 'منتهية'}
                  </span>
                </div>

                {/* Sessions count */}
                {sub.totalSessions === 999 ? (
                  <div className="mb-5">
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>حضور</p>
                    <p style={{ fontWeight: 800, fontSize: '3rem', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em', marginTop: '4px' }}>
                      مفتوح
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      الجلسات المتبقية
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span style={{ fontWeight: 800, fontSize: '3rem', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em' }}>
                        {remaining}
                      </span>
                      <span style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.35)' }}>
                        / {sub.totalSessions}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.6)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginBottom: '3px' }}>
                      تاريخ البداية
                    </p>
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                      {formatDate(sub.startDate)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginBottom: '3px' }}>
                      تاريخ الانتهاء
                    </p>
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                      {formatDate(sub.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'إجمالي الجلسات',   value: sub.totalSessions === 999 ? '∞' : String(sub.totalSessions), accent: '#0f172a' },
                { label: 'مستخدمة',           value: String(sub.usedSessions),                                     accent: '#64748b' },
                { label: 'متبقية',             value: sub.totalSessions === 999 ? '∞' : String(remaining),          accent: '#16a34a' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
                >
                  <p style={{ fontWeight: 800, fontSize: '1.6rem', color: stat.accent, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* ── Days remaining ── */}
            <div
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{
                background: daysLeft <= 7 ? '#fffbeb' : '#ffffff',
                border: `1px solid ${daysLeft <= 7 ? '#fde68a' : '#eef0f3'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: daysLeft <= 7 ? '#fef3c7' : '#f1f5f9' }}
              >
                <CalendarDays className="w-5 h-5" style={{ color: daysLeft <= 7 ? '#d97706' : '#64748b' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                  {daysLeft > 0 ? `${daysLeft} يوم متبقي` : 'انتهت صلاحية الباقة'}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  ينتهي {formatDate(sub.endDate)}
                </p>
              </div>
            </div>

            {/* ── Cancellation policy ── */}
            <div
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: '#f8fafc', border: '1px solid #eef0f3' }}
            >
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#94a3b8' }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.83rem', color: '#475569', marginBottom: '4px' }}>
                  سياسة الإلغاء
                </p>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.65 }}>
                  يمكن الإلغاء مجاناً قبل {sub.cancellationHours} ساعات من الجلسة.
                  الإلغاء المتأخر لن يُسترد منه الرصيد.
                </p>
              </div>
            </div>

            {/* ── Ledger ── */}
            {myLedger.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
              >
                <div className="px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                    سجل حركة الرصيد
                  </h3>
                </div>

                <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                  {myLedger.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: entry.type === 'credit' ? '#f0fdf4' : '#fef2f2',
                          }}
                        >
                          {entry.type === 'credit'
                            ? <ArrowUpCircle className="w-4 h-4" style={{ color: '#16a34a' }} />
                            : <ArrowDownCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                          }
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                            {entry.reason}
                          </p>
                          <p style={{ fontSize: '0.67rem', color: '#cbd5e1', marginTop: '1px' }}>
                            {formatDateShort(entry.date)}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: entry.type === 'credit' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {entry.type === 'credit' ? '+' : '−'}{entry.amount}
                        </p>
                        <p style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: '1px' }}>
                          رصيد: {entry.balance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
