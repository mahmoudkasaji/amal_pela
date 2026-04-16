# Supabase Migrations — ترتيب وتنظيم

هذا الدليل يشرح ترتيب تطبيق الترحيلات (migrations) والدور الذي تلعبه كل واحدة منها.

---

## الترتيب الصحيح للتطبيق

يجب تطبيق الترحيلات بترتيب الأسماء (الأقدم أولاً)، لأن الأحدث يعتمد على الأقدم.

### Core migrations — البنية الأساسية (2026-04-15)

| # | الملف | الوصف |
|---|------|-------|
| 001 | `20260415000001_schema.sql` | الجداول، enums، فهارس، views |
| 002 | `20260415000002_rls.sql` | سياسات Row-Level Security |
| 003 | `20260415000003_functions.sql` | RPCs (منطق العمل) |
| 004 | `20260415000004_triggers.sql` | Triggers (مزامنة email, promote waitlist) |
| 005 | `20260415000005_auth_helpers.sql` | `resolve_login_email` للدخول باسم المستخدم |
| 006 | `20260415000006_admin_create_accounts.sql` | `admin_create_trainee/trainer` v1 |
| 007 | `20260415000007_fix_create_accounts.sql` | إصلاح توقيع create accounts |

### Bug fix migrations (2026-04-16)

| # | الملف | السبب |
|---|------|-------|
| 008 | `20260416000001_fix_pgcrypto_path.sql` | `pgcrypto` في schema `extensions` (ليس `public`) |
| 009 | `20260416000002_fix_subscription_rpcs.sql` | قيد `amount >= 0` + type casting في adjust_balance |
| 010 | `20260416000003_fix_create_accounts.sql` | إصلاح نهائي لترتيب معاملات create accounts |

### Production-readiness migrations (2026-04-16)

| # | الملف | الإضافة |
|---|------|-------|
| 011 | `20260416100001_security_hardening.sql` | إغلاق ثغرة تعداد المستخدمين + `hours_until` STABLE + `mark_attendance` يرفض إن لم يكن confirmed |
| 012 | `20260416100002_db_integrity_fixes.sql` | `CASCADE → RESTRICT` على bookings/ledger + فهارس مفقودة + FK على `sessions.type` |
| 013 | `20260416100003_subscription_expiry.sql` | `expire_subscriptions()` لتشغيل pg_cron |
| 014 | `20260416100004_admin_update_rpcs.sql` | `admin_update_trainee/trainer` لإزالة الكتابة المباشرة من الـ store |

---

## كيفية التطبيق

### على بيئة محلية (Supabase CLI + Docker)
```bash
cd supabase
supabase db reset
# يحذف القاعدة ويُطبق كل الترحيلات بالترتيب ثم seed.sql
```

### على بيئة إنتاجية (Supabase Hosted)
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### يدوياً عبر Management API
انظر الأمثلة في `docs/` أو استخدم Supabase Dashboard → SQL Editor.

---

## قواعد الـ Idempotency

كل الترحيلات يجب أن تكون **قابلة للتطبيق مرتين بدون كسر**:
- استخدم `CREATE OR REPLACE FUNCTION ...`
- استخدم `CREATE INDEX IF NOT EXISTS ...`
- استخدم `DROP CONSTRAINT IF EXISTS ...` قبل إعادة إنشائه
- لا تستخدم `CREATE TABLE` بدون `IF NOT EXISTS` إلا في schema الأولي

### الاستثناءات المعروفة
- `001_schema.sql` يُنشئ جداول جديدة بـ `create table` بدون `IF NOT EXISTS` — لا يُفترض تطبيقه مرتين (يُستخدم `supabase db reset` لإعادة البدء).

---

## ملخص "fix" migrations

نسبة الـ fixes الحالية: **6 من 14 (~43%)** — تعكس فترة تطوير نشطة حيث طرأت إصلاحات لاحقة. كل fix موثّق داخلياً بتعليقات تشرح السبب.

### توصيات مستقبلية
- قبل الإنتاج الأول للعميل: قد تُدمج كل الترحيلات الحالية في **baseline واحد** نظيف (ملف `000_baseline.sql`) + `seed.sql`. نترك القرار للوقت المناسب.
- كل migration جديد بعد هذه النقطة يجب أن يحمل رقم YYYYMMDDHHMMSS ويكون متراكماً (غير قابل للحذف من التاريخ).

---

## التحقق السريع

```bash
# عدد الترحيلات المطبقة في DB الحالية
psql "$DATABASE_URL" -c "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;"

# مقارنة مع الملفات المحلية
ls supabase/migrations/*.sql | wc -l
```
