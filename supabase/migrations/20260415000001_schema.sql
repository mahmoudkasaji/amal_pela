-- ════════════════════════════════════════════════════════════════════════════
-- Serene Studio — Schema
-- ────────────────────────────────────────────────────────────────────────────
-- يُنشئ كل الجداول، الـ enums، القيود، والفهارس.
-- لا يحتوي أي RLS ولا أي دوال — هذه في ملفات لاحقة.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";        -- case-insensitive email/username

-- ════════════════════════════════════════════════════════════════════════════
-- 1) ENUMS — أنواع مُقيَّدة على مستوى قاعدة البيانات
-- ════════════════════════════════════════════════════════════════════════════

create type user_role          as enum ('admin', 'trainer', 'trainee');
create type account_status     as enum ('active', 'suspended', 'inactive');
create type skill_level        as enum ('beginner', 'intermediate', 'advanced', 'all');
create type gender_kind        as enum ('male', 'female');
create type subscription_status as enum ('active', 'expired', 'frozen');
create type session_status     as enum ('open', 'full', 'cancelled', 'completed');
create type booking_status     as enum (
  'confirmed',
  'cancelled_with_refund',
  'cancelled_no_refund',
  'attended',
  'absent',
  'late',
  'waitlist'
);
create type ledger_type        as enum ('credit', 'debit');

-- ════════════════════════════════════════════════════════════════════════════
-- 2) REFERENCE TABLES — ثوابت قابلة للتعديل من الإدارة
-- ════════════════════════════════════════════════════════════════════════════

-- الفروع: تستخدم في profile/trainer/session
create table public.branches (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  address     text,
  phone       text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- أنواع الجلسات (يوغا، تأمل، ...) — تحلّ القوائم الثابتة في الواجهة
create table public.session_types (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  icon        text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- الإعدادات العامة للنادي (صف وحيد singleton)
create table public.club_settings (
  id                    integer primary key default 1 check (id = 1),
  club_name             text        not null default 'استوديو سيرين',
  email                 text,
  phone                 text,
  website               text,
  -- السياسة العامة للإلغاء (مُستخدَمة عند عدم وجود package.cancellation_hours)
  cancellation_hours    integer     not null default 3 check (cancellation_hours >= 0),
  cancellation_message  text        default 'يسمح بالإلغاء قبل 3 ساعات من الجلسة مع استرداد كامل.',
  notification_prefs    jsonb       not null default '{}'::jsonb,
  updated_at            timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- 3) IDENTITY — profiles يمتد من auth.users
-- ════════════════════════════════════════════════════════════════════════════

-- الجدول الأساسي لكل المستخدمين — role-agnostic
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  role        user_role   not null,
  name        text        not null,
  email       citext      not null,
  phone       text,
  username    citext      unique,
  status      account_status not null default 'active',
  prefs       jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);

-- Satellite table: بيانات خاصة بالمتدربة
create table public.trainees (
  id          uuid        primary key references public.profiles(id) on delete cascade,
  gender      gender_kind,
  birth_date  date,
  branch_id   uuid        references public.branches(id) on delete set null,
  level       skill_level not null default 'beginner',
  notes       text,
  join_date   date        not null default current_date
);

-- Satellite table: بيانات خاصة بالمدربة
create table public.trainers (
  id          uuid        primary key references public.profiles(id) on delete cascade,
  specialty   text,
  branch_id   uuid        references public.branches(id) on delete set null,
  join_date   date        not null default current_date
);

-- ════════════════════════════════════════════════════════════════════════════
-- 4) PACKAGES & SUBSCRIPTIONS
-- ════════════════════════════════════════════════════════════════════════════

