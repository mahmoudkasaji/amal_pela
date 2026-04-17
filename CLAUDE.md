# خطة الدورة الثانية — إصلاحات ما بعد المراجعة

## Context

بعد مراجعة النسخة الجديدة من المشروع (بعد إنجاز المراحل 0-8)، حدّد المستخدم **12 ملاحظة متبقية**. تم التحقق من كل واحدة منها في الكود الحالي وثبتت صحتها كلها. هذه الخطة تنظّم معالجتها على 8 مراحل مترابطة بحيث يمكن تنفيذ كل مرحلة باستقلالية، واختبارها، والتوقف بعدها.

### خلاصة التحقق من الملاحظات الـ 12

| # | الملاحظة | الموقع في الكود | الحالة |
|---|---------|----------------|--------|
| 1 | التحميل المزدوج عند الدخول | `AuthContext.tsx:80-98` — `getSession()` + `onAuthStateChange` كلاهما يستدعي `safeLoadAuthUser`; `loadingRef` لا يمنع التنفيذ المتتابع | مؤكد |
| 2 | Admin init ثقيل (6 استعلامات) | `useDataStore.ts:143-170` — `refresh()` يُطلق 6 استعلامات بالتوازي | مؤكد |
| 3 | التعليق على شاشة التحميل | `loaders.ts:29` — `fetchBranches()` **خارج** `Promise.allSettled`؛ فشله يُسقط `initialized` للأبد | مؤكد |
| 4 | `useDataStore.ts` ضخم | 423 سطر + factory + state + lifecycle + 20 action + DB-to-UI translation | مؤكد |
| 5 | Admin init غير مُحسّن | نفس #2 | مؤكد |
| 6 | كتابة مباشرة في الـ API | 10+ مواقع: `branches`, `session-types`, `packages`, `sessions` inserts/updates + `updateProfileSelf` + `updateTrainerProfile` | مؤكد |
| 7 | `ledger` لا يُحدَّث بعد العمليات | لا يوجد `refreshLedger()` في store؛ `adjustBalance`, `bookSession`, `cancelBooking`, `assignPackage`, `freeze/unfreeze` كلها لا تُحدِّث ledger | مؤكد |
| 8 | `STATUS_CONFIG` لا يحتوي `late` | `constants.ts:12-19` — `late` مفقودة | مؤكد |
| 9 | تكرار جلب `branches` | 4 صفحات تستدعي `fetchBranchesList()` مستقلاً + 4 مواقع لـ `fetchBranches()` | مؤكد |
| 10 | صور Unsplash خارجية | 4 ملفات: `roles.config.ts`, `landing/data.ts`, `landing/HowItWorks.tsx`, `trainee/Dashboard.tsx` | مؤكد |
| 11 | نسخة التسليم تحوي `node_modules/dist` | موجودان في المجلد المحلي (محميان في `.gitignore`) | مؤكد |
| 12 | موثوقية clean build | مرتبط بـ #11 — يحتاج توثيق/أتمتة | مؤكد |

---

## Phase A: استقرار المصادقة والتهيئة (Issues #1, #3)

**الهدف:** القضاء نهائياً على التحميل المزدوج والتعليق بعد الدخول.

### A.1 إصلاح التحميل المزدوج في `AuthContext`
- **السبب الجذري:** Supabase يُطلق `onAuthStateChange` بحدث `INITIAL_SESSION` عند التحميل + `SIGNED_IN` عند الدخول. بجانب ذلك، كود `AuthContext` يستدعي `getSession().then(...)` يدوياً.
- **الإصلاح:** الاعتماد الكامل على `onAuthStateChange` (الذي يستقبل الجلسة الحالية عبر `INITIAL_SESSION`) وحذف `getSession().then(...)` اليدوي. ضبط `loading: false` عند أول حدث.
- **ملفات:** `src/app/context/AuthContext.tsx`

