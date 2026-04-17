import { steps } from './data';

export default function HowItWorks() {
  const stepImages = [
    '/images/landing/step-1.jpg',
    '/images/landing/step-2.jpg',
    '/images/landing/step-3.jpg',
    '/images/landing/step-4.jpg',
  ];

  const moments = [
    {
      time: '٠٨:٤٥',
      period: 'صباحًا',
      title: 'الوصول والترحيب',
      desc: 'تُستقبلين بابتسامة وأجواء هادئة. رائحة لطيفة، موسيقى ناعمة، وكوب شاي أعشاب ينتظرك.',
      accent: '#fda4af',
    },
    {
      time: '٠٩:٠٠',
      period: 'صباحًا',
      title: 'الإحماء والتحضير',
      desc: 'دقائق من التنفس العميق والتمديد اللطيف لإيقاظ الجسم وتهيئة العقل للجلسة.',
      accent: '#c4b5fd',
    },
    {
      time: '٠٩:١٥',
      period: 'صباحًا',
      title: 'الجلسة الأساسية',
      desc: 'تمارين بيلاتز موجّهة باحترافية — كل حركة بهدف، كل لحظة بوعي.',
      accent: '#86efac',
    },
    {
      time: '٠٩:٥٠',
      period: 'صباحًا',
      title: 'الاسترخاء والانتعاش',
      desc: 'تمديد ختامي وتنفس هادئ، ثم مساحة خاصة للتعافي والراحة قبل يومك.',
      accent: '#fda4af',
    },
  ];

  return (
    <>
      {/* ═════════════════ HOW IT WORKS ══════════════════ */}
      <section className="py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#be185d' }} className="mb-3 uppercase">
              الخطوات
            </p>
            <h2
              className="text-slate-900"
              style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }}
            >
              كيف تبدأين معنا؟
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                {/* Image circle */}
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src={stepImages[i]}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      style={{ filter: 'saturate(0.7) brightness(1.05)' }}
                    />
                    {/* soft rose overlay */}
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'rgba(251,207,217,0.18)' }}
                    />
                  </div>
                  {/* Number badge */}
                  <div
                    className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm"
                  >
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#be185d' }}>
                      {String.fromCharCode(0x0661 + i)}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }} className="text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.7 }} className="text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ A DAY IN SERINE ══════════════════ */}
      <section className="py-28 bg-slate-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-20">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#be185d' }} className="mb-3 uppercase">
              تجربتك معنا
            </p>
            <h2
              className="text-slate-900"
              style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }}
            >
              يوم في استوديو سيرين
            </h2>
            <p className="mt-3 text-slate-400 mx-auto" style={{ fontSize: '0.88rem', lineHeight: 1.8, maxWidth: '38ch' }}>
              من لحظة وصولك حتى مغادرتك — تجربة مكتملة صُممت بعناية
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">

            {/* Horizontal connector line — desktop */}
            <div
              className="hidden lg:block absolute"
              style={{
                top: '52px',
                right: '12.5%',
                left: '12.5%',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #e2e8f0 15%, #e2e8f0 85%, transparent)',
              }}
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {moments.map((m, i) => (
                <div key={i} className="flex flex-col items-center text-center group">

                  {/* Node */}
                  <div className="relative mb-7 flex-shrink-0">
                    {/* Outer glow ring */}
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-125"
                      style={{ background: `radial-gradient(circle, ${m.accent}22 0%, transparent 70%)` }}
                    />
                    {/* Circle */}
                    <div
                      className="relative w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center"
                      style={{
                        background: 'white',
                        border: '1.5px solid #f1f5f9',
                        boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
                      }}
                    >
                      {/* Time */}
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '1.15rem',
                          letterSpacing: '-0.03em',
                          color: '#0f172a',
                          lineHeight: 1,
                        }}
                      >
                        {m.time}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#94a3b8',
                          marginTop: '3px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {m.period}
                      </span>

                      {/* Bottom accent dot */}
                      <div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{ background: m.accent }}
                      />
                    </div>

                    {/* Step number — top right */}
                    <div
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: '#0f172a',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: 'white',
                      }}
                    >
                      {String.fromCharCode(0x0661 + i)}
                    </div>
                  </div>

                  {/* Content */}
                  <h3
                    style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}
                    className="mb-2"
                  >
                    {m.title}
                  </h3>
                  <p
                    style={{ fontSize: '0.8rem', lineHeight: 1.85, color: '#94a3b8', maxWidth: '22ch' }}
                  >
                    {m.desc}
                  </p>

                  {/* Accent line on hover */}
                  <div
                    className="mt-5 h-px w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"
                    style={{ background: m.accent }}
                  />
                </div>
              ))}
            </div>

            {/* Bottom note */}
            <div className="mt-16 flex items-center justify-center gap-3">
              <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to left, #e2e8f0, transparent)' }} />
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', letterSpacing: '0.04em' }}>
                كل جلسة تجربة مختلفة — والهدف دائمًا أنتِ
              </p>
              <div className="h-px flex-1 max-w-[80px]" style={{ background: 'linear-gradient(to right, #e2e8f0, transparent)' }} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
