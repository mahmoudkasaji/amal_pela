import { useEffect, useState } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import type { Package } from '../../../data/types';
import { fetchBranchesList, type Branch } from '../../../api';
import { inputStyle } from '../../../components/ui/utils';
import { today } from '../../../lib/date';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onFlash: (msg: string) => void;
  packages: Package[];
}

interface AddDraft {
  name: string;
  phone: string;
  username: string;
  password: string;
  email: string;
  gender: 'male' | 'female';
  branch_id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  package_id: string;
}

const INITIAL_DRAFT: AddDraft = {
  name: '', phone: '', username: '', password: 'pass1234', email: '',
  gender: 'female', branch_id: '', level: 'beginner', package_id: '',
};

export function AddTraineeModal({ open, onClose, onFlash, packages }: Props) {
  const createTrainee    = useDataStore(s => s.createTrainee);
  const assignPackageRpc = useDataStore(s => s.assignPackage);

  const [addDraft, setAddDraft]   = useState<AddDraft>(INITIAL_DRAFT);
  const [branches, setBranches]   = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && branches.length === 0) {
      fetchBranchesList().then(setBranches);
    }
  }, [open, branches.length]);

  if (!open) return null;

  return (
    <Modal onClose={onClose} title="إضافة متدربة جديدة">
      <div className="space-y-3 mb-5">
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الاسم الكامل *</label>
          <input type="text" value={addDraft.name} onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))} placeholder="اسم المتدربة" style={inputStyle()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>رقم الهاتف</label>
          <input type="tel" value={addDraft.phone} onChange={e => setAddDraft(d => ({ ...d, phone: e.target.value }))} placeholder="05xxxxxxxx" style={inputStyle()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>اسم المستخدم *</label>
          <input type="text" value={addDraft.username} onChange={e => setAddDraft(d => ({ ...d, username: e.target.value }))} placeholder="3 أحرف على الأقل" style={inputStyle()} />
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px' }}>يُستخدم لتسجيل الدخول</p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>كلمة المرور *</label>
          <input type="text" value={addDraft.password} onChange={e => setAddDraft(d => ({ ...d, password: e.target.value }))} placeholder="6 أحرف على الأقل" style={inputStyle()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>البريد الإلكتروني (اختياري)</label>
          <input type="email" value={addDraft.email} onChange={e => setAddDraft(d => ({ ...d, email: e.target.value }))} placeholder="email@example.com" style={inputStyle()} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>الجنس</label>
            <select value={addDraft.gender} onChange={e => setAddDraft(d => ({ ...d, gender: e.target.value as 'male'|'female' }))} style={inputStyle()}>
              <option value="female">أنثى</option>
              <option value="male">ذكر</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>الفرع</label>
            <select value={addDraft.branch_id} onChange={e => setAddDraft(d => ({ ...d, branch_id: e.target.value }))} style={inputStyle()}>
              <option value="">اختر...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>المستوى</label>
            <select value={addDraft.level} onChange={e => setAddDraft(d => ({ ...d, level: e.target.value as AddDraft['level'] }))} style={inputStyle()}>
              <option value="beginner">مبتدئة</option>
              <option value="intermediate">متوسطة</option>
              <option value="advanced">متقدمة</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الباقة (اختياري — يمكن إسنادها لاحقاً)</label>
          <select value={addDraft.package_id} onChange={e => setAddDraft(d => ({ ...d, package_id: e.target.value }))} style={inputStyle()}>
            <option value="">— بدون باقة —</option>
            {packages.filter(p => p.isActive !== false).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>
          إلغاء
        </button>
        <button
          disabled={isSubmitting}
          onClick={async () => {
            if (!addDraft.name.trim() || !addDraft.username.trim() || !addDraft.password) {
              onFlash('الاسم واليوزر نيم والباسورد مطلوبة');
              return;
            }
            if (addDraft.username.trim().length < 3) {
              onFlash('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
              return;
            }
            if (addDraft.password.length < 6) {
              onFlash('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
              return;
            }
            setIsSubmitting(true);
            try {
              const res = await createTrainee({
                name: addDraft.name.trim(),
                username: addDraft.username.trim(),
                password: addDraft.password,
                phone: addDraft.phone.trim() || undefined,
                email: addDraft.email.trim() || undefined,
                gender: addDraft.gender,
                branch_id: addDraft.branch_id || undefined,
                level: addDraft.level,
              });
              if (!res.ok) {
                onFlash(res.reason ?? 'تعذّر إنشاء الحساب');
                return;
              }
              if (addDraft.package_id) {
                const newT = useDataStore.getState().trainees.find(t => t.username === addDraft.username.trim());
                if (newT) {
                  await assignPackageRpc(newT.id, addDraft.package_id, today());
                }
              }
              onClose();
              setAddDraft(INITIAL_DRAFT);
              onFlash('تم إنشاء الحساب بنجاح');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="flex-1 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </Modal>
  );
}