create table public.packages (
  id                 uuid         primary key default gen_random_uuid(),
  name               text         not null,
  description        text,
  -- sessions = 999 تعني باقة مفتوحة/غير محدودة
  sessions           integer      not null check (sessions > 0),
  is_unlimited       boolean      generated always as (sessions = 999) stored,
  duration_days      integer      not null check (duration_days > 0),
  price              numeric(10,2) not null check (price >= 0),
  cancellation_hours integer      not null default 3 check (cancellation_hours >= 0),
  daily_limit        integer      not null default 1 check (daily_limit > 0),
  session_types      text[]       not null default '{}',
  level              skill_level  not null default 'all',
  renewable          boolean      not null default true,
  is_active          boolean      not null default true,
  created_at         timestamptz  not null default now()
);

create index idx_packages_active on public.packages(is_active);

create table public.subscriptions (
  id              uuid                 primary key default gen_random_uuid(),
  trainee_id      uuid                 not null references public.trainees(id) on delete cascade,
  package_id      uuid                 not null references public.packages(id)  on delete restrict,
  total_sessions  integer              not null check (total_sessions >= 0),
  used_sessions   integer              not null default 0 check (used_sessions >= 0),
  start_date      date                 not null,
  end_date        date                 not null,
  status          subscription_status  not null default 'active',
  frozen_at       timestamptz,
  created_at      timestamptz          not null default now(),
  constraint valid_dates check (end_date >= start_date),
  -- باقة مفتوحة total=999 لا يُطبَّق فيها قيد used <= total
  constraint balance_sane check (total_sessions = 999 or used_sessions <= total_sessions)
);

create index idx_subscriptions_trainee on public.subscriptions(trainee_id);
create index idx_subscriptions_status  on public.subscriptions(status);

-- كل متدربة لها اشتراك فعّال واحد في وقت معين
create unique index one_active_sub_per_trainee
  on public.subscriptions (trainee_id)
  where status = 'active';

-- ════════════════════════════════════════════════════════════════════════════
-- 5) SESSIONS & BOOKINGS — قلب النظام
-- ════════════════════════════════════════════════════════════════════════════

create table public.sessions (
  id          uuid           primary key default gen_random_uuid(),
  name        text           not null,
  type        text           not null,    -- مرجع اسم من session_types.name
  trainer_id  uuid           not null references public.trainers(id) on delete restrict,
  branch_id   uuid           not null references public.branches(id) on delete restrict,
  date        date           not null,
  start_time  time           not null,
  end_time    time           not null,
  capacity    integer        not null check (capacity > 0),
  enrolled    integer        not null default 0 check (enrolled >= 0),
  status      session_status not null default 'open',
  level       skill_level    not null default 'all',
  notes       text,
  created_at  timestamptz    not null default now(),
  constraint valid_time_window   check (start_time < end_time),
  constraint enrolled_le_capacity check (enrolled <= capacity)
);

create index idx_sessions_date         on public.sessions(date);
create index idx_sessions_trainer_date on public.sessions(trainer_id, date);
create index idx_sessions_status       on public.sessions(status);

create table public.bookings (
  id                  uuid           primary key default gen_random_uuid(),
  trainee_id          uuid           not null references public.trainees(id) on delete cascade,
  session_id          uuid           not null references public.sessions(id) on delete cascade,
  status              booking_status not null default 'confirmed',
  session_deducted    boolean        not null default true,
  waitlist_position   integer,
  created_at          timestamptz    not null default now(),
  cancelled_at        timestamptz,
  attended_marked_at  timestamptz,
  attended_by         uuid           references public.profiles(id),
  constraint waitlist_has_position
    check (status <> 'waitlist' or waitlist_position is not null)
);

create index idx_bookings_trainee on public.bookings(trainee_id, status);
create index idx_bookings_session on public.bookings(session_id, status);

-- متدربة واحدة لا يمكن أن يكون لها حجزان مؤكدان في نفس الجلسة
create unique index one_confirmed_booking_per_session
  on public.bookings (trainee_id, session_id)
  where status = 'confirmed';

-- ════════════════════════════════════════════════════════════════════════════
-- 6) LEDGER — سجل حركة الرصيد (بالغ الأهمية: شفافية كاملة للمتدربة والإدارة)
-- ════════════════════════════════════════════════════════════════════════════

