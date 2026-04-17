/**
 * Banner ثابت يُعرض أعلى الصفحة عند وجود `initError` في الـ store.
 * يسمح للمستخدم بإعادة تحميل البيانات دون إعادة تحميل الصفحة كاملة.
 */
import { useState } from 'react';
import { useDataStore } from '../store/useDataStore';

export function InitErrorBanner() {
  const initError = useDataStore((s) => s.initError);
  const [retrying, setRetrying] = useState(false);

  if (!initError) return null;

  async function handleRetry() {
    setRetrying(true);
    try {
      // reset initialized ثم إعادة محاولة refresh (Admin) — للأدوار الأخرى
      // يمكن للمستخدم إعادة تحميل الصفحة. حالياً نستخدم refresh() كمحاولة عامة.
      useDataStore.setState({ initialized: false, initError: null });
      await useDataStore.getState().initialize();
    } catch {
      /* initialize نفسها تضبط initError */
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Cairo', sans-serif",
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fef3c7',
        borderBottom: '1px solid #fde68a',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.85rem',
        color: '#92400e',
      }}
    >
      <span style={{ fontWeight: 700 }}>⚠</span>
      <span style={{ flex: 1 }}>{initError}</span>
      <button
        onClick={handleRetry}
        disabled={retrying}
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '0.35rem 0.9rem',
          borderRadius: '0.5rem',
          background: '#b45309',
          color: 'white',
          border: 'none',
          cursor: retrying ? 'not-allowed' : 'pointer',
          opacity: retrying ? 0.6 : 1,
        }}
      >
        {retrying ? 'جارٍ المحاولة...' : 'إعادة المحاولة'}
      </button>
    </div>
  );
}
