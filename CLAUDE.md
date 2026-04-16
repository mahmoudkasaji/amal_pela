# خطة إعادة تأهيل مشروع Serene Studio (Amal Pilates) — Production-Ready

## Context

بعد مراجعة شاملة للمشروع تبيّن أن الحالة الحالية — رغم أن البنية الأساسية سليمة — تعاني من مشاكل جوهرية تؤثر على:

- **الاستقرار**: تعليق شاشة التحميل، تعارض بين طبقات البيانات، 46% من migrations هي إصلاحات متأخرة
- **الأداء**: 7 استعلامات متوازية على كل تهيئة، حزمة JS ~1 MB، 12 صورة Unsplash خارجية
- **سلامة البيانات**: bug منطقي حيث `suspended` للمدربة تظهر كـ `active` في الواجهة، وفقدان دلالة `inactive` للمتدربة
- **قابلية الصيانة**: `useDataStore.ts` (420 سطر)، `LandingPage.tsx` (1,050 سطر)، `Trainees.tsx` (657 سطر) — ملفات تجمع مسؤوليات متعددة
- **النشر**: صفحة بيضاء على GitHub Pages بسبب تضارب في إعداد base path + SPA routing + missing env secrets

هذه الخطة تُقسّم العمل على **9 مراحل مترابطة** (0-8) بحيث تُنفَّذ كل مرحلة بشكل مستقل وقابلة للاختبار. الهدف النهائي: نظام مستقر، سريع، قابل للصيانة، وجاهز للإنتاج 100%.

---

## Phase 0: إنقاذ النشر (Emergency: Blank Page + Deployment)

**الأولوية:** حرجة — الموقع المنشور لا يعمل حالياً.
**القرار:** الانتقال من GitHub Pages إلى **Vercel**.

### 0.1 العودة إلى BrowserRouter
- `src/app/routes.tsx` — `createHashRouter` → `createBrowserRouter`
- `vite.config.ts` — إزالة `base` المشروط (يبقى `/`)

### 0.2 إعداد Vercel
- إنشاء `vercel.json` مع SPA rewrites:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- إزالة `.github/workflows/deploy.yml` (أو الإبقاء معطلاً)
- تجهيز دليل خطوة بخطوة للمستخدم

### 0.3 ملفات متأثرة
- `src/app/routes.tsx`
- `vite.config.ts`
- `vercel.json` (جديد)
- `.github/workflows/deploy.yml` (حذف أو تعطيل)

---

## Phase 1: تنظيف البنية التحتية والبيئة

### 1.1 مراجعة `.gitignore`
- التأكد من استبعاد: `node_modules/`, `dist/`, `.env.local`, `*.log`, `.vite/`, `coverage/`
- `bun.lock` يبقى مُتتبعاً

### 1.2 تحسين رسائل الخطأ
- `src/app/lib/supabase.ts` — استبدال `throw` القاتل برسالة ودية
- إضافة fallback UI إذا env variables مفقودة

### 1.3 أدوات جودة الكود
- `.eslintrc.json` (إعداد بسيط)
- `.prettierrc`
- `.editorconfig`
- scripts في `package.json`: `lint`, `format`

### 1.4 ملفات متأثرة
- `.gitignore`, `src/app/lib/supabase.ts`, `.eslintrc.json`, `.prettierrc`, `.editorconfig`, `package.json`, `README.md`

---

## Phase 2: إصلاحات اتساق البيانات الحرجة

### 2.1 إصلاح `Trainer.status` — bug منطقي
**المشكلة:** `entities.ts:190`:
```typescript
status: row.status === 'inactive' ? 'inactive' : 'active'
```
مدربة `suspended` تظهر كـ `active`!

**الحل:**
- `Trainer.status` → `'active' | 'suspended' | 'inactive'`
- `mapTrainer` يمرر القيمة كما هي
- تسميات عربية في `constants.ts`: `active`→"نشطة"، `suspended`→"موقوفة"، `inactive`→"غير نشطة"

### 2.2 إصلاح `Trainee.status` — فقدان دلالي
**المشكلة:** `mapTrainee:109` يحوّل `inactive` → `suspended`.

