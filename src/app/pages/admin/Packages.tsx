import { useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { Plus, X, Check, Package, Zap, CheckCircle2 } from 'lucide-react';
import type { Package as PkgType } from '../../data/types';
import { LEVEL_STYLE, CURRENCY } from '../../data/constants';
import { inputStyle } from '../../components/ui/utils';

// Packages use plural labels (مبتدئات) vs the singular shared LEVEL_MAP
const LEVEL_MAP: Record<string, string> = { all: 'للجميع', beginner: 'مبتدئات', intermediate: 'متوسطات', advanced: 'متقدمات' };

type PkgDraft = Pick<PkgType, 'name' | 'description' | 'sessions' | 'durationDays' | 'price' | 'cancellationHours' | 'dailyLimit' | 'level' | 'renewable'>;

export default function AdminPackages() {
  const initialized         = useDataStore(s => s.initialized);
  const allPackages         = useDataStore(s => s.packages);
  const updatePackage       = useDataStore(s => s.updatePackage);
  const togglePackageActive = useDataStore(s => s.togglePackageActive);
  const createPackage       = useDataStore(s => s.createPackage);

  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addDraft, setAddDraft] = useState({
    name: '', description: '', sessions: 8, duration_days: 30, price: 0,
    cancellation_hours: 3, daily_limit: 1,
    level: 'all' as 'all'|'beginner'|'intermediate'|'advanced', renewable: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PkgDraft>({
    name: '', description: '', sessions: 0, durationDays: 30, price: 0,
    cancellationHours: 3, dailyLimit: 1, level: 'all', renewable: true,
  });
  const [toast, setToast] = useState<string | null>(null);

  if (!initialized) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  const editing = editingId ? allPackages.find(p => p.id === editingId) ?? null : null;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function openEdit(p: PkgType) {
    setDraft({
      name: p.name,
      description: p.description,
      sessions: p.sessions,
      durationDays: p.durationDays,
      price: p.price,
      cancellationHours: p.cancellationHours,
      dailyLimit: p.dailyLimit,
      level: p.level,
      renewable: p.renewable,
    });
    setEditingId(p.id);
  }

  async function saveEdit() {
    if (!editingId) return;
    const r = await updatePackage(editingId, draft);
    setEditingId(null);
    flash(r.ok ? 'تم حفظ التعديلات' : r.reason ?? 'تعذّر الحفظ');
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>

      {/* Top bar */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between" style={{ borderBottom: '1px solid #eef0f3' }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>الباقات</h1>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{allPackages.length} باقة متاحة</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
        >
          <Plus className="w-4 h-4" />
          باقة جديدة
        </button>
      </div>

      <div className="px-5 py-5 max-w-5xl mx-auto">
        {allPackages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">لا توجد باقات بعد</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPackages.map(pkg => {
            const lvl = LEVEL_STYLE[pkg.level] ?? LEVEL_STYLE.all;
            const isUnlimited = pkg.sessions === 999;
            const isActive    = pkg.isActive !== false; // افتراضياً مُفعَّلة

            return (
              <div
                key={pkg.id}
                className="rounded-2xl overflow-hidden transition-all hover:shadow-sm"
                style={{ background: '#ffffff', border: '1px solid #eef0f3', opacity: isActive ? 1 : 0.6 }}
              >
                {/* Header */}
                <div className="p-5" style={{ background: '#0f172a' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      {isUnlimited ? <Zap className="w-4 h-4 text-white" /> : <Package className="w-4 h-4 text-white" />}
                    </div>
                    <span className="px-2.5 py-1 rounded-full" style={{ fontSize: '0.62rem', fontWeight: 600, background: lvl.bg, color: lvl.color, border: `1px solid ${lvl.border}` }}>
                      {LEVEL_MAP[pkg.level]}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>{pkg.name}</h3>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{pkg.description}</p>

                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.6rem', color: '#ffffff', letterSpacing: '-0.04em' }}>
                      {pkg.price}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginRight: '4px' }}>{CURRENCY.label}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-px" style={{ background: '#f1f5f9' }}>
                  {[
                    { label: 'الجلسات',  value: isUnlimited ? '∞' : String(pkg.sessions) },
                    { label: 'المدة',    value: `${pkg.durationDays} يوم` },
                    { label: 'الإلغاء', value: `${pkg.cancellationHours} ساعة` },
                    { label: 'يومياً',  value: `${pkg.dailyLimit} جلسة` },
                  ].map(stat => (
                    <div key={stat.label} className="flex flex-col items-center justify-center py-3" style={{ background: '#ffffff' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{stat.value}</p>
                      <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="p-4 flex items-center justify-between gap-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {pkg.renewable && (
                      <span className="flex items-center gap-1" style={{ fontSize: '0.68rem', color: '#16a34a' }}>
                        <Check className="w-3 h-3" />قابلة للتجديد
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-md"
                      style={{
                        fontSize: '0.62rem', fontWeight: 600,
                        background: isActive ? '#dcfce7' : '#f1f5f9',
                        color:      isActive ? '#166534' : '#94a3b8',
                      }}
                    >
                      {isActive ? 'مُفعَّلة' : 'موقوفة'}
                    </span>
                  </div>
                  <div className="flex gap-2 mr-auto flex-shrink-0">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="px-3 py-1.5 rounded-lg transition-all hover:bg-slate-100"
                      style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}
                    >
                      تعديل
                    </button>
                    <button
                      onClick={async () => {
                        const was = isActive;
                        const r = await togglePackageActive(pkg.id);
                        flash(r.ok ? (was ? 'تم إيقاف الباقة' : 'تم تفعيل الباقة') : r.reason ?? 'تعذّر التبديل');
                      }}
                      className="px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        background: isActive ? '#fef3c7' : '#0f172a',
                        color: isActive ? '#92400e' : '#ffffff',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      {isActive ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAdd(false)}
        >
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>باقة جديدة</h2>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>اسم الباقة *</label>
                <input type="text" value={addDraft.name} onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))} placeholder="باقة 12 جلسة" style={inputStyle()} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>عدد الجلسات *</label>
                  <input type="number" min="1" value={addDraft.sessions} onChange={e => setAddDraft(d => ({ ...d, sessions: parseInt(e.target.value, 10) || 1 }))} style={inputStyle()} />
                  <p style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>اكتب 999 للباقة المفتوحة</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>المدة (أيام) *</label>
                  <input type="number" min="1" value={addDraft.duration_days} onChange={e => setAddDraft(d => ({ ...d, duration_days: parseInt(e.target.value, 10) || 1 }))} style={inputStyle()} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>السعر ({CURRENCY.label}) *</label>
                  <input type="number" min="0" step="0.01" value={addDraft.price} onChange={e => setAddDraft(d => ({ ...d, price: parseFloat(e.target.value) || 0 }))} style={inputStyle()} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>ساعات الإلغاء</label>
                  <input type="number" min="0" value={addDraft.cancellation_hours} onChange={e => setAddDraft(d => ({ ...d, cancellation_hours: parseInt(e.target.value, 10) || 0 }))} style={inputStyle()} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>الحد اليومي</label>
                  <input type="number" min="1" value={addDraft.daily_limit} onChange={e => setAddDraft(d => ({ ...d, daily_limit: parseInt(e.target.value, 10) || 1 }))} style={inputStyle()} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>المستوى</label>
                  <select value={addDraft.level} onChange={e => setAddDraft(d => ({ ...d, level: e.target.value as typeof addDraft.level }))} style={inputStyle()}>
                    <option value="all">للجميع</option>
                    <option value="beginner">مبتدئات</option>
                    <option value="intermediate">متوسطات</option>
                    <option value="advanced">متقدمات</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الوصف</label>
                <textarea value={addDraft.description} onChange={e => setAddDraft(d => ({ ...d, description: e.target.value }))} placeholder="وصف مختصر للباقة..." rows={2} style={{ ...inputStyle(), resize: 'none' }} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addDraft.renewable} onChange={e => setAddDraft(d => ({ ...d, renewable: e.target.checked }))} />
                <span style={{ fontSize: '0.83rem', color: '#334155' }}>قابلة للتجديد</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl" style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer' }}>إلغاء</button>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  if (!addDraft.name || addDraft.sessions <= 0 || addDraft.duration_days <= 0 || addDraft.price <= 0) {
                    flash('أكمل الحقول المطلوبة (تأكد من إدخال السعر)');
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    const r = await createPackage({
                      ...addDraft,
                      session_types: [],
                    });
                    if (!r.ok) { flash(r.reason ?? 'تعذّر إنشاء الباقة'); return; }
                    setShowAdd(false);
                    setAddDraft({
                      name: '', description: '', sessions: 8, duration_days: 30, price: 0,
                      cancellation_hours: 3, daily_limit: 1, level: 'all', renewable: true,
                    });
                    flash('تم إنشاء الباقة بنجاح');
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

      {/* ── Edit package modal ── */}
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
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>تعديل الباقة</h2>
              <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الاسم</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                  style={inputStyle()}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>الوصف</label>
                <textarea
                  value={draft.description}
                  onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle(), resize: 'none' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'sessions',          label: 'عدد الجلسات' },
                  { key: 'durationDays',      label: 'المدة (أيام)' },
                  { key: 'price',             label: 'السعر' },
                  { key: 'cancellationHours', label: 'ساعات الإلغاء' },
                  { key: 'dailyLimit',        label: 'الحد اليومي' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>{f.label}</label>
                    <input
                      type="number"
                      value={draft[f.key as keyof PkgDraft] as number}
                      onChange={e => setDraft(prev => ({ ...prev, [f.key]: parseInt(e.target.value, 10) || 0 }))}
                      style={inputStyle()}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>المستوى</label>
                <select
                  value={draft.level}
                  onChange={e => setDraft(prev => ({ ...prev, level: e.target.value as PkgDraft['level'] }))}
                  style={inputStyle()}
                >
                  <option value="all">للجميع</option>
                  <option value="beginner">مبتدئات</option>
                  <option value="intermediate">متوسطات</option>
                  <option value="advanced">متقدمات</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.renewable}
                  onChange={e => setDraft(prev => ({ ...prev, renewable: e.target.checked }))}
                />
                <span style={{ fontSize: '0.83rem', color: '#334155' }}>قابلة للتجديد</span>
              </label>
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
