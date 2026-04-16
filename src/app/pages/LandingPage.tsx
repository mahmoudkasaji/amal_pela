import { useNavigate } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Flower2,
  ArrowLeft,
  Check,
  Star,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Users,
  Menu,
  X,
} from 'lucide-react';

// ─── Images ─────────────────────────────────────────────────────────────────
const IMG_HERO   = 'https://images.unsplash.com/photo-1769610712786-60f5f6e727ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200';
const IMG_ABOUT  = 'https://images.unsplash.com/photo-1717500251880-e8209ae23fa8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700';
const IMG_2      = 'https://images.unsplash.com/photo-1637066189302-8d2a241ea9f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500';
const IMG_3      = 'https://images.unsplash.com/photo-1717500252072-908accb18f55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500';
const IMG_STUDIO = 'https://images.unsplash.com/photo-1676496962536-d8ef110ff6f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=700';

// ─── Data ──────────────────────────────────────────────────────────────────
const sessions = [
  { id: 1, title: 'بيلاتز للمبتدئين',    desc: 'بداية آمنة وتدريجية لبناء القاعدة الصحيحة.',         dur: '٥٠ دقيقة', lvl: 'مبتدئ' },
  { id: 2, title: 'بيلاتز متقدم',        desc: 'تمارين أعمق لتحدي القوة والتحكم.',                   dur: '٦٠ دقيقة', lvl: 'متقدم' },
  { id: 3, title: 'جلسة فردية',          desc: 'اهتمام كامل ومخصص يُسرّع نتائجك.',                  dur: '٤٥ دقيقة', lvl: 'جميع المستويات' },
  { id: 4, title: 'جلسة جماعية',         desc: 'أجواء محفزة في مجموعة صغيرة ومنتقاة.',              dur: '٥٠ دقيقة', lvl: 'جميع المستويات' },
  { id: 5, title: 'تحسين المرونة',       desc: 'تمديد العضلات وتوسيع نطاق الحركة.',                 dur: '٤٠ دقيقة', lvl: 'مبتدئ' },
  { id: 6, title: 'توازن وتنفس',         desc: 'دمج البيلاتز مع تقنيات التنفس الواعي.',             dur: '٥٥ دقيقة', lvl: 'متوسط' },
];

const packages = [
  {
    id: 1, name: 'الانطلاق', sessions: '٨', note: 'للبداية وبناء العادة',
    features: ['حجز مرن', 'جلسة تعرفي', 'تتبع التقدم'],
    popular: false,
  },
  {
    id: 2, name: 'التميز', sessions: '٢٠', note: 'الأكثر اختيارًا',
    features: ['حجز مرن', 'جلسة تعريفية', 'تتبع التقدم', 'جلسة خاصة مجانية'],
    popular: true,
  },
  {
    id: 3, name: 'الشهرية', sessions: '∞', note: 'للتحول الكامل',
    features: ['حجز غير محدود', 'أولوية الحجز', 'تتبع التقدم', 'جلستان مجانيتان'],
    popular: false,
  },
];

const steps = [
  { n: '٢', title: 'تفضل على المركز', desc: 'سجّلي في دقيقة واحدة.' },
  { n: '٣', title: 'اختاري باقتك',    desc: 'تصفّحي ما يناسب هدفك.' },
  { n: '٤', title: 'احجزي جلستك',     desc: 'اختاري الوقت والمدربة.' },
  { n: '٥', title: 'استمتعي',         desc: 'عيشي الفرق من الجلسة الأولى.' },
];

const schedule = [
  { id: 1, name: 'بيلاتز للمبتدئين',  date: 'الإثنين ١٨ أبريل',  time: '٠٩:٠٠ ص', trainer: 'سارة الأحمد' },
  { id: 2, name: 'تحسين المرونة',      date: 'الإثنين ١٨ أبريل',  time: '١٢:٠٠ م', trainer: 'سارة الأحمد' },
  { id: 3, name: 'بيلاتز متقدم',       date: 'الثلاثاء ١٩ أبريل', time: '٠٩:٠٠ ص', trainer: 'نور العلي'   },
  { id: 4, name: 'جلسة جماعية',        date: 'الأربعاء ٢٠ أبريل', time: '١١:٠٠ ص', trainer: 'سارة الأحمد' },
  { id: 5, name: 'توازن وتنفس',        date: 'الخميس ٢١ أبريل',   time: '٠٩:٠٠ ص', trainer: 'نور العلي'   },
];

