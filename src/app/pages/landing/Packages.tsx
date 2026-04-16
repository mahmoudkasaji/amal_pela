import { useNavigate } from 'react-router';
import { packages } from './data';

export default function Packages() {
  const navigate = useNavigate();

  return (
    <section id="packages" className="py-28 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header — left-aligned editorial style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-14">
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', color: '#be185d' }} className="mb-3 uppercase">
              الباقات
            </p>
            <h2
              className="text-slate-900"
              style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              الباقات المتاحة
            </h2>
          </div>
          <p className="text-slate-400" style={{ fontSize: '0.85rem', lineHeight: 1.75, maxWidth: '28ch' }}>
            مرونة كاملة في الحجز مع كل باقة
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`relative flex flex-col rounded-2xl p-7 transition-all duration-300 ${
                pkg.popular
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20'
                  : 'bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100'
              }`}
            >
              {/* Top accent line for popular */}
              {pkg.popular && (
                <div
                  className="absolute top-0 inset-x-0 h-px rounded-t-2xl"
                  style={{ background: 'linear-gradient(90deg, transparent, #fda4af, transparent)' }}
                />
              )}

              {/* Badge */}
              {pkg.popular ? (
                <span
                  className="self-start mb-5 px-2.5 py-0.5 rounded-full"
                  style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                    color: '#fda4af',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(253,164,175,0.25)',
                  }}
                >
                  الأكثر اختيارًا
                </span>
              ) : (
                <div className="mb-5 h-5" />
              )}

              {/* Name */}
              <p
                style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em' }}
                className={`uppercase mb-4 ${pkg.popular ? 'text-slate-400' : 'text-slate-400'}`}
              >
                {pkg.name}
              </p>

              {/* Session count */}
              <div className="flex items-baseline gap-1.5 mb-1">
                <span
                  style={{ fontWeight: 800, fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-0.04em' }}
                  className={pkg.popular ? 'text-white' : 'text-slate-900'}
                >
                  {pkg.sessions}
                </span>
                {pkg.sessions !== '∞' && (
                  <span style={{ fontSize: '0.85rem' }} className={pkg.popular ? 'text-slate-400' : 'text-slate-400'}>
                    جلسة
                  </span>
                )}
              </div>

              {/* Note */}
              <p style={{ fontSize: '0.8rem' }} className={`mb-6 ${pkg.popular ? 'text-slate-400' : 'text-slate-400'}`}>
                {pkg.note}
              </p>

              {/* Divider */}
              <div className={`border-t mb-6 ${pkg.popular ? 'border-white/10' : 'border-slate-100'}`} />

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-8">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span style={{ color: pkg.popular ? '#fda4af' : '#cbd5e1', fontSize: '0.9rem', lineHeight: 1 }}>—</span>
                    <span style={{ fontSize: '0.83rem' }} className={pkg.popular ? 'text-slate-300' : 'text-slate-600'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => navigate('/login')}
                className={`w-full py-2.5 rounded-xl transition-all duration-200 ${
                  pkg.popular
                    ? 'bg-white text-slate-900 hover:bg-slate-100'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
                style={{ fontWeight: 600, fontSize: '0.875rem' }}
              >
                تواصل معنا
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
