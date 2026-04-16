-- ════════════════════════════════════════════════════════════════════════════
-- Serene Studio — Row Level Security
-- ────────────────────────────────────────────────────────────────────────────
-- يضبط من يستطيع قراءة/كتابة كل جدول حسب الدور:
-- - admin:   يقرأ/يكتب كل شيء
-- - trainer: يقرأ جلساته والمتدربات المسجلات فيها، يُسجّل الحضور فقط
-- - trainee: يقرأ نفسه فقط (بياناته، اشتراكه، حجوزاته، ledger)
--
-- مبدأ جوهري: **لا تُدخَل الحجوزات مباشرة**؛ كلّ العمليات تمرّ عبر RPCs
-- ذات SECURITY DEFINER (في الملف 003) لتضمن الاتساق الذرّي.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Helper functions (يُستدعَون داخل السياسات) ──────────────────────────

-- يُعيد دور المستخدم الحالي (من جدول profiles)
-- ملاحظة: نستخدم اسم app_current_role لتفادي التعارض مع current_role المدمجة في Postgres
-- (تضارب قد يُسبب فشل GoTrue عند تسجيل الدخول).
create or replace function public.app_current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- اختصار: هل المستخدم الحالي admin؟
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- اختصار: هل المستخدم الحالي مدربة؟
create or replace function public.is_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'trainer' from public.profiles where id = auth.uid()), false)
$$;

-- اختصار: هل المستخدم الحالي متدربة؟
create or replace function public.is_trainee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'trainee' from public.profiles where id = auth.uid()), false)
$$;

-- منح صلاحية تنفيذ الـ helpers للجميع
grant execute on function public.app_current_role() to authenticated, anon;
grant execute on function public.is_admin()         to authenticated, anon;
grant execute on function public.is_trainer()       to authenticated, anon;
grant execute on function public.is_trainee()       to authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════════
-- ENABLE RLS على كل الجداول العامة
-- ════════════════════════════════════════════════════════════════════════════

alter table public.branches         enable row level security;
alter table public.session_types    enable row level security;
alter table public.club_settings    enable row level security;
alter table public.profiles         enable row level security;
alter table public.trainees         enable row level security;
alter table public.trainers         enable row level security;
alter table public.packages         enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.sessions         enable row level security;
alter table public.bookings         enable row level security;
alter table public.ledger_entries   enable row level security;

-- ════════════════════════════════════════════════════════════════════════════
-- BRANCHES — الجميع يقرأ، Admin يكتب
-- ════════════════════════════════════════════════════════════════════════════

create policy "branches_read_all"
  on public.branches for select
  to authenticated
  using (true);

create policy "branches_admin_write"
  on public.branches for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- SESSION_TYPES — الجميع يقرأ، Admin يكتب
-- ════════════════════════════════════════════════════════════════════════════

create policy "session_types_read_all"
  on public.session_types for select
  to authenticated
  using (true);

create policy "session_types_admin_write"
  on public.session_types for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- CLUB_SETTINGS — الجميع يقرأ، Admin يكتب
-- ════════════════════════════════════════════════════════════════════════════

create policy "club_settings_read_all"
  on public.club_settings for select
  to authenticated
  using (true);

create policy "club_settings_admin_write"
  on public.club_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- PROFILES
-- - المستخدم يقرأ ملفه.
-- - Admin يقرأ الكل.
-- - المدربة تقرأ ملفات المتدربات فقط (لتعرف أسماءهن في الحجوزات).
-- - المستخدم يعدّل بعض حقوله (name, phone, prefs). الدور/الحالة لا تُعدَّل إلا من Admin.
-- ════════════════════════════════════════════════════════════════════════════

create policy "profiles_self_read"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_admin_read_all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_trainer_read_trainees"
  on public.profiles for select
  to authenticated
  using (public.is_trainer() and role = 'trainee');

-- الجميع يقرأ ملفات المدربات (أسماؤهن تظهر في كل الواجهات)
create policy "profiles_read_trainers"
  on public.profiles for select
  to authenticated
  using (role = 'trainer');

-- المستخدم يعدّل ملفه (الحقول المحمية مثل role/status يمنعها trigger في 004)
create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_write"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- TRAINEES — بيانات تفصيلية للمتدربات
-- ════════════════════════════════════════════════════════════════════════════

create policy "trainees_self_read"
  on public.trainees for select
  to authenticated
  using (id = auth.uid());

