-- ════════════════════════════════════════════════════════════════════════════
-- Security hardening — Phase 1.3
-- ────────────────────────────────────────────────────────────────────────────
-- 1) resolve_login_email: دائماً تُرجع قيمة (لمنع تعداد المستخدمين)
--    إذا لم يُوجد الـ username، تُرجع بريد وهمي فيفشل signInWithPassword
--    بنفس رسالة الخطأ مما يمنع الكشف عن وجود الحساب.
-- 2) hours_until: تصحيح من IMMUTABLE إلى STABLE
-- 3) mark_attendance: فحص أن الحجز confirmed قبل التسجيل
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1) resolve_login_email — anti-enumeration ──────────────────────────────

create or replace function public.resolve_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select email::text from public.profiles where username = p_username::citext limit 1),
    'noreply_' || md5(p_username || current_timestamp::text) || '@invalid.local'
  )
$$;

-- ─── 2) hours_until — fix IMMUTABLE (uses now()) ───────────────────────────

create or replace function public.hours_until(p_date date, p_time time)
returns numeric
language sql
stable
security invoker
as $$
  select extract(epoch from ((p_date + p_time) - now())) / 3600.0
$$;

-- ─── 3) mark_attendance — verify booking is confirmed before marking ───────

create or replace function public.mark_attendance(
  p_booking_id uuid,
  p_state      text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking record;
begin
  -- validate state
  if p_state not in ('attended','absent','late') then
    raise exception 'حالة غير صالحة: %', p_state;
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'الحجز غير موجود';
  end if;

  -- only confirmed bookings can be marked
  if v_booking.status <> 'confirmed' then
    raise exception 'لا يمكن تسجيل الحضور لحجز بحالة: %', v_booking.status;
  end if;

  update public.bookings
     set status = p_state::booking_status,
         attended_marked_at = now()
   where id = p_booking_id;
end;
$$;