### A.2 منع التعليق النهائي في `initialize`
- **السبب الجذري:** `loaders.ts:29` يستدعي `await fetchBranches()` خارج `Promise.allSettled`. إذا فشل → الاستثناء يمر لـ `initialize().try` → `finally` يضبط `loading: false` فقط، لا يضبط `initialized: true` → التطبيق عالق إلى الأبد.
- **الإصلاح:** 
  - نقل `fetchBranches()` إلى داخل `Promise.allSettled` (إن فشل يُعامَل كفشل فرعي وتستمر باقي الاستعلامات بفروع فارغة).
  - ضمان `set({ initialized: true })` دائماً داخل `finally` في `initialize()`، حتى عند الخطأ.
  - إضافة `initError: string | null` إلى الـ store وعرضه عند الفشل مع زر "إعادة المحاولة".
- **ملفات:** `src/app/store/loaders.ts`, `src/app/store/useDataStore.ts`

### A.3 Timeout احتياطي
- إضافة `AbortController` مع 15 ثانية على كل fetch عبر `withRetry()` (الموجودة في Phase 8 السابق).
- **ملفات:** `src/app/api/_shared.ts`, `src/app/store/loaders.ts`

---

## Phase B: القضاء الكامل على الكتابة المباشرة (Issue #6)

**الهدف:** توحيد كل مسار الكتابة عبر RPCs آمنة بحيث لا تبقى أي `supabase.from(...).insert/update/delete()` خارج طبقة RPC.

### B.1 Migration جديد بدوال RPC موحّدة
ملف جديد: `supabase/migrations/20260417000001_unified_write_rpcs.sql`

الدوال المطلوبة (كلها `SECURITY DEFINER` + `SET search_path = public` + GRANT للأدوار المناسبة):
- `update_profile_self(p_name, p_phone, p_email, p_prefs)` — بدل `updateProfileSelf` المباشر
- `update_trainer_profile_self(p_specialty, p_branch_id)` — بدل `updateTrainerProfile`
- `admin_insert_session(...)` + `admin_update_session(...)` + `admin_delete_session(...)` — بدل `insertSession/updateSessionFields`
- `admin_insert_package(...)` + `admin_update_package(...)` — بدل `insertPackage/updatePackageFields`
- `admin_insert_branch(...)` + `admin_delete_branch(...)` — بدل الكتابة المباشرة على `branches`
- `admin_insert_session_type(...)` + `admin_delete_session_type(...)` — بدل الكتابة المباشرة على `session_types`

### B.2 تحويل الـ API wrappers إلى استدعاء RPCs
- `trainees.api.ts → updateProfileSelf` يستدعي `supabase.rpc('update_profile_self', ...)` 
- `trainers.api.ts → updateTrainerProfile` يستدعي `supabase.rpc('update_trainer_profile_self', ...)`
- `sessions.api.ts → insertSession/updateSessionFields` تستدعي RPCs
- `packages.api.ts → insertPackage/updatePackageFields` تستدعي RPCs
- `branches.api.ts → insertBranch/deleteBranch` تستدعي RPCs
- `session-types.api.ts → insertSessionType/deleteSessionType` تستدعي RPCs

### B.3 تطبيق الـ migration على Supabase
- يستدعي المستخدم Access Token وقت التنفيذ.

**ملفات:** `supabase/migrations/20260417000001_unified_write_rpcs.sql` (جديد) + كل الـ `*.api.ts` المتأثرة

---

## Phase C: تحديث Ledger + إصلاح STATUS_CONFIG (Issues #7, #8)

**الهدف:** ضمان انعكاس العمليات على الواجهة + badge كامل لكل حالات الحجز.