create policy "trainees_admin_read_all"
  on public.trainees for select
  to authenticated
  using (public.is_admin());

-- المدربة تقرأ بيانات المتدربات اللواتي لهن حجوزات في جلساتها
create policy "trainees_trainer_read_in_sessions"
  on public.trainees for select
  to authenticated
  using (
    public.is_trainer()
    and exists (
      select 1
      from public.bookings b
      join public.sessions s on s.id = b.session_id
      where b.trainee_id = public.trainees.id
        and s.trainer_id = auth.uid()
    )
  );

-- المتدربة تعدّل بيانات ملفها (الحقول المحمية level/branch/notes يمنعها trigger)
create policy "trainees_self_update"
  on public.trainees for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "trainees_admin_write"
  on public.trainees for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- TRAINERS
-- ════════════════════════════════════════════════════════════════════════════

create policy "trainers_read_all"
  on public.trainers for select
  to authenticated
  using (true);  -- معلومات المدربات عامة داخل النظام

create policy "trainers_admin_write"
  on public.trainers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- PACKAGES — الجميع يقرأ، Admin يكتب
-- ════════════════════════════════════════════════════════════════════════════

create policy "packages_read_all"
  on public.packages for select
  to authenticated
  using (true);

create policy "packages_admin_write"
  on public.packages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS
-- - المتدربة تقرأ اشتراكها فقط.
-- - Admin يقرأ/يكتب الكل.
-- - Trainer لا وصول لها (لا يحتاجها لعمله).
-- ════════════════════════════════════════════════════════════════════════════

create policy "subs_self_read"
  on public.subscriptions for select
  to authenticated
  using (trainee_id = auth.uid());

create policy "subs_admin_all"
  on public.subscriptions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- SESSIONS — الجميع يقرأ، Admin يكتب
-- (المدربة لا تُنشئ جلسات من واجهتها، لكنها تقرأها للجدول)
-- ════════════════════════════════════════════════════════════════════════════

create policy "sessions_read_all"
  on public.sessions for select
  to authenticated
  using (true);

create policy "sessions_admin_write"
  on public.sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- BOOKINGS — الأكثر حساسية
-- ـ قراءة:
--   • المتدربة تقرأ حجوزاتها فقط
--   • المدربة تقرأ حجوزات جلساتها
--   • Admin يقرأ الكل
-- ـ كتابة: ممنوعة مباشرة لكل الأدوار (انظر ملاحظة RPC أسفل).
--   الاستثناء الوحيد: مدربة تُحدِّث `status` إلى حضر/غاب/متأخر عبر RPC.
-- ════════════════════════════════════════════════════════════════════════════

create policy "bookings_trainee_read_self"
  on public.bookings for select
  to authenticated
  using (trainee_id = auth.uid());

create policy "bookings_trainer_read_own_sessions"
  on public.bookings for select
  to authenticated
  using (
    exists (
      select 1 from public.sessions s
      where s.id = bookings.session_id
        and s.trainer_id = auth.uid()
    )
  );

create policy "bookings_admin_read_all"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

-- كتابة عامة: Admin فقط (لكن العادي يمرّ عبر RPCs). هذا fallback آمن.
create policy "bookings_admin_write"
  on public.bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- LEDGER_ENTRIES
-- ════════════════════════════════════════════════════════════════════════════

create policy "ledger_self_read"
  on public.ledger_entries for select
  to authenticated
  using (trainee_id = auth.uid());

create policy "ledger_admin_read_all"
  on public.ledger_entries for select
  to authenticated
  using (public.is_admin());

-- لا يكتب أحد مباشرةً — كل الكتابة عبر RPCs (SECURITY DEFINER تتجاوز RLS).
create policy "ledger_admin_write_override"
  on public.ledger_entries for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- ملاحظة مهمة:
-- كل الـ RPCs في الملف 003 مُعلَّنة SECURITY DEFINER وبالتالي تتجاوز RLS.
-- هذا مقصود: المنطق التجاري (حجز، إلغاء، إسناد باقة...) يُنفَّذ ذرّياً داخل
-- الدالة بعد تحقّقها من هوية المستدعي وصلاحياته. RLS هنا هو الخط الدفاعي
-- الثاني لو حاول أحدهم الوصول للجداول مباشرة عبر REST API.
-- ────────────────────────────────────────────────────────────────────────────