const testimonials = [
  { id: 1, name: 'فاطمة العمري',  role: 'عضو منذ ٦ أشهر',  text: 'منذ انضمامي تغيّر جسمي وذهني تمامًا. الجو هادئ والمدربات محترفات.' },
  { id: 2, name: 'منى الشهري',   role: 'عضو منذ ٣ أشهر',  text: 'أفضل قرار اتخذته لنفسي. النظام سهل والنتائج مذهلة.' },
  { id: 3, name: 'ريم الزهراني', role: 'عضو منذ سنة',      text: 'بيئة راقية والمدربة سارة رائعة. جلسات مصممة باحترافية عالية.' },
];

const HERO_WORDS = ['التوازن', 'الرشاقة', 'الراحة', 'الاستقرار', 'التغيير'];

// ─── Component ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex(i => (i + 1) % HERO_WORDS.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { label: 'عن المركز', href: '#about' },
    { label: 'الجلسات',   href: '#sessions' },
    { label: 'الباقات',   href: '#packages' },
    { label: 'تواصل',     href: '#contact' },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }} className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center pt-5 px-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full transition-all duration-500"
          style={{ maxWidth: scrolled ? '780px' : '1100px' }}
        >
          <div
            className="flex items-center justify-between px-5 h-14 transition-all duration-500"
            style={
              scrolled
                ? {
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.55)',
                    borderRadius: '9999px',
                    boxShadow: '0 8px 32px rgba(15,10,20,0.10), 0 1px 0 rgba(255,255,255,0.8) inset',
                  }
                : {
                    background: 'transparent',
                    borderRadius: '9999px',
                  }
            }
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  background: scrolled ? '#0f172a' : 'rgba(255,255,255,0.15)',
                  border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: scrolled ? 'none' : 'blur(8px)',
                }}
              >
                <Flower2 className="w-4 h-4 text-white" />
              </div>
              <span
                className="transition-colors duration-500"
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  letterSpacing: '-0.01em',
                  color: scrolled ? '#0f172a' : 'rgba(255,255,255,0.92)',
                }}
              >
                استوديو سيرين
              </span>
            </div>

            {/* Desktop nav — centered */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  className="px-4 py-1.5 rounded-full transition-all duration-300"
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: scrolled ? '#475569' : 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = scrolled
                      ? 'rgba(15,23,42,0.06)'
                      : 'rgba(255,255,255,0.12)';
                    (e.currentTarget as HTMLElement).style.color = scrolled
                      ? '#0f172a'
                      : 'rgba(255,255,255,1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = scrolled
                      ? '#475569'
                      : 'rgba(255,255,255,0.75)';
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="hidden md:inline-flex items-center px-5 py-2 rounded-full transition-all duration-300"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  background: scrolled ? '#0f172a' : 'rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.95)',
                  border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: scrolled ? 'none' : 'blur(8px)',
                  letterSpacing: '0.005em',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = scrolled
                    ? '#1e293b'
                    : 'rgba(255,255,255,0.28)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = scrolled
                    ? '#0f172a'
                    : 'rgba(255,255,255,0.18)';
                }}
              >
                تسجيل الدخول
              </button>

              {/* Mobile hamburger */}
              <button
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: scrolled ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.15)',
                  border: scrolled ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.3)',
                }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen
                  ? <X className="w-4 h-4" style={{ color: scrolled ? '#0f172a' : 'white' }} />
                  : <Menu className="w-4 h-4" style={{ color: scrolled ? '#0f172a' : 'white' }} />
                }
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div
              className="md:hidden mt-2 mx-2 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 12px 40px rgba(15,10,20,0.12)',
              }}
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {navLinks.map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                    style={{ fontSize: '0.9rem', fontWeight: 500 }}
                  >
                    {l.label}
                  </a>
                ))}
                <div className="pt-2 pb-1 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => { navigate('/login'); setMenuOpen(false); }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white transition-all"
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                  >
                    تسجيل الدخول
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
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

      {/* ══════════════════ ABOUT ══════════════════ */}
      <section id="about" className="py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          {/* Images */}
          <div className="grid grid-cols-2 gap-3">
            <img src={IMG_ABOUT}  alt="المركز" loading="lazy" decoding="async" className="col-span-2 rounded-2xl object-cover h-60 w-full" />
            <img src={IMG_2}      alt="جلسة"   loading="lazy" decoding="async" className="rounded-2xl object-cover h-44 w-full" />
            <img src={IMG_3}      alt="تمارين" loading="lazy" decoding="async" className="rounded-2xl object-cover h-44 w-full" />
          </div>

          {/* Text */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#be185d' }} className="mb-4 uppercase">
              عن المركز
            </p>
            <h2
              className="text-slate-900"
              style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em' }}
            >
              نؤمن بأن التوازن هو أساس الصحة
            </h2>
            <p className="mt-5 text-slate-500" style={{ fontSize: '0.95rem', lineHeight: 1.9 }}>
              مركز متخصص في تمارين البيلاتز، نقدم جلسات موجهة لجميع المستويات بإشراف مدربات محترفات في بيئة هادئة ومريحة.
            </p>

            <div className="mt-8 space-y-3.5">
              {[
                'مدربات معتمدات بخبرة متخصصة',
                'بيئة مريحة وآمنة مصممة للاسترخاء',
                'جلسات لجميع المستويات والأعمار',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span style={{ fontSize: '0.9rem' }} className="text-slate-700">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ SESSIONS ══════════════════ */}
      <section id="sessions" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#be185d' }} className="mb-3 uppercase">
                ما نقدمه
              </p>
              <h2
                className="text-slate-900"
                style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }}
              >
                جلساتنا
              </h2>
            </div>
            <p className="text-slate-400 md:text-left max-w-xs" style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
              اختاري الجلسة التي تناسب هدفك ومستواك
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((s, i) => (
              <div
                key={s.id}
                className="group relative bg-white border border-slate-100 rounded-2xl p-6 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
              >
                {/* Number */}
                <span
                  style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}
                  className="text-slate-300"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <h3
                  style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.75rem' }}
                  className="text-slate-900"
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.84rem', lineHeight: 1.7 }} className="text-slate-400 mt-1.5">
                  {s.desc}
                </p>

                <div className="flex items-center gap-4 mt-5 pt-5 border-t border-slate-50">
                  <span
                    className="inline-flex items-center gap-1.5 text-slate-400"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {s.dur}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-500"
                    style={{ fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    {s.lvl}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PACKAGES ══════════════════ */}
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
            {steps.map((step, i) => {
              const stepImages = [
                'https://images.unsplash.com/photo-1638186318096-cd3ee2aa9e66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
                'https://images.unsplash.com/photo-1523001021477-53f37adf2df3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
                'https://images.unsplash.com/photo-1669659873450-64d5f78f59e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
                'https://images.unsplash.com/photo-1717500251611-882d737823a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
              ];
              return (
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
              );
            })}
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
          {(() => {
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
            );
          })()}
        </div>
      </section>

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

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer id="contact" className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
          <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Flower2 className="w-4 h-4 text-white" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>استوديو سيرين</span>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.85, color: '#94a3b8', maxWidth: '28ch' }}>
                مركز بيلاتز متخصص يجمع بين الاحترافية والهدوء لمنحك تجربة تدريبية فريدة.
              </p>
              <div className="flex gap-2 mt-6">
                {[
                  { Icon: Instagram, label: 'Instagram' },
                  { Icon: Twitter,   label: 'Twitter'   },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f1f5f9', letterSpacing: '0.05em' }} className="mb-4">
                روابط
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: 'تسجيل الدخول', href: '/login' },
                  { label: 'الجلسات',       href: '#sessions' },
                  { label: 'الباقات',       href: '#packages' },
                  { label: 'عن المركز',     href: '#about' },
                ].map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    style={{ fontSize: '0.83rem', display: 'block', color: '#64748b' }}
                    className="hover:text-slate-300 transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f1f5f9', letterSpacing: '0.05em' }} className="mb-4">
                تواصل
              </h4>
              <div className="space-y-3">
                {[
                  { Icon: Phone, text: '+966 50 000 0000' },
                  { Icon: Mail,  text: 'info@serine.sa'   },
                  { Icon: MapPin,text: 'الرياض، السعودية' },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-7">
            <p style={{ fontSize: '0.78rem', color: '#475569' }}>
              © ٢٠٢٦ استوديو سيرين. جميع الحقوق محفوظة.
            </p>
            <p style={{ fontSize: '0.78rem', color: '#334155' }}>
              صُنع بعناية لصحتك
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}