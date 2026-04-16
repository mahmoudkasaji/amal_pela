# Serene Studio — بوابة تدريب البيلاتس

**Serene Studio** (المعروف بـ Amal Pilates) — بوابة ويب كاملة لإدارة مركز تدريب البيلاتس/اليوغا، تربط بين الإدارة، المدربات، والمتدربات في منصة واحدة.

## نظرة عامة

- 3 أدوار: **Admin** (الإدارة)، **Trainer** (المدربة)، **Trainee** (المتدربة)
- نظام حجز جلسات بالرصيد + سياسة إلغاء مرنة
- تتبّع الحضور والاشتراكات
- واجهة عربية (RTL) بالكامل
- أمان على مستوى الصف (RLS) في قاعدة البيانات

## التقنيات

- **Frontend:** React 18, TypeScript, Vite, React Router 7
- **Backend:** Supabase (PostgreSQL + Auth + RLS + RPCs)
- **State:** Zustand
- **UI:** Tailwind CSS v4 + shadcn/ui (Radix)
- **Icons:** Lucide React
- **Charts:** Recharts

## المتطلبات

- **Bun** (موصى به) أو **Node.js 20+**
- حساب Supabase (للـ backend)

## التشغيل

### 1. تثبيت التبعيات
```bash
bun install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.local.example .env.local
```
ثم افتح `.env.local` وأضف:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. تشغيل التطبيق محلياً
```bash
bun run dev
```
سيُفتح على: `http://localhost:5173`

## الأوامر المتاحة

| الأمر | الوظيفة |
|------|---------|
| `bun run dev` | تشغيل خادم التطوير |
| `bun run build` | بناء نسخة الإنتاج |
| `bun run preview` | معاينة البناء محلياً |
| `bun run typecheck` | فحص TypeScript |
| `bun run lint` | فحص الكود بـ ESLint |
| `bun run lint:fix` | إصلاح تلقائي لمشاكل ESLint |
| `bun run format` | تنسيق الكود بـ Prettier |
| `bun run format:check` | فحص التنسيق فقط |

## بنية المشروع

```
src/app/
├── api/            # طبقة الـ API (قراءة + RPCs)
├── components/     # مكونات UI مشتركة (shadcn + ErrorBoundary + ProtectedRoute)
├── context/        # AuthContext
├── data/           # TypeScript types + ثوابت
├── layouts/        # Layout لكل دور (Admin/Trainer/Trainee)
├── lib/            # أدوات (Supabase client, date utilities, CSV export)
├── pages/          # الصفحات (منظّمة حسب الدور)
├── store/          # Zustand store
└── routes.tsx      # تعريف المسارات

supabase/
├── migrations/     # ترحيلات قاعدة البيانات
└── seed.sql        # بيانات تجريبية
```

## النشر

المشروع معدّ للنشر على **Vercel** (انظر `vercel.json`):

1. أنشئ مشروعاً جديداً في [Vercel](https://vercel.com/new) واستورد الـ repo
2. أضف متغيرات البيئة (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. اضغط Deploy

## التطوير

قواعد المشروع وأنماط التطوير موثّقة في `CLAUDE.md`.

## الرخصة

Private — جميع الحقوق محفوظة.
