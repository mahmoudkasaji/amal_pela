-- ════════════════════════════════════════════════════════════════════════════
-- Serene Studio — Business Logic (RPCs)
-- ────────────────────────────────────────────────────────────────────────────
-- كل منطق العمل مُركَّز هنا. الواجهة تستدعي الدوال فقط عبر supabase.rpc(...)
-- كل الدوال SECURITY DEFINER: تتجاوز RLS بعد التحقق من الصلاحيات داخلياً.
-- ترفع أخطاءً واضحة بالعربية لتُعرَض مباشرةً في الواجهة.
-- ════════════════════════════════════════════════════════════════════════════

set search_path = public;

-- ════════════════════════════════════════════════════════════════════════════
-- HELPERS — دوال مساعدة داخلية
-- ════════════════════════════════════════════════════════════════════════════

-- عدد الساعات بين الآن وبداية جلسة (date + time). قد يكون سالباً.
create or replace function public.hours_until(p_date date, p_start_time time)
returns numeric
language sql
immutable
as $$
  select extract(epoch from ((p_date + p_start_time) - now())) / 3600.0
$$;

-- الرصيد الحالي للمتدربة (من آخر سطر ledger — أو 0 إن لم توجد أي حركة)
create or replace function public.current_balance(p_trainee uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select balance_after
       from public.ledger_entries
       where trainee_id = p_trainee
       order by created_at desc
       limit 1),
    0
  )
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 1) book_session — حجز جلسة (كل المنطق ذري في transaction واحد)
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.book_session(p_session_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainee_id  uuid := auth.uid();
  v_trainee     public.trainees%rowtype;
  v_profile     public.profiles%rowtype;
  v_session     public.sessions%rowtype;
  v_sub         public.subscriptions%rowtype;
  v_pkg         public.packages%rowtype;
  v_conflict    integer;
  v_same_day    integer;
  v_new         public.bookings%rowtype;
  v_unlimited   boolean;
  v_balance     integer;
begin
  -- قفل الصف لمنع السباق (race condition) عند حجز متعدد على نفس الجلسة
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then
    raise exception 'الجلسة غير موجودة' using errcode = 'P0001';
  end if;

  -- التحقق من هوية المتدربة
  select * into v_profile from public.profiles where id = v_trainee_id;
  if not found or v_profile.role <> 'trainee' then
    raise exception 'غير مسموح: هذه العملية للمتدربات فقط' using errcode = 'P0001';
  end if;
  if v_profile.status <> 'active' then
    raise exception 'الحساب موقوف' using errcode = 'P0001';
  end if;

  select * into v_trainee from public.trainees where id = v_trainee_id;

  -- الاشتراك الفعّال
  select * into v_sub from public.subscriptions
   where trainee_id = v_trainee_id and status = 'active'
   for update;
  if not found then
    raise exception 'لا توجد باقة فعالة' using errcode = 'P0001';
  end if;
  if v_sub.end_date < current_date then
    raise exception 'انتهت صلاحية الباقة' using errcode = 'P0001';
  end if;

  select * into v_pkg from public.packages where id = v_sub.package_id;
  v_unlimited := v_sub.total_sessions = 999;

  -- الرصيد
  if not v_unlimited and (v_sub.total_sessions - v_sub.used_sessions) <= 0 then
    raise exception 'لا يوجد رصيد متبقٍ' using errcode = 'P0001';
  end if;

  -- حالة الجلسة والسعة
  if v_session.status = 'cancelled' then
    raise exception 'الجلسة ملغاة' using errcode = 'P0001';
  end if;
  if v_session.status = 'completed' then
    raise exception 'الجلسة منتهية' using errcode = 'P0001';
  end if;
  if v_session.enrolled >= v_session.capacity then
    raise exception 'الجلسة مكتملة' using errcode = 'P0001';
  end if;

  -- تكرار الحجز
  if exists (
    select 1 from public.bookings
    where trainee_id = v_trainee_id
      and session_id = p_session_id
      and status = 'confirmed'
  ) then
    raise exception 'محجوزة بالفعل' using errcode = 'P0001';
  end if;

  -- تعارض زمني (نفس اليوم، نافذة متداخلة)
  select count(*) into v_conflict
    from public.bookings b
    join public.sessions s on s.id = b.session_id
   where b.trainee_id = v_trainee_id
     and b.status = 'confirmed'
     and s.date = v_session.date
     and s.start_time < v_session.end_time
     and v_session.start_time < s.end_time;
  if v_conflict > 0 then
    raise exception 'لديك جلسة أخرى في نفس الوقت' using errcode = 'P0001';
  end if;

  -- تجاوز الحد اليومي للباقة
  select count(*) into v_same_day
    from public.bookings b
    join public.sessions s on s.id = b.session_id
   where b.trainee_id = v_trainee_id
     and b.status = 'confirmed'
     and s.date = v_session.date;
  if v_same_day >= v_pkg.daily_limit then
    raise exception 'لا يمكن تجاوز % جلسة في اليوم', v_pkg.daily_limit using errcode = 'P0001';
  end if;

  -- ═══ كل الفحوصات مرّت — تنفيذ العملية ═══

  -- 1) إنشاء الحجز
  insert into public.bookings (trainee_id, session_id, status, session_deducted)
  values (v_trainee_id, p_session_id, 'confirmed', not v_unlimited)
  returning * into v_new;

  -- 2) زيادة enrolled + تحديث الحالة إذا امتلأت
  update public.sessions
     set enrolled = enrolled + 1,
         status   = case when enrolled + 1 >= capacity then 'full'::session_status else status end
   where id = p_session_id;

  -- 3) خصم جلسة من الباقة إن لم تكن مفتوحة
  if not v_unlimited then
    update public.subscriptions
       set used_sessions = used_sessions + 1
     where id = v_sub.id;

    -- 4) تسجيل حركة ledger
    v_balance := public.current_balance(v_trainee_id) - 1;
    insert into public.ledger_entries
      (trainee_id, subscription_id, type, amount, reason, balance_after, source_booking_id)
    values
      (v_trainee_id, v_sub.id, 'debit', 1, 'حجز: ' || v_session.name, v_balance, v_new.id);
  end if;

  return v_new;
