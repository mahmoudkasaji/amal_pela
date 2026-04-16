import { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import type { Session } from '../../data/types';
import { Search, Plus, X, CalendarDays, Clock, Users, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatShortArabic, today } from '../../lib/date';
import { fetchBranchesList, fetchSessionTypesList, type Branch, type SessionType } from '../../api/rpc';
import { inputStyle } from '../../components/ui/utils';

function getStatusStyle(status: string) {
  if (status === 'open')      return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'مفتوحة' };
  if (status === 'full')      return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'مكتملة' };
  if (status === 'cancelled') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'ملغاة' };
  return                             { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'منتهية' };
}

const formatDate = formatShortArabic;

export default function AdminSessions() {
  const initialized   = useDataStore(s => s.initialized);
  const allSessions   = useDataStore(s => s.sessions);
  const trainers      = useDataStore(s => s.trainers);
  const bookings      = useDataStore(s => s.bookings);
  const cancelSession = useDataStore(s => s.cancelSession);
  const createSession = useDataStore(s => s.createSession);
  const updateSession = useDataStore(s => s.updateSession);

  const [search, setSearch] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('الكل');
  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState({
    name: '', type: 'يوغا', trainer_id: '', branch_id: '',
    date: today(), start_time: '07:00', end_time: '08:00',
    capacity: 12, level: 'all' as 'all'|'beginner'|'intermediate'|'advanced',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editDraft, setEditDraft] = useState({
    name: '', type: '', trainer_id: '', branch_id: '',
    date: '', start_time: '', end_time: '',
    capacity: 12, level: 'all' as 'all'|'beginner'|'intermediate'|'advanced',
    notes: '',
  });
  const [editSessionId, setEditSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (showAdd || showEdit) {
      if (branches.length === 0)     fetchBranchesList().then(setBranches);
      if (sessionTypes.length === 0) fetchSessionTypesList().then(setSessionTypes);
    }
  }, [showAdd, showEdit, branches.length, sessionTypes.length]);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const selected: Session | null = selectedId
    ? allSessions.find(s => s.id === selectedId) ?? null
    : null;

  // عدد المحجوزات النشطة على الجلسة المختارة (لعرضها في تأكيد الإلغاء)
  const activeBookingsCount = selected
    ? bookings.filter(b => b.sessionId === selected.id && b.status === 'confirmed').length
    : 0;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCancelSession() {
    if (!selected) return;
    const count = activeBookingsCount;
    const res = await cancelSession(selected.id);
    setConfirmCancel(false);
    setSelectedId(null);
    flash(
      res.ok
        ? (count > 0 ? `تم إلغاء الجلسة وإعادة الرصيد لـ${count} متدربة` : 'تم إلغاء الجلسة')
        : res.reason ?? 'تعذّر إلغاء الجلسة'
    );
  }

  const filtered = allSessions.filter(s => {
    const matchSearch  = s.name.includes(search) || s.trainerName.includes(search) || s.branch.includes(search);
    const matchTrainer = trainerFilter === 'الكل' || s.trainerName === trainerFilter;
    return matchSearch && matchTrainer;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* Top bar */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #eef0f3' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>الجلسات</h1>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{filtered.length} من {allSessions.length} جلسة</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
            style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            <Plus className="w-4 h-4" />
            جلسة جديدة
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4" style={{ right: '12px', color: '#cbd5e1' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث عن جلسة..."
              className="w-full py-2.5 rounded-xl outline-none"
              style={{ paddingRight: '38px', paddingLeft: '14px', fontSize: '0.83rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' }}
            />
          </div>
          <select
            value={trainerFilter}
            onChange={e => setTrainerFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl outline-none"
            style={{ fontSize: '0.83rem', background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b' }}
          >
            <option>الكل</option>
            {trainers.map(t => <option key={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="px-5 py-4 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(s => {
            const st = getStatusStyle(s.status);
            const fillPct = (s.enrolled / s.capacity) * 100;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm"
                style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginBottom: '3px' }}>{s.name}</h3>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>مع {s.trainerName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full flex-shrink-0 mr-3" style={{ fontSize: '0.62rem', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mb-3" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatDate(s.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{s.startTime} – {s.endTime}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{s.branch}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      <Users className="w-3 h-3" />{s.enrolled} / {s.capacity}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{Math.round(fillPct)}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${fillPct}%`, background: fillPct >= 90 ? '#d97706' : '#0f172a' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header dark */}
            <div className="p-5" style={{ background: '#0f172a' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>{selected.name}</h2>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>مع {selected.trainerName}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer' }}>
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-2 mb-5">
                {[
                  { label: 'النوع',    value: selected.type },
                  { label: 'التاريخ', value: formatDate(selected.date) },
                  { label: 'الوقت',   value: `${selected.startTime} – ${selected.endTime}` },
                  { label: 'الفرع',   value: selected.branch },
                  { label: 'السعة',   value: `${selected.enrolled} / ${selected.capacity}` },
                  { label: 'الحالة',  value: getStatusStyle(selected.status).label },
                  { label: 'المستوى', value: selected.level === 'all' ? 'للجميع' : selected.level === 'beginner' ? 'مبتدئات' : selected.level === 'intermediate' ? 'متوسطات' : 'متقدمات' },
                  ...(selected.notes ? [{ label: 'ملاحظات', value: selected.notes }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{row.label}</span>
                    <span style={{ fontSize: '0.83rem', fontWeight: 500, color: '#334155' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // look up branch_id and trainer_id from selected session
                    const brId = branches.find(b => b.name === selected.branch)?.id ?? '';
                    setEditDraft({
                      name: selected.name,
                      type: selected.type,
                      trainer_id: selected.trainerId,
                      branch_id: brId,
                      date: selected.date,
                      start_time: selected.startTime,
                      end_time: selected.endTime,
                      capacity: selected.capacity,
                      level: selected.level,
                      notes: selected.notes,
                    });
                    setEditSessionId(selected.id);
                    // fetch branches/types if needed
                    if (branches.length === 0) fetchBranchesList().then(setBranches);
                    if (sessionTypes.length === 0) fetchSessionTypesList().then(setSessionTypes);
                    setSelectedId(null);
                    setShowEdit(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl transition-all" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
                >
                  تعديل
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={selected.status === 'cancelled' || selected.status === 'completed'}
                  className="flex-1 py-2.5 rounded-xl transition-all hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: '0.85rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}
                >
                  إلغاء الجلسة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm cancel session modal ── */}
      {confirmCancel && selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmCancel(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{ background: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <AlertTriangle className="w-7 h-7" style={{ color: '#dc2626' }} />
              </div>
            </div>
            <h3 className="text-center" style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>
              إلغاء جلسة «{selected.name}»؟
            </h3>
            <p className="text-center mb-5" style={{ fontSize: '0.83rem', color: '#64748b' }}>
              {activeBookingsCount > 0
                ? `سيتم إعادة الرصيد تلقائياً لـ${activeBookingsCount} متدربة محجوزة، ولا يمكن التراجع.`
                : 'لا توجد حجوزات نشطة — ستُوضَع الجلسة في حالة ملغاة.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ fontSize: '0.85rem', fontWeight: 500, background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}
              >
                تراجع
              </button>
              <button
                onClick={handleCancelSession}
                className="flex-1 py-2.5 rounded-xl hover:opacity-90"
                style={{ fontSize: '0.85rem', fontWeight: 700, background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add session modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAdd(false)}
        >
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>جلسة جديدة</h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
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
                  <select value={addDraft.level} onChange={e => setAddDraft(d => ({ ...d, level: e.target.value as typeof addDraft.level }))} style={inputStyle()}>
                    <option value="all">للجميع</option>
                    <option value="beginner">مبتدئات</option>
                    <option value="intermediate">متوسطات</option>
                    <option value="advanced">متقدمات</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>إلغاء</button>
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
                    const r = await createSession(addDraft);
                    if (!r.ok) { flash(r.reason ?? 'تعذّر إنشاء الجلسة'); return; }
                    setShowAdd(false);
                    setAddDraft({
                      name: '', type: addDraft.type, trainer_id: '', branch_id: '',
                      date: today(), start_time: '07:00', end_time: '08:00',
                      capacity: 12, level: 'all',
                    });
                    flash('تم إنشاء الجلسة بنجاح');
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
          </div>
        </div>
      )}

      {/* Edit session modal */}
      {showEdit && editSessionId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowEdit(false)}
        >
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>تعديل الجلسة</h2>
              <button onClick={() => setShowEdit(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
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
                  <select value={editDraft.level} onChange={e => setEditDraft(d => ({ ...d, level: e.target.value as typeof editDraft.level }))} style={inputStyle()}>
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
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>إلغاء</button>
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
                    const r = await updateSession(editSessionId, {
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
                    setShowEdit(false);
                    flash('تم تعديل الجلسة بنجاح');
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
