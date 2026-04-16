import { useState } from 'react';
import type { Trainer } from '../../../data/types';
import type { Branch, SessionType } from '../../../api';
import { inputStyle } from '../../../components/ui/utils';
import { Modal } from './Modal';

type Level = 'all' | 'beginner' | 'intermediate' | 'advanced';

export type EditDraft = {
  name: string;
  type: string;
  trainer_id: string;
  branch_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  level: Level;
  notes: string;
};

export type UpdateFields = {
  name: string;
  type: string;
  trainer_id: string;
  branch_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  level: string;
  notes: string;
};

export function EditSessionModal({
  sessionId,
  initialDraft,
  onClose,
  onSubmit,
  trainers,
  branches,
  sessionTypes,
  flash,
}: {
  sessionId: string;
  initialDraft: EditDraft;
  onClose: () => void;
  onSubmit: (sessionId: string, fields: UpdateFields) => Promise<{ ok: boolean; reason?: string }>;
  trainers: Trainer[];
  branches: Branch[];
  sessionTypes: SessionType[];
  flash: (msg: string) => void;
}) {
  const [editDraft, setEditDraft] = useState<EditDraft>(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Modal onClose={onClose} title="تعديل الجلسة">
      <div className="space-y-3 mb-5">
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>اسم الجلسة *</label>
          <input type="text" value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} style={inputStyle()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>المدربة *</label>
          <select value={editDraft.trainer_id} onChange={e => setEditDraft(d => ({ ...d, trainer_id: e.target.value }))} style={inputStyle()}>
            <option value="">اختر...</option>
            {trainers.filter(t => t.status === 'active').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>نوع الجلسة *</label>
          <select value={editDraft.type} onChange={e => setEditDraft(d => ({ ...d, type: e.target.value }))} style={inputStyle()}>
            {sessionTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>التاريخ *</label>
          <input type="date" value={editDraft.date} onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))} style={inputStyle()} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>وقت البداية *</label>
            <input type="time" value={editDraft.start_time} onChange={e => setEditDraft(d => ({ ...d, start_time: e.target.value }))} style={inputStyle()} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>وقت النهاية *</label>
            <input type="time" value={editDraft.end_time} onChange={e => setEditDraft(d => ({ ...d, end_time: e.target.value }))} style={inputStyle()} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الفرع *</label>
          <select value={editDraft.branch_id} onChange={e => setEditDraft(d => ({ ...d, branch_id: e.target.value }))} style={inputStyle()}>
            <option value="">اختر...</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>السعة القصوى *</label>
            <input type="number" min="1" value={editDraft.capacity} onChange={e => setEditDraft(d => ({ ...d, capacity: parseInt(e.target.value, 10) || 1 }))} style={inputStyle()} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>المستوى</label>
            <select value={editDraft.level} onChange={e => setEditDraft(d => ({ ...d, level: e.target.value as Level }))} style={inputStyle()}>
              <option value="all">للجميع</option>
              <option value="beginner">مبتدئات</option>
              <option value="intermediate">متوسطات</option>
              <option value="advanced">متقدمات</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>ملاحظات</label>
          <input type="text" value={editDraft.notes} onChange={e => setEditDraft(d => ({ ...d, notes: e.target.value }))} style={inputStyle()} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>إلغاء</button>
        <button
          disabled={isSubmitting}
          onClick={async () => {
            if (!editDraft.name || !editDraft.trainer_id || !editDraft.branch_id || !editDraft.date) {
              flash('أكمل الحقول المطلوبة');
              return;
            }
            if (editDraft.start_time >= editDraft.end_time) {
              flash('وقت النهاية يجب أن يكون بعد البداية');
              return;
            }
            setIsSubmitting(true);
            try {
              const r = await onSubmit(sessionId, {
                name: editDraft.name,
                type: editDraft.type,
                trainer_id: editDraft.trainer_id,
                branch_id: editDraft.branch_id,
                date: editDraft.date,
                start_time: editDraft.start_time,
                end_time: editDraft.end_time,
                capacity: editDraft.capacity,
                level: editDraft.level,
                notes: editDraft.notes,
              });
              if (!r.ok) { flash(r.reason ?? 'تعذّر تعديل الجلسة'); return; }
              flash('تم تعديل الجلسة بنجاح');
              onClose();
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="flex-1 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </Modal>
  );
}
