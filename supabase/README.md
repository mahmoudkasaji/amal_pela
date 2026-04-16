# Supabase — Serene Studio

بنية قاعدة البيانات الكاملة للمشروع. تُشغَّل محلياً عبر Supabase CLI ثم تُرفَع لاحقاً إلى Supabase Hosted.

---

## هيكل المجلدات

```
supabase/
├── config.toml                                 # إعدادات Supabase CLI
├── seed.sql                                    # بيانات demo (تُشغَّل بعد migrations)
├── README.md                                   # هذا الملف
└── migrations/
    ├── 20260415000001_schema.sql               # جداول + enums + indexes + views
    ├── 20260415000002_rls.sql                  # Row Level Security
    ├── 20260415000003_functions.sql            # RPCs (منطق العمل)
    └── 20260415000004_triggers.sql             # triggers (waitlist + sync)
```

---

## تشغيل محلي (بعد تثبيت Supabase CLI + Docker)

```bash
# 1) تثبيت CLI (مرة واحدة)
# Windows (via Scoop):
scoop install supabase
# أو npm (cross-platform):
npm i -g supabase

# 2) تشغيل كل الخدمات محلياً
cd path/to/project
supabase start
#   Docker يشغّل Postgres + PostgREST + GoTrue + Studio + Inbucket
#   سيُطبع في النهاية:
#     API URL: http://localhost:54321
#     DB URL:  postgresql://postgres:postgres@localhost:54322/postgres
#     Studio:  http://localhost:54323
#     anon key: eyJhbGci... (احفظه في .env.local)

# 3) تشغيل migrations + seed
supabase db reset
#   يحذف القاعدة ويُعيد تشغيل كل migration ثم seed.sql

# 4) نسخ المفاتيح إلى .env.local
cp .env.local.example .env.local
# ثم ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY من مخرجات supabase start
```

---

## بيانات الدخول التجريبية (بعد seed)

| الدور | البريد | كلمة المرور |
|------|-------|-------------|
| Admin | `admin@studio.com` | `admin123` |
| Trainer | `sara@studio.com` | `pass123` |
| Trainer | `noor@studio.com` | `pass123` |
| Trainer | `reem@studio.com` | `pass123` |
| Trainee | `fatima@email.com` | `pass123` |
| Trainee | `mona@email.com` | `pass123` |
| Trainee | `hanouf@email.com` | `pass123` |
| Trainee | `dalal@email.com` | `pass123` |
| Trainee | `rawan@email.com` | `pass123` |
| Trainee | `lama@email.com` (موقوفة) | `pass123` |

> ملاحظة: بدءاً من مرحلة Supabase الدخول سيكون بالإيميل بدل username (لأن Supabase Auth تعتمد email/phone). الـ username محفوظ في `profiles.username` للعرض فقط.

---

## نموذج البيانات

### جداول الأساس
| الجدول | الوصف |
|--------|-------|
| `profiles` | امتداد لـ `auth.users`: role, name, email, phone, username, status, prefs |
| `trainees` | بيانات متدربة: gender, birth_date, branch, level, notes, join_date |
| `trainers` | بيانات مدربة: specialty, branch, join_date |
| `branches` | الفروع |
| `session_types` | أنواع الجلسات (يوغا، تأمل، ...) |
| `club_settings` | إعدادات النادي (صف واحد: اسم، سياسة إلغاء، ...) |

### جداول العمليات
| الجدول | الوصف |
|--------|-------|
| `packages` | الباقات (عدد جلسات، مدة، سعر، حد يومي، أنواع مسموحة) |
| `subscriptions` | اشتراك متدربة بباقة: total, used, start, end, status (active/frozen/expired) |
| `sessions` | جلسة: trainer, branch, date, time, capacity, enrolled, status |
| `bookings` | حجز: trainee, session, status (confirmed/cancelled_*/attended/absent/late/waitlist) |
| `ledger_entries` | سجل حركة الرصيد (credit/debit) — شفافية كاملة للمتدربة |

### Views جاهزة للعرض
| العرض | الاستخدام |
|-------|-----------|
| `v_trainees_with_subscription` | قائمة المتدربات مع الباقة والرصيد — لـ Admin/Trainees |
| `v_sessions_detail` | الجلسات مع اسم المدربة والفرع — لكل الواجهات |
| `v_bookings_detail` | الحجوزات مع أسماء المتدربة/الجلسة/المدربة — لـ Admin/Bookings |

---

## RPCs (منطق العمل)

كل العمليات الذرّية تمرّ عبر RPC لضمان الاتساق. الواجهة تستدعيها بـ `supabase.rpc('function_name', { params })`.

### للمتدربة
| الدالة | الفعل |
|--------|-------|
| `book_session(p_session_id)` | حجز مع كل الفحوصات (الرصيد، السعة، التعارض، الحد اليومي) atomically |
| `cancel_booking(p_booking_id)` | إلغاء مع حساب ساعات السياسة + استرداد/عدم استرداد |

### للمدربة
| الدالة | الفعل |
|--------|-------|
| `mark_attendance(p_booking_id, p_state)` | حضر/غاب/متأخر — لجلساتها فقط |

