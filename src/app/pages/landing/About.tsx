import { Check } from 'lucide-react';
import { IMG_ABOUT, IMG_2, IMG_3 } from './data';

export default function About() {
  return (
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
  );
}
