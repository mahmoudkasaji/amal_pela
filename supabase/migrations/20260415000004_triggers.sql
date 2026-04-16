-- ════════════════════════════════════════════════════════════════════════════
-- Serene Studio — Triggers
-- ────────────────────────────────────────────────────────────────────────────
-- Triggers تُحافظ على اتساق البيانات بشكل تلقائي:
-- 1) عند تسجيل dropping Session → حالة لقائمة الانتظار التي تلتها تُرقَّى تلقائياً
-- 2) عند تغيير حالة الحجز لإلغاء → تأكيد التحرير الفيزيائي للمقعد (للأمان)
-- 3) عند إنشاء auth.user جديد بدون profile → لا نفعل شيئاً (الإدارة تُكمل البيانات عبر RPC)
-- ════════════════════════════════════════════════════════════════════════════

set search_path = public;

-- ════════════════════════════════════════════════════════════════════════════
-- 1) ترقية قائمة الانتظار: عند إلغاء حجز → أول waitlist ترتقي إلى confirmed
--    شريطة أن الجلسة لا زالت مفتوحة للحجز (لم تبدأ بعد).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.tg_promote_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_waiter   public.bookings%rowtype;
  v_session  public.sessions%rowtype;
  v_sub      public.subscriptions%rowtype;
  v_balance  integer;
begin
  -- نهتم فقط بتحوُّل من confirmed → cancelled_*
  if old.status <> 'confirmed' or new.status not in ('cancelled_with_refund', 'cancelled_no_refund') then
    return new;
  end if;

  select * into v_session from public.sessions where id = new.session_id for update;
  if v_session.status = 'cancelled' then
    return new;   -- الجلسة نفسها ملغاة، لا ترقية
  end if;

  -- التقط أول waitlist حسب الموضع
  select * into v_waiter
    from public.bookings
    where session_id = new.session_id and status = 'waitlist'
    order by waitlist_position asc
    limit 1
    for update;

  if not found then
    return new;   -- لا أحد في الانتظار
  end if;

  -- تحقّق أن المتدربة ما زالت صالحة للحجز (اشتراك فعّال + رصيد)
  select * into v_sub from public.subscriptions
   where trainee_id = v_waiter.trainee_id and status = 'active' for update;
  if not found then return new; end if;
  if v_sub.end_date < current_date then return new; end if;
  if v_sub.total_sessions <> 999 and (v_sub.total_sessions - v_sub.used_sessions) <= 0 then
    return new;
  end if;

  -- تحديث الحجز: waitlist → confirmed
  update public.bookings
     set status = 'confirmed',
         waitlist_position = null,
         session_deducted  = (v_sub.total_sessions <> 999)
   where id = v_waiter.id;

  -- زيادة enrolled (تعويض عن النقص بعد الإلغاء)
  update public.sessions
     set enrolled = enrolled + 1,
         status   = case when enrolled + 1 >= capacity then 'full'::session_status else status end
   where id = new.session_id;

  -- خصم رصيد إذا ليست مفتوحة
  if v_sub.total_sessions <> 999 then
    update public.subscriptions
       set used_sessions = used_sessions + 1
     where id = v_sub.id;

    v_balance := public.current_balance(v_waiter.trainee_id) - 1;
    insert into public.ledger_entries
      (trainee_id, subscription_id, type, amount, reason, balance_after, source_booking_id)
    values (
      v_waiter.trainee_id,
      v_sub.id,
      'debit',
      1,
      'ترقية من قائمة الانتظار: ' || v_session.name,
      v_balance,
      v_waiter.id
    );
  end if;

  return new;
end;
$$;

create trigger trg_promote_waitlist
  after update of status on public.bookings
  for each row execute function public.tg_promote_waitlist();

-- ════════════════════════════════════════════════════════════════════════════
-- 2) حماية من الإدخال المباشر: أي INSERT على bookings من خارج الـ RPCs
--    يجب أن يمرّ بفحص أساسي (لا رصيد سالب، لا جلسة ممتلئة). هذه حماية
--    احتياطية لأن الـ RPC تقوم بنفس الفحوصات، لكن لو تجاوز أحدٌ الـ RPC
--    (مثلاً Admin عبر Studio UI) نبقى متسقين.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.tg_guard_booking_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_session public.sessions%rowtype;
begin
  select * into v_session from public.sessions where id = new.session_id;
  if not found then
    raise exception 'الجلسة غير موجودة' using errcode = 'P0001';
  end if;

  -- لا نسمح بإضافة confirmed فوق السعة
  if new.status = 'confirmed' and v_session.enrolled >= v_session.capacity then
    raise exception 'الجلسة مكتملة — لا يمكن إضافة حجز مؤكد' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_guard_booking_insert
  before insert on public.bookings
  for each row execute function public.tg_guard_booking_insert();

-- ════════════════════════════════════════════════════════════════════════════
-- 3) عند حذف مستخدم من auth.users → cascade تلقائي عبر FK (لا trigger لازم).
--    لكن نتأكد: إذا حُذف Profile نحذف Satellite (trainees/trainers) — CASCADE
--    معرّف في schema بالفعل.
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- 4) حماية الحقول الثابتة: role/status في profiles — لا يغيّرها إلا Admin
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.tg_guard_profile_immutables()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin يمرّ دائماً
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'تغيير الدور ممنوع — اتصل بالإدارة' using errcode = 'P0001';
  end if;
  if new.status is distinct from old.status then
    raise exception 'تغيير حالة الحساب ممنوع — اتصل بالإدارة' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_guard_profile_immutables
  before update on public.profiles
  for each row execute function public.tg_guard_profile_immutables();

-- ════════════════════════════════════════════════════════════════════════════
-- 5) حماية الحقول الثابتة في trainees: level/branch/notes — Admin فقط
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.tg_guard_trainee_immutables()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.level is distinct from old.level then
    raise exception 'تغيير المستوى ممنوع — اتصل بالإدارة' using errcode = 'P0001';
  end if;
  if new.branch_id is distinct from old.branch_id then
    raise exception 'تغيير الفرع ممنوع — اتصل بالإدارة' using errcode = 'P0001';
  end if;
  if new.notes is distinct from old.notes then
    raise exception 'الملاحظات الإدارية لا تُعدَّل من المتدربة' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_guard_trainee_immutables
  before update on public.trainees
  for each row execute function public.tg_guard_trainee_immutables();

-- ════════════════════════════════════════════════════════════════════════════
-- 6) مزامنة: auth.users.email ⇄ profiles.email عند التغيير في auth
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.tg_sync_auth_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger trg_sync_auth_email
  after update of email on auth.users
  for each row execute function public.tg_sync_auth_email();

-- ────────────────────────────────────────────────────────────────────────────
-- نهاية ملف التريجرات
-- ────────────────────────────────────────────────────────────────────────────