### للإدارة
| الدالة | الفعل |
|--------|-------|
| `cancel_session(p_session_id)` | إلغاء جلسة + استرداد لكل المحجوزات |
| `assign_package(p_trainee, p_pkg, p_start)` | إسناد باقة + ledger credit |
| `freeze_subscription(p_trainee)` | تجميد اشتراك |
| `unfreeze_subscription(p_trainee)` | إعادة تفعيل |
| `extend_subscription(p_trainee, p_days)` | تمديد بأيام |
| `adjust_balance(p_trainee, p_delta, p_reason)` | ± يدوي للرصيد + ledger |
| `toggle_trainee_status(p_id)` | active ↔ suspended |
| `toggle_trainer_status(p_id)` | active ↔ inactive |
| `toggle_package_active(p_id)` | تفعيل/إيقاف الباقة |
| `cancel_booking(bk, true)` | إلغاء حجز مع استرداد دائم (إداري) |

### Helpers (تُستدعى داخل RLS)
| الدالة | الإخراج |
|--------|---------|
| `current_role()` | `user_role` |
| `is_admin()` | `boolean` |
| `is_trainer()` | `boolean` |
| `is_trainee()` | `boolean` |
| `current_balance(p_trainee)` | `integer` (من آخر سطر ledger) |
| `hours_until(p_date, p_time)` | `numeric` |

---

## Triggers

| Trigger | الهدف |
|---------|-------|
| `trg_promote_waitlist` (on `bookings` UPDATE status) | إلغاء حجز → أول waitlist يصبح confirmed تلقائياً |
| `trg_guard_booking_insert` (on `bookings` INSERT) | حماية إضافية: لا إدخال confirmed على جلسة مكتملة |
| `trg_sync_auth_email` (on `auth.users` UPDATE email) | مزامنة `profiles.email` |
| `touch_profiles_updated_at` | تحديث `updated_at` تلقائياً |
| `touch_club_settings_updated_at` | المثل |

---

## سياسات RLS (Row Level Security)

جميع الجداول فيها RLS مفعَّل. الأدوار الثلاثة:

### Admin
- يقرأ/يكتب كل شيء.

### Trainer
- يقرأ: جدوله، الحجوزات على جلساته، المتدربات اللواتي في جلساته، قوائم المراجع (branches, packages, session_types).
- يكتب: فقط `bookings.status` لجلساته (عبر `mark_attendance` RPC)، وبعض حقول ملفه (عبر `profiles_self_update`).
- **لا** يصل إلى `subscriptions` أو `ledger_entries`.

### Trainee
- يقرأ: ملفها، اشتراكها، حجوزاتها، سجل رصيدها (ledger)، الجلسات العامة، الباقات، الفروع، الإعدادات.
- يكتب: حقول ملف محدودة (phone, email, prefs) + تُنشئ حجز/إلغاء عبر RPC فقط.
- **لا** تقرأ بيانات متدربة أخرى.

---

## النشر إلى Supabase Hosted

```bash
# 1) أنشئ مشروع على supabase.com → احصل على Project Reference
supabase login
supabase link --project-ref <your-ref>

# 2) ارفع migrations
supabase db push

# 3) شغّل seed إن أردت بيانات demo (احذر: هذا يُضيف حسابات demo في production)
psql "$(supabase status --output json | jq -r '.db.url')" < supabase/seed.sql
# أو تجاوزه في production واستخدم Auth UI لإنشاء مستخدم admin يدوياً
```

---

## استخدام الـ RPCs من الـ Front-End

```typescript
// مثال: حجز جلسة
import { supabase } from '@/app/lib/supabase'

const { data: booking, error } = await supabase.rpc('book_session', {
  p_session_id: sessionId,
})
if (error) {
  // الـ PostgreSQL errcode=P0001 يُرفع مع رسالة عربية مقروءة من الـ RPC
  toast(error.message)
} else {
  toast('تم الحجز بنجاح')
}
```

```typescript
// مثال: إلغاء حجز
const { data, error } = await supabase.rpc('cancel_booking', {
  p_booking_id: bookingId,
  p_force_refund: false,  // أو true إذا الإلغاء إداري
})
```

```typescript
// مثال: إسناد باقة (Admin فقط)
const { data, error } = await supabase.rpc('assign_package', {
  p_trainee_id: traineeId,
  p_package_id: packageId,
  p_start_date: '2026-04-15',
})
```

---

## إعادة التشغيل النظيف

عند تطوير وترغب في إعادة الحالة:

```bash
supabase db reset   # يحذف كل شيء، يُعيد تشغيل migrations ثم seed
```

---

## خريطة الملفات إلى §7 في CLAUDE.md

| CLAUDE.md | الملف |
|-----------|--------|
| §7.1 Identity (profiles, trainees, trainers) | 001_schema.sql |
| §7.2 Packages, Subscriptions | 001_schema.sql |
| §7.3 Sessions, Bookings, Ledger | 001_schema.sql |
| §7.4 branches, session_types, club_settings | 001_schema.sql |
| §7.5 RLS Policies | 002_rls.sql |
| §7.6 RPCs | 003_functions.sql |
| §7.7 Triggers | 004_triggers.sql |
| — Demo data | seed.sql |
