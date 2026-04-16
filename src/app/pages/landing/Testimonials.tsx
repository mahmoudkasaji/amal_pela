import { useNavigate } from 'react-router';
import { Star, Flower2 } from 'lucide-react';
import { testimonials } from './data';

export default function Testimonials() {
  const navigate = useNavigate();

  return (
    <>
      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#be185d' }} className="mb-3 uppercase">
              آراء العملاء
            </p>
            <h2
              className="text-slate-900"
              style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }}
            >
              قالوا عنّا
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div
                key={t.id}
                className="bg-slate-50 rounded-2xl p-7 border border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100 transition-all"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <p style={{ fontSize: '0.88rem', lineHeight: 1.85 }} className="text-slate-600 mb-7">
                  "{t.text}"
                </p>

                <div className="flex items-center gap-3 pt-5 border-t border-slate-200/60">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      {t.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem' }} className="text-slate-800">{t.name}</p>
                    <p style={{ fontSize: '0.72rem' }} className="text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="py-28 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          {/* Glass card CTA */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
          >
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: '#be185d', opacity: 0.15 }} />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-2xl" style={{ background: '#7c3aed', opacity: 0.12 }} />
            </div>

            {/* Glass panel */}
            <div className="relative z-10 px-10 py-16 text-center">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                }}
              >
                <Flower2 className="w-3.5 h-3.5" style={{ color: '#f9a8d4' }} />
                استوديو سيرين
              </div>

              <h2
                className="text-white"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }}
              >
                انضمي إلينا وابدأي
                <br />
                رحلتك اليوم
              </h2>

              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginTop: '1rem' }}>
                جلستك الأولى في بيئة هادئة واحترافية تنتظرك
              </p>

              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <button
                  onClick={() => navigate('/login')}
                  className="px-7 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-all"
                  style={{ fontWeight: 700, fontSize: '0.9rem' }}
                >
                  تسجيل الدخول
                </button>
                <a
                  href="#contact"
                  className="px-7 py-3 rounded-xl transition-all"
                  style={{
                    fontWeight: 600, fontSize: '0.9rem',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  تواصل معنا
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