end;
$$;

grant execute on function public.book_session(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 2) cancel_booking — إلغاء حجز مع حساب ساعات السياسة
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.cancel_booking(
  p_booking_id   uuid,
  p_force_refund boolean default false
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking     public.bookings%rowtype;
  v_session     public.sessions%rowtype;
  v_sub         public.subscriptions%rowtype;
  v_pkg         public.packages%rowtype;
  v_hours       numeric;
  v_refund      boolean;
  v_new_status  booking_status;
  v_balance     integer;
  v_is_admin    boolean := public.is_admin();
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'الحجز غير موجود' using errcode = 'P0001';
  end if;

  -- تحقُّق الملكية: المتدربة تلغي حجزها، أو Admin
  if v_booking.trainee_id <> auth.uid() and not v_is_admin then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  if v_booking.status <> 'confirmed' then
    raise exception 'لا يمكن إلغاء هذا الحجز (حالته: %)', v_booking.status using errcode = 'P0001';
  end if;

  select * into v_session from public.sessions where id = v_booking.session_id for update;
  select * into v_sub     from public.subscriptions where id = (
    select id from public.subscriptions
     where trainee_id = v_booking.trainee_id and status = 'active' limit 1
  ) for update;
  select * into v_pkg     from public.packages where id = v_sub.package_id;

  -- قرار الاسترداد
  v_hours  := public.hours_until(v_session.date, v_session.start_time);
  v_refund := p_force_refund or v_is_admin or v_hours >= coalesce(v_pkg.cancellation_hours, 3);
  v_new_status := case when v_refund then 'cancelled_with_refund' else 'cancelled_no_refund' end;

  -- تحديث الحجز
  update public.bookings
     set status           = v_new_status,
         session_deducted = case when v_refund then false else session_deducted end,
         cancelled_at     = now()
   where id = p_booking_id
   returning * into v_booking;

  -- إنقاص enrolled + إعادة الحالة إلى open إن كانت full
  update public.sessions
     set enrolled = greatest(0, enrolled - 1),
         status   = case
                      when status = 'full' and enrolled - 1 < capacity then 'open'::session_status
                      else status
                    end
   where id = v_session.id;

  -- استرداد الرصيد عند الاسترداد (وللباقات غير المفتوحة)
  if v_refund and v_sub.total_sessions <> 999 and v_sub.id is not null then
    update public.subscriptions
       set used_sessions = greatest(0, used_sessions - 1)
     where id = v_sub.id;

    v_balance := public.current_balance(v_booking.trainee_id) + 1;
    insert into public.ledger_entries
      (trainee_id, subscription_id, type, amount, reason, balance_after, source_booking_id)
    values
      (v_booking.trainee_id, v_sub.id, 'credit', 1, 'إلغاء: ' || v_session.name, v_balance, v_booking.id);
  end if;

  return v_booking;
end;
$$;

grant execute on function public.cancel_booking(uuid, boolean) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3) cancel_session — إلغاء جلسة كاملة من الإدارة (استرداد للجميع)
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.cancel_session(p_session_id uuid)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session  public.sessions%rowtype;
  v_booking  public.bookings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح: هذه العملية للإدارة فقط' using errcode = 'P0001';
  end if;

  select * into v_session from public.sessions where id = p_session_id for update;
  if not found then
    raise exception 'الجلسة غير موجودة' using errcode = 'P0001';
  end if;
  if v_session.status = 'cancelled' then
    raise exception 'الجلسة ملغاة بالفعل' using errcode = 'P0001';
  end if;

  -- إلغاء كل الحجوزات النشطة مع استرداد كامل
  for v_booking in
    select * from public.bookings
     where session_id = p_session_id and status = 'confirmed'
  loop
    perform public.cancel_booking(v_booking.id, true);
  end loop;

  -- تحديث حالة الجلسة
  update public.sessions
     set status = 'cancelled'
   where id = p_session_id
   returning * into v_session;

  return v_session;