### C.1 إضافة `refreshLedger` إلى الـ store + ربطها
- إضافة `refreshLedger: () => Promise<void>` ضمن `DataState`
- ربطها بكل action يُعدِّل ledger (حسب triggers DB):
  - `bookSession` → `refreshLedger`
  - `cancelBooking` → `refreshLedger`
  - `assignPackage` → `refreshLedger`
  - `freezeSubscription` / `unfreezeSubscription` → `refreshLedger`
  - `extendSubscription` → `refreshLedger`
  - `adjustBalance` → `refreshLedger` ✅ (الأهم)
- **ملفات:** `src/app/store/useDataStore.ts`

### C.2 إضافة `late` إلى `STATUS_CONFIG`
```typescript
// src/app/data/constants.ts
late: { label: 'متأخرة', bg: '#fef3c7', color: '#b45309' },
```
- **ملفات:** `src/app/data/constants.ts`

---

## Phase D: Cache مركزي للـ branches (Issue #9)

**الهدف:** إنهاء تكرار جلب الفروع بين الصفحات.

### D.1 وضع `branches` + `sessionTypes` في الـ store
- إضافة `branches: Branch[]` و `sessionTypes: SessionType[]` إلى `DataState`.
- إضافة `refreshBranches()` و `refreshSessionTypes()`.
- تحميل كليهما في كل مسارات `initialize` (admin/trainer/trainee) — صغيرة جداً.

### D.2 تحديث الصفحات لتقرأ من store
- **حذف** من:
  - `admin/Trainers.tsx:29`
  - `admin/Sessions.tsx:40, 157`
  - `admin/Settings.tsx:34` (يبقى للـ CRUD لكن يعتمد على store أولاً)
  - `admin/trainees/AddTraineeModal.tsx:43`
- **استبدال** بـ `useDataStore(s => s.branches)` / `useDataStore(s => s.sessionTypes)`.

### D.3 إزالة استدعاءات `fetchBranches()` المتكررة في mutations
- `useDataStore.ts:305, 335` — استخدم `get().branches` بدل `fetchBranches()` في `updateTrainee/updateTrainer` للبحث العكسي name→id.
- **ملفات:** `src/app/store/useDataStore.ts`, 4 صفحات

---

## Phase E: تحسين Admin init (Issues #2, #5)

**الهدف:** تقليل وقت تحميل Admin الأول — fast path + background fetch.

### E.1 Progressive loading لـ Admin
- تحميل أولي **سريع** (3 استعلامات حيوية):
  - `branches`, `session_types`, `sessions` (للـ Dashboard)
- تحميل **خلفي** (بعد إظهار الواجهة) للباقي:
  - `trainees`, `trainers`, `bookings`, `packages`, `ledger`
- Admin Dashboard يُظهر skeletons للمعلومات غير الجاهزة.

### E.2 Flag `partiallyLoaded` بدل `initialized`
- `initialized = true` بمجرد اكتمال الـ fast path.
- `fullyLoaded = true` بعد اكتمال background.
- الصفحات التي تحتاج بيانات ثقيلة (Reports, Ledger) تنتظر `fullyLoaded`.

**ملفات:** `src/app/store/useDataStore.ts`, `src/app/store/loaders.ts`, `src/app/pages/admin/Dashboard.tsx`, `src/app/pages/admin/Reports.tsx`

---

## Phase F: تقسيم `useDataStore` فعلياً (Issue #4)

**الهدف:** تقليل الازدحام في ملف واحد بنقل الـ actions إلى ملفات منفصلة.

### F.1 استخراج actions إلى ملفات domain
مجلد جديد: `src/app/store/actions/`
- `bookings.actions.ts` — `bookSession`, `cancelBooking`, `markAttendance`
- `sessions.actions.ts` — `cancelSession`, `updateSession`, `createSession`
- `trainees.actions.ts` — `toggleTraineeStatus`, `assignPackage`, `freeze/unfreeze`, `extend`, `adjustBalance`, `updateTrainee`, `createTrainee`
- `trainers.actions.ts` — `updateTrainer`, `toggleTrainerStatus`, `createTrainer`
- `packages.actions.ts` — `updatePackage`, `togglePackageActive`, `createPackage`

