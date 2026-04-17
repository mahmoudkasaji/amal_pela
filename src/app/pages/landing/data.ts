// ─── Images (Phase G: local assets served from /public/images/) ─────────────
export const IMG_HERO   = '/images/landing/hero.jpg';
export const IMG_ABOUT  = '/images/landing/about.jpg';
export const IMG_2      = '/images/landing/about-2.jpg';
export const IMG_3      = '/images/landing/about-3.jpg';
export const IMG_STUDIO = '/images/landing/studio.jpg';

// ─── Data ──────────────────────────────────────────────────────────────────
export const sessions = [
  { id: 1, title: 'بيلاتز للمبتدئين',    desc: 'بداية آمنة وتدريجية لبناء القاعدة الصحيحة.',         dur: '٥٠ دقيقة', lvl: 'مبتدئ' },
  { id: 2, title: 'بيلاتز متقدم',        desc: 'تمارين أعمق لتحدي القوة والتحكم.',                   dur: '٦٠ دقيقة', lvl: 'متقدم' },
  { id: 3, title: 'جلسة فردية',          desc: 'اهتمام كامل ومخصص يُسرّع نتائجك.',                  dur: '٤٥ دقيقة', lvl: 'جميع المستويات' },
  { id: 4, title: 'جلسة جماعية',         desc: 'أجواء محفزة في مجموعة صغيرة ومنتقاة.',              dur: '٥٠ دقيقة', lvl: 'جميع المستويات' },
  { id: 5, title: 'تحسين المرونة',       desc: 'تمديد العضلات وتوسيع نطاق الحركة.',                 dur: '٤٠ دقيقة', lvl: 'مبتدئ' },
  { id: 6, title: 'توازن وتنفس',         desc: 'دمج البيلاتز مع تقنيات التنفس الواعي.',             dur: '٥٥ دقيقة', lvl: 'متوسط' },
];

export const packages = [
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

export const steps = [
  { n: '٢', title: 'تفضل على المركز', desc: 'سجّلي في دقيقة واحدة.' },
  { n: '٣', title: 'اختاري باقتك',    desc: 'تصفّحي ما يناسب هدفك.' },
  { n: '٤', title: 'احجزي جلستك',     desc: 'اختاري الوقت والمدربة.' },
  { n: '٥', title: 'استمتعي',         desc: 'عيشي الفرق من الجلسة الأولى.' },
];

export const schedule = [
  { id: 1, name: 'بيلاتز للمبتدئين',  date: 'الإثنين ١٨ أبريل',  time: '٠٩:٠٠ ص', trainer: 'سارة الأحمد' },
  { id: 2, name: 'تحسين المرونة',      date: 'الإثنين ١٨ أبريل',  time: '١٢:٠٠ م', trainer: 'سارة الأحمد' },
  { id: 3, name: 'بيلاتز متقدم',       date: 'الثلاثاء ١٩ أبريل', time: '٠٩:٠٠ ص', trainer: 'نور العلي'   },
  { id: 4, name: 'جلسة جماعية',        date: 'الأربعاء ٢٠ أبريل', time: '١١:٠٠ ص', trainer: 'سارة الأحمد' },
  { id: 5, name: 'توازن وتنفس',        date: 'الخميس ٢١ أبريل',   time: '٠٩:٠٠ ص', trainer: 'نور العلي'   },
];

export const testimonials = [
  { id: 1, name: 'فاطمة العمري',  role: 'عضو منذ ٦ أشهر',  text: 'منذ انضمامي تغيّر جسمي وذهني تمامًا. الجو هادئ والمدربات محترفات.' },
  { id: 2, name: 'منى الشهري',   role: 'عضو منذ ٣ أشهر',  text: 'أفضل قرار اتخذته لنفسي. النظام سهل والنتائج مذهلة.' },
  { id: 3, name: 'ريم الزهراني', role: 'عضو منذ سنة',      text: 'بيئة راقية والمدربة سارة رائعة. جلسات مصممة باحترافية عالية.' },
];

export const HERO_WORDS = ['التوازن', 'الرشاقة', 'الراحة', 'الاستقرار', 'التغيير'];

export const navLinks = [
  { label: 'عن المركز', href: '#about' },
  { label: 'الجلسات',   href: '#sessions' },
  { label: 'الباقات',   href: '#packages' },
  { label: 'تواصل',     href: '#contact' },
];
