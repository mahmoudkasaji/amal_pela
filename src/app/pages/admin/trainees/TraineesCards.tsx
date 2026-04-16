import type { Trainee } from '../../../data/types';
import { ACCOUNT_STATUS_CONFIG } from '../../../data/constants';

interface Props {
  trainees: Trainee[];
  onSelect: (t: Trainee) => void;
}

export function TraineesCards({ trainees, onSelect }: Props) {
  return (
    <div className="md:hidden space-y-3">
      {trainees.map(t => {
        return (
          <div key={t.id} className="rounded-2xl p-4" style={{ background: '#ffffff', border: '1px solid #eef0f3' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>{t.name.slice(0, 1)}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{t.name}</p>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.phone}</p>
                </div>
              </div>
              {(() => {
                const cfg = ACCOUNT_STATUS_CONFIG[t.status];
                return (
                  <span className="px-2.5 py-1 rounded-full" style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  }}>
                    {cfg.label}
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #f8fafc' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.subscription?.packageName || 'بدون باقة'}</span>
              <button onClick={() => onSelect(t)} className="px-3 py-1.5 rounded-lg" style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>
                عرض
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
