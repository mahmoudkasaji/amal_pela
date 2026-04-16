import { Package as PackageIcon } from 'lucide-react';
import type { Trainee } from '../../../data/types';
import { LEVEL_MAP } from '../../../data/constants';
import { Modal } from './Modal';
import { SubscriptionManagePanel } from './AdjustBalanceModal';

interface Props {
  trainee: Trainee;
  onClose: () => void;
  onToggleStatus: () => void | Promise<void>;
  onAssignPackageClick: () => void;
  onFlash: (msg: string) => void;
}

export function TraineeDetailModal({ trainee, onClose, onToggleStatus, onAssignPackageClick, onFlash }: Props) {
  return (
    <Modal onClose={onClose}>
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#0f172a' }}>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#ffffff' }}>{trainee.name.slice(0, 1)}</span>
        </div>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{trainee.name}</h3>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{trainee.branch} · {LEVEL_MAP[trainee.level]}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'الهاتف',         value: trainee.phone },
          { label: 'البريد',         value: trainee.email },
          { label: 'الجنس',          value: trainee.gender === 'female' ? 'أنثى' : 'ذكر' },
          { label: 'تاريخ الانضمام', value: new Date(trainee.joinDate).toLocaleDateString('ar-SA') },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
            <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: '2px' }}>{item.label}</p>
            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {trainee.subscription && (
        <div className="p-4 rounded-2xl mb-4" style={{ background: '#f8fafc', border: '1px solid #eef0f3' }}>
          <p style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f172a', marginBottom: '10px' }}>تفاصيل الاشتراك</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'الباقة',        value: trainee.subscription.packageName },
              { label: 'الحالة',        value: trainee.subscription.status === 'active' ? 'فعالة' : trainee.subscription.status === 'frozen' ? 'مجمدة' : 'منتهية' },
              { label: 'إجمالي',        value: trainee.subscription.totalSessions === 999 ? '∞' : String(trainee.subscription.totalSessions) },
              { label: 'مستخدمة',      value: String(trainee.subscription.usedSessions) },
              { label: 'متبقية',        value: trainee.subscription.totalSessions === 999 ? '∞' : String(trainee.subscription.totalSessions - trainee.subscription.usedSessions) },
              { label: 'ينتهي',         value: new Date(trainee.subscription.endDate).toLocaleDateString('ar-SA') },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: '2px' }}>{item.label}</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {trainee.notes && (
        <div className="p-3 rounded-xl mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p style={{ fontSize: '0.78rem', color: '#92400e' }}><strong>ملاحظة: </strong>{trainee.notes}</p>
        </div>
      )}

      {/* ────── إجراءات على الاشتراك ────── */}
      {trainee.subscription && <SubscriptionManagePanel trainee={trainee} onFlash={onFlash} />}

      <div className="flex gap-2">
        <button
          onClick={onToggleStatus}
          className="flex-1 py-2.5 rounded-xl transition-all"
          style={{ fontSize: '0.85rem', fontWeight: 500, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
        >
          {trainee.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
        </button>
        <button
          onClick={onAssignPackageClick}
          className="flex-1 py-2.5 rounded-xl transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
          style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          <PackageIcon className="w-4 h-4" />
          {trainee.subscription ? 'تجديد / تبديل الباقة' : 'إسناد باقة'}
        </button>
      </div>
    </Modal>
  );
}