### F.2 نمط factory — كل action يستقبل `(get, set)`
```typescript
// مثال
export const createBookingsActions = (get, set) => ({
  bookSession: async (traineeId, sessionId) => { ... },
  ...
});
```

### F.3 `useDataStore.ts` يصبح < 150 سطر
- فقط: state + lifecycle (initialize/refresh/reset) + partial refreshers + dispatch إلى actions.

**ملفات:** `src/app/store/useDataStore.ts`, `src/app/store/actions/*.ts` (جديد)

---

## Phase G: استضافة الصور محلياً (Issue #10)

**الهدف:** إزالة الاعتماد على `images.unsplash.com` للصور الأساسية.

### G.1 تنزيل الصور
- 3 صور من `roles.config.ts` (Admin/Trainer/Trainee heroes)
- 5 صور من `landing/data.ts` (IMG_HERO, IMG_ABOUT, IMG_2, IMG_3, IMG_STUDIO)
- 4 صور من `landing/HowItWorks.tsx` (gallery)
- أي صور أخرى من `trainee/Dashboard.tsx`

### G.2 وضعها في `public/images/`
- تسميات واضحة: `roles/admin.jpg`, `landing/hero.jpg`, إلخ.
- ضغط إلى WebP (أصغر بكثير) إن أمكن مع fallback JPG.

### G.3 استبدال URLs
- URL خارجي → `/images/...` مسار محلي.
- إضافة `<link rel="preload">` للـ hero image الأولى في `index.html`.

**ملفات:** `public/images/*` (جديد) + 4 ملفات المذكورة + `index.html`

---

## Phase H: نظافة الحزمة والـ clean build (Issues #11, #12)

**الهدف:** توثيق وأتمتة التسليم النظيف.

### H.1 تأكيد `.gitignore`
- بالفعل تم في Phase 1 السابق (node_modules, dist, .env.local). التحقق مرة أخرى.

### H.2 إضافة script `verify-clean` في `package.json`
```json
"scripts": {
  "verify-clean": "node -e \"const fs=require('fs'); if (fs.existsSync('node_modules') || fs.existsSync('dist')) { console.log('⚠ Artifacts present — clean before delivery'); process.exit(1); } console.log('✓ Clean'); \""
}
```

### H.3 إضافة قسم "Delivery checklist" في `README.md`
```md
## تسليم نسخة نظيفة

قبل إرسال المشروع:
1. `rm -rf node_modules dist .vite .eslintcache`
2. `git status` — يجب أن يكون فارغاً
3. أو استنسخ من git: `git clone <repo>; cd <repo>; bun install; bun run build`
```

### H.4 GitHub Actions CI للتحقق
- ملف جديد: `.github/workflows/ci.yml`
- عند كل push: checkout → bun install → typecheck → lint → build
- يضمن أن الـ main branch دائماً buildable من الصفر.

**ملفات:** `package.json`, `README.md`, `.github/workflows/ci.yml` (جديد)

---

## ترتيب التنفيذ والـ dependencies

```
Phase A (استقرار)           ─── لا تبعيات
   ↓
Phase B (RPCs كتابة)         ─── تتطلب Access Token (يُطلب عند التنفيذ)
   ↓
Phase C (Ledger + late)      ─── تبني على A
   ↓
Phase D (Branches cache)     ─── تبني على C (store منظم)
   ↓
Phase E (Admin progressive)  ─── تبني على D (branches في store)
   ↓
Phase F (Store split)        ─── تبني على E (لا عجلة)
   ↓
Phase G (صور محلية)          ─── مستقلة (يمكن أن تحدث بالتوازي)
   ↓
Phase H (نظافة + CI)         ─── النهاية
```

