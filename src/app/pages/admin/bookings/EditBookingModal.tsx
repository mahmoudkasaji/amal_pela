/**
 * EditBookingModal — Admin فقط.
 * يسمح بتغيير حالة حجز إلى: مؤكد / حضر / غاب / متأخرة.
 * لا يعدّل الحجوزات الملغاة نهائياً (تحتاج حجز جديد).
 */
import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type { Booking } from '../../../data/types';
import { useDataStore } from '../../../store/useDataStore';
import { STATUS_CONFIG } from '../../../data/constants';

type EditableStatus = 'confirmed' | 'attended' | 'absent' | 'late';

const STATUS_OPTIONS: { value: EditableStatus; label: string }[] = [
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'attended',  label: 'حضر'  },
  { value: 'late',      label: 'متأخرة' },
  { value: 'absent',    label: 'غياب' },
];

interface Props {
  booking: Booking | null;
  onClose: () => void;
  onFlash: (msg: string) => void;
}

export function EditBookingModal({ booking, onClose, onFlash }: Props) {
  const setBookingStatus = useDataStore((s) => s.setBookingStatus);
  const [status, setStatus] = useState<EditableStatus>(
    (booking?.status as EditableStatus) ?? 'confirmed',
  );
  const [saving, setSaving] = useState(false);

  if (!booking) return null;

  const isCancelled = booking.status === 'cancelled_with_refund' || booking.status === 'cancelled_no_refund';

  async function handleSave() {
    if (!booking) return;
    if (status === booking.status) {
      onClose();
      return;
    }
    setSaving(true);
    const res = await setBookingStatus(booking.id, status);
    setSaving(false);
    if (res.ok) {
      onFlash('تم تحديث حالة الحجز');
      onClose();
    } else {
      onFlash(res.reason ?? 'تعذّر التعديل');
    }
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', fontFamily: "'Cairo', sans-serif" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#eef0f3' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>تعديل حالة الحجز</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* ملخص الحجز */}
          <div className="rounded-xl p-3" style={{ background: '#f8fafc' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>الحجز:</p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
              {booking.traineeName} — {booking.sessionName}
            </p>
            <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
              {booking.date} · {booking.time} · {booking.trainerName}
            </p>
          </div>

          {isCancelled ? (
            <div
              className="rounded-xl p-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', fontSize: '0.8rem', color: '#991b1b' }}
            >
              ⚠ الحجز ملغى نهائياً — لا يمكن تعديل حالته. لاستئناف الحضور، أنشئي حجزاً جديداً.
            </div>
          ) : (
            <>
              {/* الحالة الحالية */}
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  الحالة الحالية:
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: STATUS_CONFIG[booking.status]?.bg ?? '#f1f5f9',
                    color: STATUS_CONFIG[booking.status]?.color ?? '#64748b',
                  }}
                >
                  {STATUS_CONFIG[booking.status]?.label ?? booking.status}
                </span>
              </div>

              {/* الحالة الجديدة */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  الحالة الجديدة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const selected = status === opt.value;
                    const cfg = STATUS_CONFIG[opt.value];
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className="rounded-lg py-2.5 transition-all"
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          background: selected ? cfg?.bg : 'white',
                          color:      selected ? cfg?.color : '#64748b',
                          border:     `2px solid ${selected ? cfg?.color : '#e2e8f0'}`,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {!isCancelled && (
          <div className="px-5 py-4 flex gap-2 justify-end border-t" style={{ borderColor: '#eef0f3' }}>
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              style={{ fontSize: '0.85rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white disabled:opacity-60"
              style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? 'جارٍ الحفظ...' : (<><CheckCircle2 className="w-4 h-4" /> حفظ التعديل</>)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
