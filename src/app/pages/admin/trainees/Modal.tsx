import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl"
        style={{ background: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{title || 'التفاصيل'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
            <X className="w-4 h-4" style={{ color: '#64748b' }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