**الحل:**
- `Trainee.status` → `'active' | 'suspended' | 'inactive'`
- `mapTrainee` بدون تحويل
- تحديث الفلاتر والبادجات في Admin

### 2.3 ملفات متأثرة
- `src/app/data/types.ts`
- `src/app/api/entities.ts`
- `src/app/data/constants.ts`
- `src/app/pages/admin/Trainers.tsx`, `Trainees.tsx`

---

## Phase 3: تحسين الأداء

### 3.1 تحميل البيانات حسب الدور
- `initializeForAdmin()` — كل الكيانات
- `initializeForTrainer()` — sessions + bookings + trainees (المعنيون فقط)
- `initializeForTrainee()` — sessions المتاحة + bookings خاصته + باقته
- `AuthContext` يستدعي الدالة الصحيحة

### 3.2 تقسيم الحزمة (manualChunks)
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router'],
        'supabase': ['@supabase/supabase-js'],
        'radix': [...],
        'charts': ['recharts'],
        'forms': ['react-hook-form'],
        'date': ['date-fns'],
      }
    }
  }
}
```

### 3.3 الصور الخارجية
- إضافة `loading="lazy"` على كل `<img>` خارجي
- تقليل عرض URL Unsplash (w=800 بدل w=1600)
- خيار لاحق: استضافة محلياً

### 3.4 حذف تبعيات غير مستخدمة
فحص وحذف: `react-slick`, `react-dnd`, `react-responsive-masonry`, `canvas-confetti`

### 3.5 ملفات متأثرة
- `src/app/store/useDataStore.ts`, `AuthContext.tsx`, `vite.config.ts`, `LandingPage.tsx`, `LoginPage.tsx`, `package.json`

---

## Phase 4: تقسيم Store وتوضيح مصدر الحقيقة

### 4.1 تقسيم حسب domain
- `auth.store.ts`, `trainees.store.ts`, `trainers.store.ts`, `sessions.store.ts`, `packages.store.ts`, `settings.store.ts`
- كل store < 150 سطر

### 4.2 إزالة الكتابة المباشرة
- كل `supabase.from().update()` في الـ store → RPC جديد في `rpc.ts`
- `admin_update_trainee(...)` و `admin_update_trainer(...)` في DB

### 4.3 قاعدة صارمة
- القراءة: `entities.ts` → store → UI
- الكتابة: UI → `rpc.ts` → DB → refresh store

---

## Phase 5: تقسيم الصفحات الضخمة

**قاعدة عامة:** أي ملف `.tsx` > 300 سطر يُقسَّم.

### 5.1 LandingPage (1,050 → ~100 سطر + 8 sections)
`src/app/pages/landing/`: Hero, About, SessionsShowcase, Packages, Testimonials, Gallery, Contact, Footer

### 5.2 LoginPage (450 → ~100 سطر + 4 components)
`src/app/pages/login/`: RoleSelector, LoginForm, VisualPanel, roles.config.ts

### 5.3 admin/Trainees (657 → ~200 سطر + hooks + modals)
`src/app/pages/admin/trainees/`: TraineesList, TraineeFilters, 3 Modals, useTraineeFilters hook

### 5.4 admin/Sessions (560 → ~200 سطر)
`src/app/pages/admin/sessions/`: SessionsList, AddSessionModal, EditSessionModal, hook

---

## Phase 6: تنظيم طبقة API

### 6.1 تقسيم `rpc.ts` → 8 ملفات `*.api.ts`
- `auth.api.ts`, `trainees.api.ts`, `trainers.api.ts`, `sessions.api.ts`, `bookings.api.ts`, `packages.api.ts`, `settings.api.ts`
- `src/app/api/index.ts` — re-exports + `translateError`

### 6.2 تقسيم `entities.ts`
كل ملف API يحتوي: DbRow types + mapper + fetch function

### 6.3 نقل `updateSessionFields` من `entities.ts`
→ `sessions.api.ts` (أو RPC آمن)

---

## Phase 7: تنظيم Migrations

### 7.1 النهج المحافظ (موصى به)
- إبقاء الـ 13 migration كما هي
- إنشاء `supabase/migrations/README.md` يشرح الترتيب
- التأكد من idempotency (قابلة للتطبيق مرتين)

### 7.2 تنظيم دوال SQL
- تقسيم `functions.sql` حسب domain
- COMMENT SQL على كل دالة رئيسية

---

## Phase 8: الجاهزية للإنتاج

### 8.1 Error Boundaries متخصصة
- عام (موجود) + لكل route رئيسي
- Error pages بحسب الدور

### 8.2 Retry logic
- `src/app/lib/retry.ts` — 3 محاولات مع exponential backoff

### 8.3 Skeleton loaders
- `src/app/components/skeletons/` — بدائل للـ spinner العام

### 8.4 Logging wrapper
- `src/app/lib/log.ts` — بديل عن `console.log` مع دعم Sentry لاحقاً

### 8.5 Performance profiling
- قياس FCP, LCP, TTI
- Lighthouse Performance > 85

---

## خريطة الملفات الحرجة

| الملف | الحالة | Phase |
|-------|--------|-------|
| `vite.config.ts` | base + no manualChunks | 0, 3 |
| `src/app/routes.tsx` | HashRouter | 0 |
| `src/app/data/types.ts` | status ناقص | 2 |
| `src/app/api/entities.ts` | تحويلات صامتة، 284 سطر | 2, 6 |
| `src/app/api/rpc.ts` | 332 سطر | 6 |
| `src/app/store/useDataStore.ts` | 420 سطر، مسؤوليات مختلطة | 3, 4 |
| `src/app/context/AuthContext.tsx` | initialize ثقيل | 3 |
| `src/app/pages/LandingPage.tsx` | 1,050 سطر | 3, 5 |
| `src/app/pages/LoginPage.tsx` | 450 سطر | 3, 5 |
| `src/app/pages/admin/Trainees.tsx` | 657 سطر | 5 |
| `src/app/pages/admin/Sessions.tsx` | 560 سطر | 5 |
| `supabase/migrations/` | 6/13 fixes | 7 |
| `vercel.json` | غير موجود | 0 |

---

## نمط التنفيذ

**لكل Phase:**
1. قراءة الملفات المتأثرة بعمق
2. تنفيذ التغييرات (الحفاظ على السلوك)
3. `bun run typecheck` — صفر أخطاء
4. `bun run build` — بناء ناجح
5. اختبار يدوي
6. commit لكل Phase
7. push إلى `main`

---

## معايير التحقق

### Phase 0
- ✅ الموقع يفتح على Vercel بدون صفحة بيضاء
- ✅ تسجيل الدخول يعمل
- ✅ التنقل بدون hash

### Phase 1
- ✅ `bun run lint` نظيف
- ✅ repo نظيف

### Phase 2
- ✅ مدربة `suspended` تظهر "موقوفة"
- ✅ متدربة `inactive` تظهر "غير نشطة"

### Phase 3
- ✅ `index.js` < 300 KB
- ✅ Trainee يحمّل < 3 استعلامات
- ✅ Lighthouse Performance > 85

### Phase 4
- ✅ كل store < 150 سطر
- ✅ لا كتابة مباشرة على Supabase في store

### Phase 5
- ✅ لا ملف `.tsx` > 300 سطر

### Phase 6
- ✅ `rpc.ts` و `entities.ts` محذوفان
- ✅ لا `supabase.from(...)` خارج `api/`

### Phase 7
- ✅ Migrations idempotent
- ✅ README موجود

### Phase 8
- ✅ Error Boundaries تلتقط الأخطاء
- ✅ Retry logic يعمل
- ✅ Skeletons ظاهرة

---

## الاختبار النهائي (End-to-End)

1. فتح الموقع على Vercel (< 2 ثانية)
2. Admin: إنشاء متدربة → إسناد باقة
3. Trainee: حجز → إلغاء
4. Trainer: تسجيل حضور
5. Admin: مراجعة التقارير + تصدير CSV

كل خطوة < 2 ثانية (باستثناء التحميل الأول).
