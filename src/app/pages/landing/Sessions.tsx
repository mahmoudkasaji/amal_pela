import { Clock } from 'lucide-react';
import { sessions } from './data';

export default function Sessions() {
  return (
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
  );
}
