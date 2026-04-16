import { useState } from 'react';
import { Pause, Play, CalendarPlus, Minus } from 'lucide-react';
import type { Trainee } from '../../../data/types';
import { useDataStore } from '../../../store/useDataStore';
import { inputStyle } from '../../../components/ui/utils';

interface Props {
  trainee: Trainee;
  onFlash: (msg: string) => void;
}

/**
 * Inline subscription-management panel rendered inside the Trainee detail modal.
 * Handles: freeze/unfreeze, extend by days, and adjust balance (+/-) with reason.
 */
export function SubscriptionManagePanel({ trainee, onFlash }: Props) {
  const freezeSubscription   = useDataStore(s => s.freezeSubscription);
  const unfreezeSubscription = useDataStore(s => s.unfreezeSubscription);
  const extendSubscription   = useDataStore(s => s.extendSubscription);
  const adjustBalance        = useDataStore(s => s.adjustBalance);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extendDays, setExtendDays]     = useState<string>('');
  const [balanceDelta, setBalanceDelta] = useState<string>('');
  const [balanceReason, setBalanceReason] = useState<string>('');

  if (!trainee.subscription) return null;

  return (
    <div className="p-3 rounded-xl mb-3 space-y-3" style={{ background: '#f8fafc', border: '1px solid #eef0f3' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
        إدارة الاشتراك
      </p>

      {/* تجميد / تفعيل */}
      <button
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          try {
            if (trainee.subscription?.status === 'frozen') {
              const r = await unfreezeSubscription(trainee.id);
              onFlash(r.ok ? 'تم تفعيل الاشتراك' : r.reason ?? 'تعذّر التفعيل');
            } else {
              const r = await freezeSubscription(trainee.id);
              onFlash(r.ok ? 'تم تجميد الاشتراك' : r.reason ?? 'تعذّر التجميد');
            }
          } catch (err) {
            onFlash('خطأ: ' + (err instanceof Error ? err.message : 'غير معروف'));
          } finally {
            setIsSubmitting(false);
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all hover:opacity-90"
        style={{
          fontSize: '0.78rem', fontWeight: 600,
          background: trainee.subscription.status === 'frozen' ? '#dcfce7' : '#fef3c7',
          color: trainee.subscription.status === 'frozen' ? '#166534' : '#92400e',
          border: 'none', cursor: 'pointer',
        }}
      >
        {trainee.subscription.status === 'frozen' ? (
          <><Play className="w-3.5 h-3.5" /> تفعيل الاشتراك</>
        ) : (
          <><Pause className="w-3.5 h-3.5" /> تجميد الاشتراك</>
        )}
      </button>

      {/* تمديد بالأيام */}
      <div className="flex gap-2">
        <input
          type="number"
          value={extendDays}
          onChange={e => setExtendDays(e.target.value)}
          placeholder="أيام إضافية"
          style={{ ...inputStyle(), padding: '7px 10px', fontSize: '0.78rem' }}
        />
        <button
          disabled={isSubmitting}
          onClick={async () => {
            const n = parseInt(extendDays, 10);
            if (!n || n <= 0) return;
            setIsSubmitting(true);
            try {
              const r = await extendSubscription(trainee.id, n);
              setExtendDays('');
              onFlash(r.ok ? `تم تمديد الاشتراك ${n} يوم` : r.reason ?? 'تعذّر التمديد');
            } catch (err) {
              onFlash('خطأ: ' + (err instanceof Error ? err.message : 'غير معروف'));
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="flex items-center gap-1 px-3 rounded-lg transition-all hover:opacity-90 flex-shrink-0"
          style={{ fontSize: '0.72rem', fontWeight: 600, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          تمديد
        </button>
      </div>

      {/* ± رصيد يدوي */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            value={balanceDelta}
            onChange={e => setBalanceDelta(e.target.value)}
            placeholder="عدد الجلسات (+/−)"
            style={{ ...inputStyle(), padding: '7px 10px', fontSize: '0.78rem' }}
          />
          <button
            disabled={isSubmitting}
            onClick={async () => {
              const n = parseInt(balanceDelta, 10);
              if (!n) return;
              setIsSubmitting(true);
              try {
                const r = await adjustBalance(trainee.id, n, balanceReason || (n > 0 ? 'إضافة يدوية' : 'خصم يدوي'));
                setBalanceDelta('');
                setBalanceReason('');
                onFlash(r.ok ? (n > 0 ? `تم إضافة ${n} جلسة` : `تم خصم ${Math.abs(n)} جلسة`) : r.reason ?? 'تعذّر التعديل');
              } catch (err) {
                onFlash('خطأ: ' + (err instanceof Error ? err.message : 'غير معروف'));
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="flex items-center gap-1 px-3 rounded-lg transition-all hover:opacity-90 flex-shrink-0"
            style={{ fontSize: '0.72rem', fontWeight: 600, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            <Minus className="w-3.5 h-3.5" />
            تعديل
          </button>
        </div>
        <input
          type="text"
          value={balanceReason}
          onChange={e => setBalanceReason(e.target.value)}
          placeholder="السبب (اختياري)"
          style={{ ...inputStyle(), padding: '7px 10px', fontSize: '0.75rem' }}
        />
      </div>
    </div>
  );
}
