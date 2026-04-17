import { useState, useEffect } from 'react';
import { Flower2, Save, CheckCircle2, MapPin, Bell, AlertCircle, X, Plus, Trash2 } from 'lucide-react';
import {
  fetchClubSettings, updateClubSettings, type ClubSettings,
  insertBranch, deleteBranch,
  insertSessionType, deleteSessionType,
} from '../../api';
import { useDataStore } from '../../store/useDataStore';
import { inputStyle } from '../../components/ui/utils';

export default function AdminSettings() {
  const [settings, setSettings] = useState<ClubSettings>({
    club_name: '', email: '', phone: '', website: '',
    cancellation_hours: 3, cancellation_message: '',
  });
  const [loading, setLoading] = useState(true);

  // Phase D: branches + sessionTypes من store (محمّلتان مركزياً)
  const branches = useDataStore(s => s.branches);
  const sessionTypes = useDataStore(s => s.sessionTypes);
  const refreshBranches = useDataStore(s => s.refreshBranches);
  const refreshSessionTypes = useDataStore(s => s.refreshSessionTypes);

  const [newBranchName, setNewBranchName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');

  const [notifs, setNotifs] = useState<boolean[]>([true, true, false, true, true]);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  useEffect(() => {
    setLoading(true);
    // club_settings تبقى مستقلة (لا تُحمَّل في store). branches/sessionTypes من store.
    fetchClubSettings()
      .then((s) => { if (s) setSettings(s); })
      .finally(() => setLoading(false));
  }, []);

  async function saveClubInfo() {
    const r = await updateClubSettings({
      club_name: settings.club_name,
      email: settings.email,
      phone: settings.phone,
      website: settings.website,
    });
    flash(r.ok ? 'تم حفظ معلومات النادي' : r.reason ?? 'تعذّر الحفظ');
  }

  async function saveCancelPolicy() {
    const r = await updateClubSettings({
      cancellation_hours: settings.cancellation_hours,
      cancellation_message: settings.cancellation_message,
    });
    flash(r.ok ? 'تم حفظ سياسة الإلغاء' : r.reason ?? 'تعذّر الحفظ');
  }

  async function addBranch() {
    const name = newBranchName.trim();
    if (!name) return;
    const r = await insertBranch(name);
    if (!r.ok) { flash(r.reason ?? 'تعذّر الإضافة'); return; }
    setNewBranchName('');
    await refreshBranches();
    flash('تم إضافة الفرع');
  }

  async function removeBranch(id: string) {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    const r = await deleteBranch(id);
    if (!r.ok) { flash(r.reason ?? 'تعذّر الحذف (قد يكون مربوطاً بجلسات)'); return; }
    await refreshBranches();
    flash('تم حذف الفرع');
  }

  async function addType() {
    const name = newTypeName.trim();
    if (!name) return;
    const r = await insertSessionType(name);
    if (!r.ok) { flash(r.reason ?? 'تعذّر الإضافة'); return; }
    setNewTypeName('');
    await refreshSessionTypes();
    flash('تم إضافة النوع');
  }

  async function removeType(id: string) {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    const r = await deleteSessionType(id);
    if (!r.ok) { flash(r.reason ?? 'تعذّر الحذف'); return; }
    await refreshSessionTypes();
    flash('تم حذف النوع');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 mx-auto mb-3 animate-spin" style={{ borderColor: '#e2e8f0', borderTopColor: '#0f172a' }} />
          <p style={{ fontSize: '0.83rem', color: '#94a3b8' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa', fontFamily: "'Cairo', sans-serif" }}>
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #eef0f3' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>الإعدادات</h1>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>إدارة إعدادات النادي والسياسات</p>
      </div>

      <div className="px-5 py-5 max-w-2xl mx-auto space-y-4">

        <Section icon={<Flower2 className="w-4 h-4" style={{ color: '#64748b' }} />} title="معلومات النادي">
          <div className="space-y-3 mb-4">
            {([
              { key: 'club_name', label: 'اسم النادي',           type: 'text'  },
              { key: 'email',     label: 'البريد الإلكتروني',    type: 'email' },
              { key: 'phone',     label: 'رقم الهاتف',            type: 'tel'   },
              { key: 'website',   label: 'الموقع الإلكتروني',    type: 'text'  },
            ] as const).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(settings[f.key] as string) ?? ''}
                  onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                  style={inputStyle()}
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveClubInfo}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl hover:opacity-90"
            style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            <Save className="w-4 h-4" /> حفظ
          </button>
        </Section>

        <Section icon={<AlertCircle className="w-4 h-4" style={{ color: '#64748b' }} />} title="سياسة الإلغاء">
          <div className="space-y-3 mb-4">
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>
                مدة الإلغاء المسموح بها (بالساعات)
              </label>
              <input
                type="number"
                min="0"
                value={settings.cancellation_hours}
                onChange={e => setSettings(s => ({ ...s, cancellation_hours: parseInt(e.target.value, 10) || 0 }))}
                style={inputStyle()}
              />
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
                الإلغاء قبل هذا الوقت يسترد الرصيد (افتراضي عام — كل باقة تحدد ساعاتها الخاصة).
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>
                رسالة سياسة الإلغاء
              </label>
              <textarea
                value={settings.cancellation_message ?? ''}
                onChange={e => setSettings(s => ({ ...s, cancellation_message: e.target.value }))}
                rows={3}
                style={{ ...inputStyle(), resize: 'none' }}
              />
            </div>
          </div>
          <button
            onClick={saveCancelPolicy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl hover:opacity-90"
            style={{ fontSize: '0.83rem', fontWeight: 700, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            <Save className="w-4 h-4" /> حفظ
          </button>
        </Section>

        <Section icon={<MapPin className="w-4 h-4" style={{ color: '#64748b' }} />} title="الفروع">
          <div className="space-y-2 mb-3">
            {branches.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>لا توجد فروع مُعرَّفة</p>
            )}
            {branches.map(b => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #eef0f3' }}>
                <span style={{ fontSize: '0.85rem', color: '#334155' }}>{b.name}</span>
                <button
                  onClick={() => removeBranch(b.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-100"
                  style={{ fontSize: '0.72rem', color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <Trash2 className="w-3 h-3" /> حذف
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBranchName}
              onChange={e => setNewBranchName(e.target.value)}
              placeholder="اسم الفرع الجديد"
              style={{ ...inputStyle(), flex: 1 }}
            />
            <button
              onClick={addBranch}
              className="flex items-center gap-1 px-4 rounded-xl hover:opacity-90"
              style={{ fontSize: '0.78rem', fontWeight: 600, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>
        </Section>

        <Section icon={<span style={{ fontSize: '0.9rem' }}>🧘</span>} title="أنواع الجلسات">
          <div className="flex flex-wrap gap-2 mb-3">
            {sessionTypes.map(t => (
              <span
                key={t.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
              >
                {t.name}
                <button
                  onClick={() => removeType(t.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  title="حذف"
                >
                  <X className="w-3 h-3" style={{ color: '#94a3b8' }} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              placeholder="اسم النوع الجديد (مثل: بيلاتس)"
              style={{ ...inputStyle(), flex: 1 }}
            />
            <button
              onClick={addType}
              className="flex items-center gap-1 px-4 rounded-xl hover:opacity-90"
              style={{ fontSize: '0.78rem', fontWeight: 600, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>
        </Section>

        <Section icon={<Bell className="w-4 h-4" style={{ color: '#64748b' }} />} title="الإشعارات">
          <div className="space-y-2">
            {[
              'تنبيه قبل الجلسة بساعة',
              'إشعار عند الإلغاء',
              'إشعار لانخفاض الرصيد',
              'تنبيه انتهاء الاشتراك',
              'نشرة أسبوعية',
            ].map((label, i) => (
              <label key={label} className="flex items-center justify-between py-2 cursor-pointer">
                <span style={{ fontSize: '0.83rem', color: '#334155' }}>{label}</span>
                <input
                  type="checkbox"
                  checked={notifs[i]}
                  onChange={e => setNotifs(prev => prev.map((v, j) => (j === i ? e.target.checked : v)))}
                />
              </label>
            ))}
          </div>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '8px' }}>
            * حفظ تفضيلات الإشعارات يتطلب Edge Function للإرسال الفعلي — يأتي في تحديث لاحق
          </p>
        </Section>

      </div>

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

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
        {icon}
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