**تقدير الحجم التقريبي (لوحدها):**
- Phase A: صغير (4 ملفات، تغييرات دقيقة)
- Phase B: **كبير** (11 RPC جديدة + تعديل 6 ملفات API + migration + تطبيق على DB)
- Phase C: صغير (ملفان)
- Phase D: متوسط (store + 4 صفحات)
- Phase E: متوسط (store + loaders + 2 صفحات)
- Phase F: **كبير** (إعادة هيكلة store + 5 ملفات actions جديدة)
- Phase G: متوسط (تنزيل + 4 ملفات + public/)
- Phase H: صغير (3 ملفات + CI)

---

## Verification لكل Phase

### Phase A
- [ ] فتح DevTools Network → تسجيل دخول → التأكد أن `profiles` تُطلب مرة واحدة فقط (ليس مرتين)
- [ ] محاكاة فشل `fetchBranches` (Network → Block) → التطبيق يُظهر رسالة خطأ مع زر إعادة، لا spinner للأبد
- [ ] `bun run typecheck` صفر أخطاء

### Phase B
- [ ] `grep -rn "supabase.from" src/app/api/ | grep -v "select"` = 0 (لا inserts/updates/deletes مباشرة)
- [ ] كل RPC جديد قابل للاستدعاء مع role صحيح (admin vs authenticated)
- [ ] اختبار end-to-end: إنشاء جلسة → تعديلها → حذفها → كل عبر RPC

### Phase C
- [ ] `adjustBalance` من Admin → فتح صفحة Subscription لـ trainee → سجل الرصيد يُظهر العملية فوراً
- [ ] حجز من trainee → ledger يُحدَّث في store بعد العملية
- [ ] badge "متأخرة" يظهر بلون كهرماني في صفحة bookings

### Phase D
- [ ] فتح Settings/Trainers/Sessions modals → Network tab يُظهر فقط استعلام واحد لـ `branches` (من initialize)، ليس أكثر
- [ ] `grep -rn "fetchBranchesList" src/app/pages/` = 1 (فقط في Settings للـ CRUD)

### Phase E
- [ ] Lighthouse على `/admin` بعد login → TTI < 2s
- [ ] Dashboard يُظهر skeletons للـ reports/ledger بينما البيانات الحيوية (sessions) ظاهرة فوراً

### Phase F
- [ ] `wc -l src/app/store/useDataStore.ts` < 150
- [ ] كل ملف في `src/app/store/actions/` < 150 سطر

### Phase G
- [ ] `grep -rn "images.unsplash" src/` = 0
- [ ] تحميل landing بدون اتصال بـ Unsplash — كل الصور تعمل

### Phase H
- [ ] `bun run verify-clean` ينجح بعد git clone + bun install
- [ ] GitHub Actions CI أخضر على main

---

## End-to-End الاختبار النهائي (بعد كل المراحل)

**سيناريو شامل:**
1. `git clone` + `bun install` + `bun run build` — ناجح بدون أي خطأ
2. Deploy على Vercel — الموقع يعمل خلال ثانيتين
3. Login كـ Admin → Dashboard يظهر خلال ثانية (fast path) → بيانات Reports تظهر خلال ثانيتين (background)
4. إنشاء متدربة → إسناد باقة → ledger يُحدَّث فوراً
5. حجز جلسة كـ Trainee → الرصيد ينقص في واجهته خلال < 1 ثانية
6. تسجيل حضور كـ Trainer → booking يظهر "متأخرة" بلونه الصحيح إن لزم
7. محاكاة فشل شبكة → رسالة خطأ ودية مع retry
8. لا تحميل مزدوج على أي Network tab في أي من السيناريوهات

---

## حفظ كـ CLAUDE.md

بعد الموافقة، أول إجراء:
1. نسخ هذه الخطة إلى `C:\Users\mahmo\Desktop\مشروع بلاتس\project\CLAUDE.md` (استبدال الـ CLAUDE.md السابق).
2. Commit + push قبل بدء التنفيذ.