create table public.ledger_entries (
  id                  uuid         primary key default gen_random_uuid(),
  trainee_id          uuid         not null references public.trainees(id) on delete cascade,
  subscription_id     uuid         references public.subscriptions(id) on delete set null,
  entry_date          date         not null default current_date,
  type                ledger_type  not null,
  amount              integer      not null check (amount > 0),
  reason              text         not null,
  balance_after       integer      not null,
  source_booking_id   uuid         references public.bookings(id) on delete set null,
  created_at          timestamptz  not null default now()
);

create index idx_ledger_trainee      on public.ledger_entries(trainee_id, created_at desc);
create index idx_ledger_source_book  on public.ledger_entries(source_booking_id);

-- ════════════════════════════════════════════════════════════════════════════
-- 7) VIEWS — اختصارات للقراءة من الواجهة
-- ════════════════════════════════════════════════════════════════════════════

-- قائمة المتدربات مع باقتها الحالية (اشتراك active فقط)
-- security_invoker=true ⇒ تُطبَّق RLS على الجداول الأساسية حسب المستخدم المُستدعي
-- (Postgres 15+ default هو security_definer الذي يتجاوز RLS — نحن نريد العكس)
create view public.v_trainees_with_subscription with (security_invoker = true) as
select
  p.id,
  p.name,
  p.email,
  p.phone,
  p.username,
  p.status             as account_status,
  t.gender,
  t.birth_date,
  t.level,
  t.branch_id,
  t.notes,
  t.join_date,
  s.id                 as subscription_id,
  s.package_id,
  pkg.name             as package_name,
  s.total_sessions,
  s.used_sessions,
  case
    when s.total_sessions = 999 then null
    else s.total_sessions - s.used_sessions
  end                  as remaining_sessions,
  s.start_date,
  s.end_date,
  s.status             as subscription_status
from public.profiles p
join public.trainees t on t.id = p.id
left join public.subscriptions s on s.trainee_id = t.id and s.status = 'active'
left join public.packages pkg on pkg.id = s.package_id
where p.role = 'trainee';

-- الجلسات مع تفاصيل المدرّبة والفرع (جاهزة للعرض)
create view public.v_sessions_detail with (security_invoker = true) as
select
  s.id,
  s.name,
  s.type,
  s.date,
  s.start_time,
  s.end_time,
  s.capacity,
  s.enrolled,
  s.status,
  s.level,
  s.notes,
  s.trainer_id,
  p.name       as trainer_name,
  s.branch_id,
  b.name       as branch_name
from public.sessions s
join public.trainers tr on tr.id = s.trainer_id
join public.profiles p  on p.id  = tr.id
join public.branches b  on b.id  = s.branch_id;

-- الحجوزات مع تفاصيل المتدربة والجلسة (جاهزة للعرض في Admin/Bookings)
create view public.v_bookings_detail with (security_invoker = true) as
select
  bk.id,
  bk.status,
  bk.session_deducted,
  bk.created_at,
  bk.cancelled_at,
  bk.attended_marked_at,
  bk.waitlist_position,
  bk.trainee_id,
  tp.name            as trainee_name,
  bk.session_id,
  s.name             as session_name,
  s.date,
  s.start_time       as time,
  s.trainer_id,
  trp.name           as trainer_name,
  s.branch_id,
  br.name            as branch_name
from public.bookings bk
join public.sessions s     on s.id = bk.session_id
join public.profiles tp    on tp.id = bk.trainee_id
join public.trainers tr    on tr.id = s.trainer_id
join public.profiles trp   on trp.id = tr.id
join public.branches br    on br.id = s.branch_id;

-- ════════════════════════════════════════════════════════════════════════════
-- 8) AUTO-UPDATE TIMESTAMPS
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_touch_updated_at();

create trigger touch_club_settings_updated_at
  before update on public.club_settings
  for each row execute function public.tg_touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- نهاية مخطط الإصدار 1
-- ────────────────────────────────────────────────────────────────────────────
