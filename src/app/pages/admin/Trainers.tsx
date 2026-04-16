import { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { Plus, X, Mail, Phone, MapPin, Star, Pause, Play, CheckCircle2 } from 'lucide-react';
import { today } from '../../lib/date';
import type { Trainer } from '../../data/types';
import { fetchBranchesList, type Branch } from '../../api/rpc';
import { inputStyle } from '../../components/ui/utils';

type EditDraft = Pick<Trainer, 'name' | 'specialty' | 'email' | 'phone' | 'branch'>;

export default function AdminTrainers() {
  const initialized        = useDataStore(s => s.initialized);
  const allTrainers        = useDataStore(s => s.trainers);
  const sessions           = useDataStore(s => s.sessions);
  const updateTrainer      = useDataStore(s => s.updateTrainer);
  const toggleTrainerStatus= useDataStore(s => s.toggleTrainerStatus);

  const createTrainer       = useDataStore(s => s.createTrainer);

  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addDraft, setAddDraft] = useState({
    name: '', specialty: '', phone: '', username: '',
    password: 'pass1234', email: '', branch_id: '',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  useEffect(() => { if ((showAdd || editingId) && branches.length === 0) fetchBranchesList().then(setBranches); }, [showAdd, editingId, branches.length]);
  const [draft, setDraft] = useState<EditDraft>({
    name: '', specialty: '', email: '', phone: '', branch: '',
  });
  const [toast, setToast] = useState<string | null>(null);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const editing = editingId ? allTrainers.find(t => t.id === editingId) ?? null : null;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function openEdit(t: Trainer) {
    setDraft({
      name: t.name,
      specialty: t.specialty,
      email: t.email,
      phone: t.phone,
      branch: t.branch,
    });
    setEditingId(t.id);
  }

  async function saveEdit() {
    if (!editingId) return;
    const r = await updateTrainer(editingId, draft);
    setEditingId(null);
    flash(r.ok ? 'تم حفظ التعديلات' : r.reason ?? 'تعذّر الحفظ');
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* Top bar */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between" style={{ borderBottom: '1px solid #eef0f3' }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>المدربون</h1>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{allTrainers.length} مدربة</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          <Plus className="w-4 h-4" />
          إضافة
        </button>
      </div>

      <div className="px-5 py-5 max-w-5xl mx-auto">
        {allTrainers.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">لا توجد مدربات بعد</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTrainers.map(trainer => {
            const trSessions   = sessions.filter(s => s.trainerId === trainer.id);
            const todaySess    = trSessions.filter(s => s.date === today());
            const totalEnrolled = trSessions.reduce((acc, s) => acc + s.enrolled, 0);
            const completed    = trSessions.filter(s => s.status === 'completed').length;

            return (
              <div
                key={trainer.id}
                className="rounded-2xl overflow-hidden transition-all hover:shadow-sm"
                style={{ background: '#ffffff', border: '1px solid #eef0f3' }}
              >
                {/* Card header with dark bg */}
                <div className="p-5" style={{ background: '#0f172a' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>{trainer.name.slice(0, 1)}</span>
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{trainer.name}</h3>
                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{trainer.specialty}</p>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        fontSize: '0.62rem', fontWeight: 600,
                        background: trainer.status === 'active' ? 'rgba(255,255,255,0.12)' : 'rgba(239,68,68,0.2)',
                        color:      trainer.status === 'active' ? 'rgba(255,255,255,0.65)' : '#fca5a5',
                        border:     '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {trainer.status === 'active' ? 'فعالة' : 'غير فعالة'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'جلسات',  value: trSessions.length },
                      { label: 'اليوم',  value: todaySess.length },
                      { label: 'متدربة', value: totalEnrolled },
                    ].map(stat => (
                      <div key={stat.label} className="text-center">
                        <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em' }}>{stat.value}</p>
                        <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-2">
                  {[
                    { Icon: Mail,  value: trainer.email },
                    { Icon: Phone, value: trainer.phone },
                    { Icon: MapPin,value: trainer.branch },
                  ].map(row => (
                    <div key={row.value} className="flex items-center gap-2.5">
                      <row.Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#cbd5e1' }} />
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.value}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #f1f5f9', marginTop: '12px' }}>
                    <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                      <Star className="w-3.5 h-3.5" />
                      <span style={{ fontSize: '0.72rem' }}>{completed} جلسة مكتملة</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={async () => {
                          const was = trainer.status;
                          const r = await toggleTrainerStatus(trainer.id);
                          flash(r.ok ? (was === 'active' ? 'تم إيقاف المدربة' : 'تم تفعيل المدربة') : r.reason ?? 'تعذّر التبديل');
                        }}
                        className="p-1.5 rounded-lg transition-all hover:opacity-90 flex items-center justify-center"
                        style={{
                          background: trainer.status === 'active' ? '#fef3c7' : '#dcfce7',
                          color: trainer.status === 'active' ? '#92400e' : '#166534',
                          border: 'none', cursor: 'pointer',
                        }}
                        title={trainer.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      >
                        {trainer.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(trainer)}
                        className="px-3 py-1.5 rounded-lg transition-all hover:bg-slate-100"
                        style={{ fontSize: '0.72rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}
                      >
                        تعديل
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add trainer modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
            style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>إضافة مدربة جديدة</h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الاسم *</label>
                <input type="text" value={addDraft.name} onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))} placeholder="اسم المدربة" style={inputStyle()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>التخصص</label>
                <input type="text" value={addDraft.specialty} onChange={e => setAddDraft(d => ({ ...d, specialty: e.target.value }))} placeholder="يوغا، تأمل..." style={inputStyle()} />
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
                <input type="email" value={addDraft.email} onChange={e => setAddDraft(d => ({ ...d, email: e.target.value }))} placeholder="email@studio.com" style={inputStyle()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الفرع</label>
                <select value={addDraft.branch_id} onChange={e => setAddDraft(d => ({ ...d, branch_id: e.target.value }))} style={inputStyle()}>
                  <option value="">اختر...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>إلغاء</button>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  if (!addDraft.name.trim() || !addDraft.username.trim() || !addDraft.password) {
                    flash('الاسم واليوزر نيم والباسورد مطلوبة');
                    return;
                  }
                  if (addDraft.username.trim().length < 3) {
                    flash('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
                    return;
                  }
                  if (addDraft.password.length < 6) {
                    flash('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    const r = await createTrainer({
                      name: addDraft.name.trim(),
                      username: addDraft.username.trim(),
                      password: addDraft.password,
                      phone: addDraft.phone.trim() || undefined,
                      email: addDraft.email.trim() || undefined,
                      specialty: addDraft.specialty.trim() || undefined,
                      branch_id: addDraft.branch_id || undefined,
                    });
                    if (!r.ok) { flash(r.reason ?? 'تعذّر إنشاء الحساب'); return; }
                    setShowAdd(false);
                    setAddDraft({ name: '', specialty: '', phone: '', username: '', password: 'pass1234', email: '', branch_id: '' });
                    flash('تم إنشاء حساب المدربة بنجاح');
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
          </div>
        </div>
      )}

      {/* ── Edit trainer modal ── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditingId(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
            style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>تعديل بيانات المدربة</h2>
              <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              {[
                { key: 'name',      label: 'الاسم',             type: 'text'  },
                { key: 'specialty', label: 'التخصص',            type: 'text'  },
                { key: 'email',     label: 'البريد الإلكتروني', type: 'email' },
                { key: 'phone',     label: 'رقم الهاتف',         type: 'tel'   },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={draft[f.key as keyof EditDraft]}
                    onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={inputStyle()}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الفرع</label>
                <select
                  value={draft.branch}
                  onChange={e => setDraft(prev => ({ ...prev, branch: e.target.value }))}
                  style={inputStyle()}
                >
                  <option value="">اختر...</option>
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>
                إلغاء
              </button>
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl hover:opacity-90" style={{ fontSize: '0.85rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
          style={{ background: '#0f172a', color: '#ffffff' }}
        >
          <CheckCircle2 className="w-4 h-4" />
          <p style={{ fontSize: '0.83rem', fontWeight: 500 }}>{toast}</p>
        </div>
      )}
    </div>
  );
}
