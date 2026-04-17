-- ════════════════════════════════════════════════════════════════════════════
-- Phase B: Unified write RPCs — replace all direct table writes
-- ────────────────────────────────────────────────────────────────────────────
-- يوحّد مسار الكتابة عبر RPCs مع SECURITY DEFINER بحيث:
-- 1) كل فحص صلاحية (is_admin, auth.uid()) يحدث في مكان واحد
-- 2) الواجهة لا تحتاج RLS write permissions على الجداول الأصلية
-- 3) RLS policies يمكن أن تصبح "read-only" للمستخدمين غير الإداريين
-- ════════════════════════════════════════════════════════════════════════════

set search_path = public;

-- ════════════════════════════════════════════════════════════════════════════
-- 1) update_profile_self — تحديث الحقول الشخصية (الاسم/الهاتف/البريد)
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.update_profile_self(
  p_name  text default null,
  p_phone text default null,
  p_email text default null,
  p_prefs jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'غير مسجّل دخول' using errcode = 'P0001';
  end if;

  update public.profiles
     set name  = coalesce(nullif(trim(p_name),  ''), name),
         phone = coalesce(p_phone, phone),
         email = coalesce(nullif(trim(p_email), ''), email),
         prefs = coalesce(p_prefs, prefs)
   where id = v_user;
end;
$$;

grant execute on function public.update_profile_self(text, text, text, jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 2) update_trainer_profile_self — تحديث tablespecialty/branch للمدربة الحالية
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.update_trainer_profile_self(
  p_specialty text default null,
  p_branch_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'غير مسجّل دخول' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.trainers where id = v_user) then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.trainers
     set specialty = coalesce(p_specialty, specialty),
         branch_id = coalesce(p_branch_id, branch_id)
   where id = v_user;
end;
$$;

grant execute on function public.update_trainer_profile_self(text, uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3) SESSIONS — admin only
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.admin_insert_session(
  p_name       text,
  p_type       text,
  p_trainer_id uuid,
  p_branch_id  uuid,
  p_date       date,
  p_start_time time,
  p_end_time   time,
  p_capacity   integer,
  p_level      skill_level,
  p_notes      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  insert into public.sessions (
    name, type, trainer_id, branch_id, date, start_time, end_time,
    capacity, level, notes
  ) values (
    p_name, p_type, p_trainer_id, p_branch_id, p_date, p_start_time, p_end_time,
    p_capacity, p_level, p_notes
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_insert_session(text, text, uuid, uuid, date, time, time, integer, skill_level, text) to authenticated;

create or replace function public.admin_update_session(
  p_session_id uuid,
  p_name       text default null,
  p_type       text default null,
  p_trainer_id uuid default null,
  p_branch_id  uuid default null,
  p_date       date default null,
  p_start_time time default null,
  p_end_time   time default null,
  p_capacity   integer default null,
  p_level      skill_level default null,
  p_notes      text default null,
  p_status     session_status default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.sessions
     set name       = coalesce(p_name,       name),
         type       = coalesce(p_type,       type),
         trainer_id = coalesce(p_trainer_id, trainer_id),
         branch_id  = coalesce(p_branch_id,  branch_id),
         date       = coalesce(p_date,       date),
         start_time = coalesce(p_start_time, start_time),
         end_time   = coalesce(p_end_time,   end_time),
         capacity   = coalesce(p_capacity,   capacity),
         level      = coalesce(p_level,      level),
         notes      = coalesce(p_notes,      notes),
         status     = coalesce(p_status,     status)
   where id = p_session_id;

  if not found then
    raise exception 'الجلسة غير موجودة' using errcode = 'P0001';
  end if;
end;
$$;

grant execute on function public.admin_update_session(uuid, text, text, uuid, uuid, date, time, time, integer, skill_level, text, session_status) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 4) PACKAGES — admin only
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.admin_insert_package(
  p_name               text,
  p_description        text,
  p_sessions           integer,
  p_duration_days      integer,
  p_price              numeric,
  p_cancellation_hours integer,
  p_daily_limit        integer,
  p_session_types      text[],
  p_level              skill_level,
  p_renewable          boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  insert into public.packages (
    name, description, sessions, duration_days, price,
    cancellation_hours, daily_limit, session_types, level, renewable, is_active
  ) values (
    p_name, p_description, p_sessions, p_duration_days, p_price,
    p_cancellation_hours, p_daily_limit, p_session_types, p_level, p_renewable, true
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_insert_package(text, text, integer, integer, numeric, integer, integer, text[], skill_level, boolean) to authenticated;

create or replace function public.admin_update_package(
  p_package_id         uuid,
  p_name               text default null,
  p_description        text default null,
  p_sessions           integer default null,
  p_duration_days      integer default null,
  p_price              numeric default null,
  p_cancellation_hours integer default null,
  p_daily_limit        integer default null,
  p_session_types      text[] default null,
  p_level              skill_level default null,
  p_renewable          boolean default null,
  p_is_active          boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.packages
     set name               = coalesce(p_name,               name),
         description        = coalesce(p_description,        description),
         sessions           = coalesce(p_sessions,           sessions),
         duration_days      = coalesce(p_duration_days,      duration_days),
         price              = coalesce(p_price,              price),
         cancellation_hours = coalesce(p_cancellation_hours, cancellation_hours),
         daily_limit        = coalesce(p_daily_limit,        daily_limit),
         session_types      = coalesce(p_session_types,      session_types),
         level              = coalesce(p_level,              level),
         renewable          = coalesce(p_renewable,          renewable),
         is_active          = coalesce(p_is_active,          is_active)
   where id = p_package_id;

  if not found then
    raise exception 'الباقة غير موجودة' using errcode = 'P0001';
  end if;
end;
$$;

grant execute on function public.admin_update_package(uuid, text, text, integer, integer, numeric, integer, integer, text[], skill_level, boolean, boolean) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 5) BRANCHES — admin only
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.admin_insert_branch(
  p_name    text,
  p_address text default null,
  p_phone   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  insert into public.branches (name, address, phone)
  values (p_name, p_address, p_phone)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_insert_branch(text, text, text) to authenticated;

create or replace function public.admin_delete_branch(p_branch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  delete from public.branches where id = p_branch_id;

  if not found then
    raise exception 'الفرع غير موجود' using errcode = 'P0001';
  end if;
end;
$$;

grant execute on function public.admin_delete_branch(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 6) SESSION TYPES — admin only
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.admin_insert_session_type(
  p_name text,
  p_icon text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  insert into public.session_types (name, icon)
  values (p_name, p_icon)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_insert_session_type(text, text) to authenticated;

create or replace function public.admin_delete_session_type(p_type_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  delete from public.session_types where id = p_type_id;

  if not found then
    raise exception 'نوع الجلسة غير موجود' using errcode = 'P0001';
  end if;
end;
$$;

grant execute on function public.admin_delete_session_type(uuid) to authenticated;
