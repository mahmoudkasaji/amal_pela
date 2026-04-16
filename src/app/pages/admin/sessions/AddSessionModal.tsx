import { useState } from 'react';
import type { Trainer } from '../../../data/types';
import type { Branch, SessionType, NewSessionInput } from '../../../api/rpc';
import { today } from '../../../lib/date';
import { inputStyle } from '../../../components/ui/utils';
import { Modal } from './Modal';

type Level = 'all' | 'beginner' | 'intermediate' | 'advanced';

type AddDraft = {
  name: string;
  type: string;
  trainer_id: string;
  branch_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  level: Level;
};

const initialDraft = (currentType = 'يوغا'): AddDraft => ({
  name: '',
  type: currentType,
  trainer_id: '',
  branch_id: '',
  date: today(),
  start_time: '07:00',
  end_time: '08:00',
  capacity: 12,
  level: 'all',
});

export function AddSessionModal({
  onClose,
  onSubmit,
  trainers,
  branches,
  sessionTypes,
  flash,
}: {
  onClose: () => void;
  onSubmit: (input: NewSessionInput) => Promise<{ ok: boolean; reason?: string }>;
  trainers: Trainer[];
  branches: Branch[];
  sessionTypes: SessionType[];
  flash: (msg: string) => void;
}) {
  const [addDraft, setAddDraft] = useState<AddDraft>(initialDraft());
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Modal onClose={onClose} title="جلسة جديدة">
      <div className="space-y-3 mb-5">
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>اسم الجلسة *</label>
          <input type="text" value={addDraft.name} onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))} placeholder="يوغا الصباح" style={inputStyle()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>المدربة *</label>
          <select value={addDraft.trainer_id} onChange={e => setAddDraft(d => ({ ...d, trainer_id: e.target.value }))} style={inputStyle()}>
            <option value="">اختر...</option>
            {trainers.filter(t => t.status === 'active').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>نوع الجلسة *</label>
          <select value={addDraft.type} onChange={e => setAddDraft(d => ({ ...d, type: e.target.value }))} style={inputStyle()}>
            {sessionTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>التاريخ *</label>
          <input type="date" value={addDraft.date} onChange={e => setAddDraft(d => ({ ...d, date: e.target.value }))} style={inputStyle()} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>وقت البداية *</label>
            <input type="time" value={addDraft.start_time} onChange={e => setAddDraft(d => ({ ...d, start_time: e.target.value }))} style={inputStyle()} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>وقت النهاية *</label>
            <input type="time" value={addDraft.end_time} onChange={e => setAddDraft(d => ({ ...d, end_time: e.target.value }))} style={inputStyle()} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الفرع *</label>
          <select value={addDraft.branch_id} onChange={e => setAddDraft(d => ({ ...d, branch_id: e.target.value }))} style={inputStyle()}>
            <option value="">اختر...</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>السعة القصوى *</label>
            <input type="number" min="1" value={addDraft.capacity} onChange={e => setAddDraft(d => ({ ...d, capacity: parseInt(e.target.value, 10) || 1 }))} style={inputStyle()} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>المستوى</label>
            <select value={addDraft.level} onChange={e => setAddDraft(d => ({ ...d, level: e.target.value as Level }))} style={inputStyle()}>
              <option value="all">للجميع</option>
              <option value="beginner">مبتدئات</option>
              <option value="intermediate">متوسطات</option>
              <option value="advanced">متقدمات</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>إلغاء</button>
        <button
          disabled={isSubmitting}
          onClick={async () => {
            if (!addDraft.name || !addDraft.trainer_id || !addDraft.branch_id || !addDraft.date) {
              flash('أكمل الحقول المطلوبة');
              return;
            }
            if (addDraft.date < today()) {
              flash('لا يمكن إنشاء جلسة بتاريخ ماضٍ');
              return;
            }
            if (addDraft.start_time >= addDraft.end_time) {
              flash('وقت النهاية يجب أن يكون بعد البداية');
              return;
            }
            setIsSubmitting(true);
            try {
              const r = await onSubmit(addDraft);
              if (!r.ok) { flash(r.reason ?? 'تعذّر إنشاء الجلسة'); return; }
              setAddDraft(initialDraft(addDraft.type));
              flash('تم إنشاء الجلسة بنجاح');
              onClose();
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="flex-1 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء'}
        </button>
      </div>
    </Modal>
  );
}
