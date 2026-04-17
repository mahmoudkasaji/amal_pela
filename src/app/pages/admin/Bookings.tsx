import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { STATUS_CONFIG } from '../../data/constants';

const STATUS_KEYS: Record<string, string> = {
  'مؤكد':       'confirmed',
  'حضر':         'attended',
  'غياب':        'absent',
  'ملغى مسترد': 'cancelled_with_refund',
  'إلغاء متأخر': 'cancelled_no_refund',
};

const FILTER_TABS = ['الكل', 'مؤكد', 'حضر', 'غياب', 'ملغى مسترد', 'إلغاء متأخر'];

export default function AdminBookings() {
  // Phase E: Bookings تعتمد على bookings — تحمّل في الـ background
  const initialized    = useDataStore(s => s.initialized);
  const fullyLoaded    = useDataStore(s => s.fullyLoaded);
  const bookings       = useDataStore(s => s.bookings);
  const cancelBooking  = useDataStore(s => s.cancelBooking);
  const markAttendance = useDataStore(s => s.markAttendance);

  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!initialized || !fullyLoaded) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const confirmCancelBooking = bookings.find(b => b.id === confirmCancelId);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleAdminCancel(bookingId: string) {
    // إلغاء من قِبَل الإدارة = استرداد دائم (بغض النظر عن الساعات)
    const res = await cancelBooking(bookingId, { forceRefund: true });
    setConfirmCancelId(null);
    if (res.ok) flash('تم إلغاء الحجز وإعادة الرصيد');
    else flash(res.reason ?? 'تعذّر الإلغاء');
  }

  const filtered = bookings.filter(b => {
    const matchSearch  = b.traineeName.includes(search) || b.sessionName.includes(search) || b.trainerName.includes(search);
    const matchStatus  = statusFilter === 'الكل' || b.status === STATUS_KEYS[statusFilter];
    return matchSearch && matchStatus;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const counts = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    attended:  bookings.filter(b => b.status === 'attended').length,
    cancelled: bookings.filter(b => b.status.includes('cancelled')).length,
  };

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* Top bar */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>الحجوزات</h1>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{bookings.length} حجز إجمالاً</p>

        {/* Search */}
        <div className="relative mt-4 mb-3">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4" style={{ right: '12px', color: '#cbd5e1' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الجلسة..."
            className="w-full py-2.5 rounded-xl outline-none"
            style={{ paddingRight: '38px', paddingLeft: '14px', fontSize: '0.83rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' }}
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className="px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex-shrink-0"
              style={{
                fontSize: '0.72rem', fontWeight: statusFilter === tab ? 700 : 400,
                background: statusFilter === tab ? '#0f172a' : '#f1f5f9',
                color:      statusFilter === tab ? '#ffffff'  : '#64748b',
                border: 'none', cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 max-w-5xl mx-auto space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'الإجمالي',   value: counts.total,     color: '#0f172a' },
            { label: 'مؤكدة',     value: counts.confirmed,  color: '#2563eb' },
            { label: 'تم الحضور', value: counts.attended,   color: '#16a34a' },
            { label: 'ملغاة',     value: counts.cancelled,  color: '#dc2626' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
              <p style={{ fontWeight: 800, fontSize: '1.5rem', color: s.color, lineHeight: 1, letterSpacing: '-0.04em' }}>{s.value}</p>
              <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '4px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['المتدربة', 'الجلسة', 'التاريخ', 'الوقت', 'المدربة', 'الفرع', 'الحالة', 'الرصيد', 'إجراءات'].map(h => (
                    <th key={h} className="text-right px-4 py-3 whitespace-nowrap" style={{ fontWeight: 600, fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.confirmed;
                  return (
                    <tr key={b.id} style={{ borderTop: i > 0 ? '1px solid #f8fafc' : 'none' }} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569' }}>{b.traineeName.slice(0, 1)}</span>
                          </div>
                          <span style={{ fontWeight: 500, fontSize: '0.83rem', color: '#334155', whiteSpace: 'nowrap' }}>{b.traineeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{b.sessionName}</td>
                      <td className="px-4 py-3" style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(b.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{b.time}</td>
                      <td className="px-4 py-3" style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{b.trainerName}</td>
                      <td className="px-4 py-3" style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{b.branch}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg whitespace-nowrap" style={{ fontSize: '0.65rem', fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: b.sessionDeducted ? '#dc2626' : '#16a34a' }}>
                          {b.sessionDeducted ? '−1' : '↩'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* تغيير حالة الحضور يدوياً — للحالات الاستثنائية */}
                          {b.status === 'confirmed' && (
                            <>
                              <button
                                disabled={processingId === b.id}
                                onClick={async () => { setProcessingId(b.id); const r = await markAttendance(b.id, 'attended'); setProcessingId(null); flash(r.ok ? 'تم تسجيل الحضور' : r.reason ?? 'تعذّر الحفظ'); }}
                                className="px-2 py-1 rounded-md transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ fontSize: '0.65rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                title="تسجيل حضور"
                              >
                                حضر
                              </button>
                              <button
                                disabled={processingId === b.id}
                                onClick={async () => { setProcessingId(b.id); const r = await markAttendance(b.id, 'absent'); setProcessingId(null); flash(r.ok ? 'تم تسجيل الغياب' : r.reason ?? 'تعذّر الحفظ'); }}
                                className="px-2 py-1 rounded-md transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ fontSize: '0.65rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                title="تسجيل غياب"
                              >
                                غاب
                              </button>
                              <button
                                disabled={processingId === b.id}
                                onClick={() => setConfirmCancelId(b.id)}
                                className="px-2 py-1 rounded-md transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ fontSize: '0.65rem', fontWeight: 600, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                title="إلغاء من الإدارة"
                              >
                                إلغاء
                              </button>
                            </>
                          )}
                          {b.status !== 'confirmed' && (
                            <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>لا توجد نتائج</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm cancel modal ── */}
      {confirmCancelBooking && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmCancelId(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{ background: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#fffbeb' }}>
                <AlertTriangle className="w-7 h-7" style={{ color: '#d97706' }} />
              </div>
            </div>
            <h3 className="text-center" style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>
              إلغاء حجز «{confirmCancelBooking.traineeName}»؟
            </h3>
            <p className="text-center mb-5" style={{ fontSize: '0.83rem', color: '#64748b' }}>
              سيُعاد الرصيد للمتدربة — إلغاء إداري يُتعامَل معه كاسترداد كامل.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ fontSize: '0.85rem', fontWeight: 500, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
              >
                تراجع
              </button>
              <button
                onClick={() => handleAdminCancel(confirmCancelBooking.id)}
                className="flex-1 py-2.5 rounded-xl hover:opacity-90"
                style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
          style={{ background: '#0f172a', color: '#ffffff' }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <p style={{ fontSize: '0.83rem', fontWeight: 500 }}>{toast}</p>
        </div>
      )}
    </div>
  );
}
