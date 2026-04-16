import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { IMG_HERO, HERO_WORDS } from './data';

export default function Hero() {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex(i => (i + 1) % HERO_WORDS.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full-bleed image */}
      <div className="absolute inset-0">
        <img
          src={IMG_HERO}
          alt=""
          loading="eager"
          // @ts-expect-error fetchpriority is a valid HTML attr not yet in React types
          fetchpriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
        {/* Layer 1 — white/blush wash to soften and desaturate the image colours */}
        <div className="absolute inset-0" style={{ background: 'rgba(255, 240, 245, 0.35)' }} />
        {/* Layer 2 — dark gradient scrim for text readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,10,20,0.38) 0%, rgba(15,10,20,0.50) 50%, rgba(15,10,20,0.60) 100%)' }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-16 w-full text-center">
        {/* Label */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-7"
          style={{
            fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-300 inline-block" />
          مركز بيلاتز متخصص · الرياض
        </div>

        {/* Heading */}
        <h1
          className="text-white"
          style={{
            fontSize: 'clamp(2.6rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}
        >
          رحلتك نحو
          <span
            className="block"
            style={{ perspective: '600px', display: 'block', overflow: 'hidden' }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                style={{ color: '#fda4af', display: 'inline-block' }}
                initial={{ rotateX: -80, opacity: 0, y: 8 }}
                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                exit={{ rotateX: 80, opacity: 0, y: -8 }}
                transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
              >
                {HERO_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
          تبدأ هنا
        </h1>

        <p
          className="mt-6 mx-auto"
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.9,
            maxWidth: '42ch',
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          جلسات بيلاتز مصممة لتعزيز القوة والمرونة، في بيئة هادئة واحترافية تجعلك تعودين دائمًا.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-slate-900 hover:bg-rose-50 transition-all"
            style={{ fontWeight: 700, fontSize: '0.9rem' }}
          >
            ابدأي الآن
            <ArrowLeft className="w-4 h-4" />
          </button>
          <a
            href="#sessions"
            className="px-7 py-3 rounded-xl transition-all"
            style={{
              fontWeight: 600, fontSize: '0.9rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
            }}
          >
            استعرضي الجلسات
          </a>
        </div>

        {/* Mini stats */}
        <div
          className="inline-flex items-center gap-10 mt-14 px-8 py-5 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {[
            { val: '+٢٠٠', lbl: 'عميلة راضية' },
            { val: '+٥٠',  lbl: 'جلسة أسبوعيًا' },
            { val: '٥.٠',  lbl: 'تقييم المركز' },
          ].map((s, i) => (
            <div key={s.lbl} className={`text-center ${i < 2 ? 'border-l border-white/15 pl-10' : ''}`}>
              <p style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', color: 'white' }}>{s.val}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.2rem' }}>{s.lbl}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
