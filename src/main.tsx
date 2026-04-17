import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

/**
 * Boot guard — يضمن ظهور رسالة خطأ واضحة بدل شاشة بيضاء إذا فشل التحميل.
 * الـ `boot-fallback` داخل index.html يبقى ظاهراً حتى يستبدله React.
 */
try {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error("لم يُعثر على عنصر الجذر (#root) في DOM.");

  createRoot(rootEl).render(<App />);

  // إزالة الـ boot fallback فوراً بعد mount (React لن يُزيله تلقائياً — إنه خارج الشجرة)
  const fb = document.getElementById('boot-fallback');
  if (fb) fb.remove();

  // flag للـ watchdog في index.html
  (window as unknown as { __APP_MOUNTED__: boolean }).__APP_MOUNTED__ = true;
} catch (err) {
  // عرض الخطأ في boot-fallback بدلاً من ترك الصفحة بيضاء
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error && err.stack ? err.stack : '';
  const mm = document.getElementById('boot-error-msg');
  const dd = document.getElementById('boot-error-detail');
  const ld = document.getElementById('boot-loading');
  const er = document.getElementById('boot-error');
  if (ld) ld.setAttribute('hidden', '');
  if (er) er.removeAttribute('hidden');
  if (mm) mm.textContent = 'فشل تركيب React: ' + msg;
  if (dd) dd.textContent = stack;
  // eslint-disable-next-line no-console
  console.error('[boot] React mount failed:', err);
}
