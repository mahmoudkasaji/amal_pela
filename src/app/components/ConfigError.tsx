/**
 * شاشة تُعرَض عند غياب إعدادات Supabase (عادةً على Vercel قبل إضافة env vars).
 * بديل كامل عن التطبيق — تمنع أي محاولة render للـ AuthProvider/Router التي
 * ستفشل بدون supabase مُكوَّن.
 */

export function ConfigError() {
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'IBM Plex Sans Arabic', 'Cairo', sans-serif",
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f7f8fa 0%, #eef0f3 100%)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: 'white',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: '2.5rem 2rem',
          boxShadow: '0 8px 40px rgba(15,23,42,0.06)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            fontSize: '1.8rem',
          }}
        >
          ⚙️
        </div>

        <h1
          style={{
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#0f172a',
            textAlign: 'center',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          التطبيق يحتاج إلى إعداد
        </h1>

        <p
          style={{
            fontSize: '0.9rem',
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 1.8,
            margin: '0 0 1.5rem',
          }}
        >
          متغيرات البيئة (<span style={{ direction: 'ltr', display: 'inline-block' }}>Environment Variables</span>){' '}
          المطلوبة للاتصال بـ Supabase غير موجودة.
          <br />
          هذه الرسالة تظهر عادةً بعد أول نشر على Vercel قبل إضافة الإعدادات.
        </p>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', margin: '0 0 0.75rem' }}>
            المتغيرات المطلوبة:
          </p>
          <code
            style={{
              display: 'block',
              fontSize: '0.78rem',
              color: '#0f172a',
              background: 'white',
              padding: '0.55rem 0.75rem',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              marginBottom: '0.5rem',
              direction: 'ltr',
              textAlign: 'left',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            VITE_SUPABASE_URL
          </code>
          <code
            style={{
              display: 'block',
              fontSize: '0.78rem',
              color: '#0f172a',
              background: 'white',
              padding: '0.55rem 0.75rem',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              direction: 'ltr',
              textAlign: 'left',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            VITE_SUPABASE_ANON_KEY
          </code>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 2 }}>
          <p style={{ fontWeight: 700, margin: '0 0 0.5rem' }}>خطوات الإصلاح على Vercel:</p>
          <ol style={{ paddingInlineStart: '1.2rem', margin: 0 }}>
            <li>
              روح على{' '}
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
              >
                Vercel Dashboard
              </a>
            </li>
            <li>اختر مشروع <code>amal-pela</code></li>
            <li>
              <code>Settings</code> → <code>Environment Variables</code>
            </li>
            <li>أضف المتغيرين أعلاه وفعّلهما لكل البيئات</li>
            <li>
              ارجع لـ <code>Deployments</code> وأعد نشر آخر deploy (<em>Redeploy</em>)
            </li>
          </ol>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'white',
            background: '#0f172a',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  );
}
