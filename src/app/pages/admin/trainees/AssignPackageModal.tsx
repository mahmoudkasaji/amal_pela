import { useState, useEffect } from 'react';
import type { Trainee, Package } from '../../../data/types';
import { useDataStore } from '../../../store/useDataStore';
import { inputStyle } from '../../../components/ui/utils';
import { today } from '../../../lib/date';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  trainee: Trainee;
  packages: Package[];
  onFlash: (msg: string) => void;
}

export function AssignPackageModal({ open, onClose, trainee, packages, onFlash }: Props) {
  const assignPackage = useDataStore(s => s.assignPackage);
  const [pkgToAssign, setPkgToAssign] = useState<string>('');
  const [startDate, setStartDate]     = useState<string>(today());

  useEffect(() => {
    if (open) {
      setPkgToAssign('');
      setStartDate(today());
    }
  }, [open]);

  if (!open) return null;

  return (
    <Modal onClose={onClose} title="إسناد باقة">
      <div className="space-y-3 mb-5">
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الباقة</label>
          <select value={pkgToAssign} onChange={e => setPkgToAssign(e.target.value)} style={inputStyle()}>
            <option value="">اختر باقة...</option>
            {packages.filter(p => p.isActive !== false).map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.sessions === 999 ? '∞' : `${p.sessions} جلسة`} · {p.durationDays} يوم
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>تاريخ البدء</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle()} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>
          إلغاء
        </button>
        <button
          onClick={async () => {
            if (!pkgToAssign || !startDate) return;
            const res = await assignPackage(trainee.id, pkgToAssign, startDate);
            if (res.ok) {
              onClose();
              onFlash('تم إسناد الباقة');
            } else {
              onFlash(res.reason ?? 'تعذّر إسناد الباقة');
            }
          }}
          disabled={!pkgToAssign || !startDate}
          className="flex-1 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          تأكيد الإسناد
        </button>
      </div>
    </Modal>
  );
}