end;
$$;

grant execute on function public.cancel_session(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 4) mark_attendance — تسجيل الحضور/الغياب/المتأخر (مدربة أو إدارة)
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.mark_attendance(
  p_booking_id uuid,
  p_state      text  -- 'attended' | 'absent' | 'late'
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking   public.bookings%rowtype;
  v_session   public.sessions%rowtype;
  v_is_admin  boolean := public.is_admin();
begin
  if p_state not in ('attended', 'absent', 'late') then
    raise exception 'حالة غير صحيحة: %', p_state using errcode = 'P0001';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'الحجز غير موجود' using errcode = 'P0001';
  end if;

  select * into v_session from public.sessions where id = v_booking.session_id;

  -- صلاحية: Admin دائماً، أو المدربة المسؤولة عن الجلسة
  if not v_is_admin and v_session.trainer_id <> auth.uid() then
    raise exception 'غير مسموح: المدربة المسؤولة فقط' using errcode = 'P0001';
  end if;

  update public.bookings
     set status             = p_state::booking_status,
         attended_marked_at = now(),
         attended_by        = auth.uid()
   where id = p_booking_id
   returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.mark_attendance(uuid, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 5) assign_package — إسناد باقة جديدة لمتدربة
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.assign_package(
  p_trainee_id uuid,
  p_package_id uuid,
  p_start_date date default current_date
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pkg        public.packages%rowtype;
  v_new_sub    public.subscriptions%rowtype;
  v_balance    integer;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.trainees where id = p_trainee_id) then
    raise exception 'المتدربة غير موجودة' using errcode = 'P0001';
  end if;

  select * into v_pkg from public.packages where id = p_package_id;
  if not found then
    raise exception 'الباقة غير موجودة' using errcode = 'P0001';
  end if;
  if not v_pkg.is_active then
    raise exception 'الباقة موقوفة' using errcode = 'P0001';
  end if;

  -- إنهاء أي اشتراك فعّال قائم (تجديد = استبدال)
  update public.subscriptions
     set status = 'expired'
   where trainee_id = p_trainee_id and status = 'active';

  -- إنشاء الاشتراك الجديد
  insert into public.subscriptions
    (trainee_id, package_id, total_sessions, used_sessions, start_date, end_date, status)
  values (
    p_trainee_id,
    p_package_id,
    v_pkg.sessions,
    0,
    p_start_date,
    p_start_date + (v_pkg.duration_days || ' days')::interval,
    'active'
  )
  returning * into v_new_sub;

  -- سطر ledger (credit بعدد الجلسات)
  if v_pkg.sessions <> 999 then
    v_balance := public.current_balance(p_trainee_id) + v_pkg.sessions;
    insert into public.ledger_entries
      (trainee_id, subscription_id, type, amount, reason, balance_after)
    values
      (p_trainee_id, v_new_sub.id, 'credit', v_pkg.sessions, 'تفعيل باقة: ' || v_pkg.name, v_balance);
  end if;

  return v_new_sub;
end;
$$;

grant execute on function public.assign_package(uuid, uuid, date) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 6) freeze_subscription / unfreeze_subscription
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.freeze_subscription(p_trainee_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.subscriptions
     set status = 'frozen', frozen_at = now()
   where trainee_id = p_trainee_id and status = 'active'
   returning * into v_sub;

  if not found then
    raise exception 'لا يوجد اشتراك فعّال للتجميد' using errcode = 'P0001';
  end if;

  insert into public.ledger_entries (trainee_id, subscription_id, type, amount, reason, balance_after)
  values (p_trainee_id, v_sub.id, 'credit', 0, 'تجميد الاشتراك', public.current_balance(p_trainee_id));

  return v_sub;
end;
$$;

create or replace function public.unfreeze_subscription(p_trainee_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.subscriptions
     set status = 'active', frozen_at = null
   where trainee_id = p_trainee_id and status = 'frozen'
   returning * into v_sub;

  if not found then
    raise exception 'لا يوجد اشتراك مجمد' using errcode = 'P0001';
  end if;

  insert into public.ledger_entries (trainee_id, subscription_id, type, amount, reason, balance_after)
  values (p_trainee_id, v_sub.id, 'credit', 0, 'تفعيل الاشتراك', public.current_balance(p_trainee_id));

  return v_sub;
end;
$$;

grant execute on function public.freeze_subscription(uuid)   to authenticated;
grant execute on function public.unfreeze_subscription(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 7) extend_subscription — تمديد end_date
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.extend_subscription(
  p_trainee_id uuid,
  p_days       integer
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;
  if p_days <= 0 then
    raise exception 'عدد الأيام يجب أن يكون موجباً' using errcode = 'P0001';
  end if;

  update public.subscriptions
     set end_date = end_date + (p_days || ' days')::interval
   where trainee_id = p_trainee_id and status = 'active'
   returning * into v_sub;

  if not found then
    raise exception 'لا يوجد اشتراك فعّال للتمديد' using errcode = 'P0001';
  end if;

  insert into public.ledger_entries (trainee_id, subscription_id, type, amount, reason, balance_after)
  values (p_trainee_id, v_sub.id, 'credit', 0, 'تمديد ' || p_days || ' يوم', public.current_balance(p_trainee_id));

  return v_sub;
end;
$$;

grant execute on function public.extend_subscription(uuid, integer) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 8) adjust_balance — ± يدوي من الإدارة
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.adjust_balance(
  p_trainee_id uuid,
  p_delta      integer,
  p_reason     text
)
returns public.ledger_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub      public.subscriptions%rowtype;
  v_entry    public.ledger_entries%rowtype;
  v_balance  integer;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;
  if p_delta = 0 then
    raise exception 'قيمة التعديل يجب ألا تكون صفراً' using errcode = 'P0001';
  end if;

  select * into v_sub from public.subscriptions
   where trainee_id = p_trainee_id and status = 'active' for update;
  if not found then
    raise exception 'لا يوجد اشتراك فعّال' using errcode = 'P0001';
  end if;

  -- زيادة → total_sessions يرتفع. خصم → نزيد used_sessions.
  if p_delta > 0 then
    update public.subscriptions
       set total_sessions = total_sessions + p_delta
     where id = v_sub.id;
  else
    update public.subscriptions
       set used_sessions = least(total_sessions, used_sessions + abs(p_delta))
     where id = v_sub.id;
  end if;

  v_balance := public.current_balance(p_trainee_id) + p_delta;

  insert into public.ledger_entries
    (trainee_id, subscription_id, type, amount, reason, balance_after)
  values (
    p_trainee_id,
    v_sub.id,
    case when p_delta > 0 then 'credit' else 'debit' end,
    abs(p_delta),
    coalesce(nullif(p_reason, ''), case when p_delta > 0 then 'إضافة يدوية' else 'خصم يدوي' end),
    v_balance
  )
  returning * into v_entry;

  return v_entry;
end;
$$;

grant execute on function public.adjust_balance(uuid, integer, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 9) toggle_trainee_status / toggle_trainer_status / toggle_package_active
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.toggle_trainee_status(p_trainee_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.profiles
     set status = case status
                    when 'active' then 'suspended'::account_status
                    else 'active'::account_status
                  end
   where id = p_trainee_id and role = 'trainee'
   returning * into v_profile;

  if not found then
    raise exception 'المتدربة غير موجودة' using errcode = 'P0001';
  end if;
  return v_profile;
end;
$$;

create or replace function public.toggle_trainer_status(p_trainer_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.profiles
     set status = case status
                    when 'active' then 'inactive'::account_status
                    else 'active'::account_status
                  end
   where id = p_trainer_id and role = 'trainer'
   returning * into v_profile;

  if not found then
    raise exception 'المدربة غير موجودة' using errcode = 'P0001';
  end if;
  return v_profile;
end;
$$;

create or replace function public.toggle_package_active(p_package_id uuid)
returns public.packages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pkg public.packages%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.packages
     set is_active = not is_active
   where id = p_package_id
   returning * into v_pkg;

  if not found then
    raise exception 'الباقة غير موجودة' using errcode = 'P0001';
  end if;
  return v_pkg;
end;
$$;

grant execute on function public.toggle_trainee_status(uuid) to authenticated;
grant execute on function public.toggle_trainer_status(uuid) to authenticated;
grant execute on function public.toggle_package_active(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 10) create_trainee — إنشاء حساب متدربة جديد (يخلق auth user + profile + trainee)
-- هذه العملية معقّدة لأنها تتعامل مع auth.users. الإدارة فقط.
-- ملاحظة: في Production تُوجَد Edge Function تُرسل بريد تفعيل.
-- هنا نستخدم دالة مبسّطة تتوقّع أن يكون المستخدم أُنشِئ عبر auth.admin.createUser
-- وأن يتم استدعاء هذه الدالة لإكمال الـ profile والـ trainee.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.complete_trainee_profile(
  p_user_id   uuid,
  p_name      text,
  p_email     text,
  p_phone     text,
  p_gender    gender_kind,
  p_branch_id uuid,
  p_level     skill_level default 'beginner'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'المستخدم غير موجود في auth' using errcode = 'P0001';
  end if;

  -- profile
  insert into public.profiles (id, role, name, email, phone)
  values (p_user_id, 'trainee', p_name, p_email, p_phone)
  on conflict (id) do update
    set role = 'trainee', name = excluded.name, email = excluded.email, phone = excluded.phone
  returning * into v_profile;

  -- trainee
  insert into public.trainees (id, gender, branch_id, level)
  values (p_user_id, p_gender, p_branch_id, p_level)
  on conflict (id) do update
    set gender = excluded.gender, branch_id = excluded.branch_id, level = excluded.level;

  return v_profile;
end;
$$;

grant execute on function public.complete_trainee_profile(uuid, text, text, text, gender_kind, uuid, skill_level) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- نهاية ملف الدوال — كل منطق العمل الآن في هذه الدوال. لا داعي أن تكرر الواجهة
-- أياً من هذه القواعد؛ يكفي أن تستدعي الـ RPC المناسب.
-- ────────────────────────────────────────────────────────────────────────────
