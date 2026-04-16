-- ════════════════════════════════════════════════════════════════════════════
-- Serene Studio — Seed
-- ────────────────────────────────────────────────────────────────────────────
-- بيانات تجريبية تُسمح بتشغيل المشروع كامل فوراً. تنعكس على:
--   - بيانات دخول: admin/admin123, sara/pass123, fatima/pass123 ...
--   - جلسات حول "اليوم" (current_date) فتبقى demo حيّة بغض النظر عن التاريخ
-- ════════════════════════════════════════════════════════════════════════════

-- تعطيل الـ triggers الحامية خلال الـ seed (bootstrap context — بلا auth.uid).
-- نُعيد تفعيلها في النهاية. هذا pattern قياسي للـ seeds.
set session_replication_role = 'replica';

-- ═══════════════════════════════════════════════════════════════
-- 1) AUTH.USERS — إنشاء حسابات الدخول مع كلمات مرور مُشفَّرة bcrypt
-- ═══════════════════════════════════════════════════════════════

-- تنظيف أي بيانات سابقة (مفيد عند إعادة التشغيل)
delete from auth.users where email in (
  'admin@studio.com',
  'sara@studio.com', 'noor@studio.com', 'reem@studio.com',
  'fatima@email.com', 'mona@email.com', 'hanouf@email.com',
  'dalal@email.com', 'rawan@email.com', 'lama@email.com'
);

-- كل المستخدمين (password = 'admin123' للإدارة، 'pass123' للبقية)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user
) values
  -- Admin
  ('00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'admin@studio.com', crypt('admin123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"admin"}'::jsonb, false),

  -- Trainers (pass123)
  ('00000000-0000-0000-0000-000000000a01',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'sara@studio.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"sara"}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000a02',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'noor@studio.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"noor"}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000a03',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'reem@studio.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"reem"}'::jsonb, false),

  -- Trainees (pass123)
  ('00000000-0000-0000-0000-000000000b01',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'fatima@email.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"fatima"}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000b02',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'mona@email.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"mona"}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000b03',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'hanouf@email.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"hanouf"}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000b04',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'dalal@email.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"dalal"}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000b05',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rawan@email.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"rawan"}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000b06',
   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'lama@email.com', crypt('pass123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"username":"lama"}'::jsonb, false);

-- auth.identities مطلوبة للدخول بـ email
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
from auth.users u
where u.email in (
  'admin@studio.com',
  'sara@studio.com','noor@studio.com','reem@studio.com',
  'fatima@email.com','mona@email.com','hanouf@email.com',
  'dalal@email.com','rawan@email.com','lama@email.com'
);

-- ─── GoTrue هاس-فيكس: الحقول التالية يتوقع GoTrue strings فارغة وليس NULL
-- (وإلا يفشل تسجيل الدخول بـ "Database error querying schema")
update auth.users
   set confirmation_token        = coalesce(confirmation_token,        ''),
       recovery_token            = coalesce(recovery_token,            ''),
       email_change              = coalesce(email_change,              ''),
       email_change_token_new    = coalesce(email_change_token_new,    ''),
       email_change_token_current= coalesce(email_change_token_current,''),
       reauthentication_token    = coalesce(reauthentication_token,    '')
 where email in (
   'admin@studio.com',
   'sara@studio.com','noor@studio.com','reem@studio.com',
   'fatima@email.com','mona@email.com','hanouf@email.com',
   'dalal@email.com','rawan@email.com','lama@email.com'
 );

-- auth.identities: إضافة email_verified/phone_verified لأن GoTrue يقرأهما
update auth.identities
   set identity_data = identity_data || '{"email_verified": false, "phone_verified": false}'::jsonb
 where user_id in (
   select id from auth.users where email in (
     'admin@studio.com',
     'sara@studio.com','noor@studio.com','reem@studio.com',
     'fatima@email.com','mona@email.com','hanouf@email.com',
     'dalal@email.com','rawan@email.com','lama@email.com'
   )
 ) and not (identity_data ? 'email_verified');

-- ═══════════════════════════════════════════════════════════════
-- 2) REFERENCE DATA — branches, session_types, club_settings
-- ═══════════════════════════════════════════════════════════════

insert into public.branches (id, name, address, phone) values
  ('00000000-0000-0000-0000-00000000bc01', 'الفرع الرئيسي', 'شارع الأمير سلطان', '0112345678'),
  ('00000000-0000-0000-0000-00000000bc02', 'فرع النزهة',    'حي النزهة',         '0117654321');

insert into public.session_types (name, icon) values
  ('يوغا', '🧘'),
  ('تأمل', '🌸'),
  ('تمدد', '💫'),
  ('تنفس', '💨'),
  ('متقدمة', '⚡'),
  ('خاصة', '✨');

insert into public.club_settings (id, club_name, email, phone, website, cancellation_hours, cancellation_message)
values (1, 'استوديو سيرين', 'info@serenestudio.com', '0500000000', 'www.serenestudio.com',
        3, 'يسمح بالإلغاء قبل 3 ساعات من الجلسة مع استرداد كامل.')
on conflict (id) do update
  set club_name = excluded.club_name,
      email = excluded.email,
      phone = excluded.phone,
      website = excluded.website;

-- ═══════════════════════════════════════════════════════════════
-- 3) PROFILES — for each auth user
-- ═══════════════════════════════════════════════════════════════

insert into public.profiles (id, role, name, email, phone, username) values
  ('00000000-0000-0000-0000-000000000001', 'admin',   'مدير النظام',    'admin@studio.com',   '0500000000', 'admin'),
  ('00000000-0000-0000-0000-000000000a01', 'trainer', 'سارة أحمد',      'sara@studio.com',    '0501234567', 'sara'),
  ('00000000-0000-0000-0000-000000000a02', 'trainer', 'نور الهاشم',     'noor@studio.com',    '0509876543', 'noor'),
  ('00000000-0000-0000-0000-000000000a03', 'trainer', 'ريم العتيبي',    'reem@studio.com',    '0554321098', 'reem'),
  ('00000000-0000-0000-0000-000000000b01', 'trainee', 'فاطمة الزهراء',  'fatima@email.com',   '0551234567', 'fatima'),
  ('00000000-0000-0000-0000-000000000b02', 'trainee', 'منى السالم',     'mona@email.com',     '0552345678', 'mona'),
  ('00000000-0000-0000-0000-000000000b03', 'trainee', 'هنوف الرشيد',    'hanouf@email.com',   '0553456789', 'hanouf'),
  ('00000000-0000-0000-0000-000000000b04', 'trainee', 'دلال الشهري',    'dalal@email.com',    '0554567890', 'dalal'),
  ('00000000-0000-0000-0000-000000000b05', 'trainee', 'روان الغامدي',   'rawan@email.com',    '0555678901', 'rawan'),
  ('00000000-0000-0000-0000-000000000b06', 'trainee', 'لمى الزهراني',   'lama@email.com',     '0556789012', 'lama');

-- ═══════════════════════════════════════════════════════════════
-- 4) TRAINERS (satellite)
-- ═══════════════════════════════════════════════════════════════

insert into public.trainers (id, specialty, branch_id, join_date) values
  ('00000000-0000-0000-0000-000000000a01', 'يوغا وتأمل',    '00000000-0000-0000-0000-00000000bc01', '2024-01-15'),
  ('00000000-0000-0000-0000-000000000a02', 'تنفس وتمدد',    '00000000-0000-0000-0000-00000000bc02', '2024-03-01'),
  ('00000000-0000-0000-0000-000000000a03', 'يوغا متقدمة',   '00000000-0000-0000-0000-00000000bc01', '2023-09-10');

-- ═══════════════════════════════════════════════════════════════
-- 5) TRAINEES (satellite)
-- ═══════════════════════════════════════════════════════════════

insert into public.trainees (id, gender, birth_date, branch_id, level, notes, join_date) values
  ('00000000-0000-0000-0000-000000000b01', 'female', '1995-06-15', '00000000-0000-0000-0000-00000000bc01', 'intermediate',
   'عميلة مميزة، تفضل جلسات الصباح الباكر', '2025-10-01'),
  ('00000000-0000-0000-0000-000000000b02', 'female', '1998-03-22', '00000000-0000-0000-0000-00000000bc01', 'beginner',
   null, '2026-03-01'),
  ('00000000-0000-0000-0000-000000000b03', 'female', '1992-11-08', '00000000-0000-0000-0000-00000000bc02', 'advanced',
   'مستوى متقدم، تطلب جلسات خاصة أحياناً', '2024-05-15'),
  ('00000000-0000-0000-0000-000000000b04', 'female', '2000-07-19', '00000000-0000-0000-0000-00000000bc01', 'intermediate',
   null, '2025-12-10'),
  ('00000000-0000-0000-0000-000000000b05', 'female', '1996-09-03', '00000000-0000-0000-0000-00000000bc02', 'beginner',
   null, '2026-02-20'),
  ('00000000-0000-0000-0000-000000000b06', 'female', '1994-05-27', '00000000-0000-0000-0000-00000000bc01', 'intermediate',
   'متوقفة مؤقتاً بسبب السفر', '2025-08-05');

-- حالة الحساب (lama موقوفة)
update public.profiles set status = 'suspended' where id = '00000000-0000-0000-0000-000000000b06';

-- ═══════════════════════════════════════════════════════════════
-- 6) PACKAGES
-- ═══════════════════════════════════════════════════════════════

insert into public.packages
  (id, name, description, sessions, duration_days, price, cancellation_hours,
   daily_limit, session_types, level, renewable, is_active)
values
  ('00000000-0000-0000-0000-0000000000c1',
   'باقة 8 جلسات', 'مناسبة للمبتدئين الراغبين في البدء بخطى هادئة',
   8, 30, 350, 3, 1, ARRAY['يوغا','تأمل','تمدد'], 'beginner', true, true),
  ('00000000-0000-0000-0000-0000000000c2',
   'باقة 12 جلسة', 'الأنسب للمستوى المتوسط مع تنوع في أنواع الجلسات',
   12, 45, 490, 3, 1, ARRAY['يوغا','تأمل','تمدد','تنفس'], 'intermediate', true, true),
  ('00000000-0000-0000-0000-0000000000c3',
   'باقة شهرية مفتوحة', 'حضور غير محدود لجميع الجلسات طوال الشهر',
   999, 30, 699, 2, 2, ARRAY['يوغا','تأمل','تمدد','تنفس','متقدمة'], 'all', true, true),
  ('00000000-0000-0000-0000-0000000000c4',
   'باقة VIP', 'باقة متقدمة مع أولوية حجز وجلسات خاصة',
   16, 60, 990, 1, 2, ARRAY['يوغا','تأمل','تمدد','تنفس','متقدمة','خاصة'], 'advanced', true, true);

-- ═══════════════════════════════════════════════════════════════
-- 7) SUBSCRIPTIONS + LEDGER (تُدرَج مباشرةً — نتجاوز RPC لأن الـ seed bootstrap)
-- ═══════════════════════════════════════════════════════════════

-- fatima (tn-1) — باقة 12 جلسة، استخدمت 4
insert into public.subscriptions
  (id, trainee_id, package_id, total_sessions, used_sessions, start_date, end_date, status)
values
  ('00000000-0000-0000-0000-0000000000d1',
   '00000000-0000-0000-0000-000000000b01',
   '00000000-0000-0000-0000-0000000000c2',
   12, 4, current_date - interval '10 days', current_date + interval '35 days', 'active');

-- mona (tn-2) — باقة 8 جلسات، استخدمت 2
insert into public.subscriptions
  (id, trainee_id, package_id, total_sessions, used_sessions, start_date, end_date, status)
values
  ('00000000-0000-0000-0000-0000000000d2',
   '00000000-0000-0000-0000-000000000b02',
   '00000000-0000-0000-0000-0000000000c1',
   8, 2, current_date - interval '5 days', current_date + interval '25 days', 'active');

-- hanouf (tn-3) — باقة VIP، استخدمت 3
insert into public.subscriptions
  (id, trainee_id, package_id, total_sessions, used_sessions, start_date, end_date, status)
values
  ('00000000-0000-0000-0000-0000000000d3',
   '00000000-0000-0000-0000-000000000b03',
   '00000000-0000-0000-0000-0000000000c4',
   16, 3, current_date - interval '15 days', current_date + interval '45 days', 'active');

-- dalal (tn-4) — باقة شهرية مفتوحة
insert into public.subscriptions
  (id, trainee_id, package_id, total_sessions, used_sessions, start_date, end_date, status)
values
  ('00000000-0000-0000-0000-0000000000d4',
   '00000000-0000-0000-0000-000000000b04',
   '00000000-0000-0000-0000-0000000000c3',
   999, 8, current_date - interval '12 days', current_date + interval '18 days', 'active');

-- rawan (tn-5) — باقة 8 جلسات، استخدمت 6 (قريبة من الانتهاء)
insert into public.subscriptions
  (id, trainee_id, package_id, total_sessions, used_sessions, start_date, end_date, status)
values
  ('00000000-0000-0000-0000-0000000000d5',
   '00000000-0000-0000-0000-000000000b05',
   '00000000-0000-0000-0000-0000000000c1',
   8, 6, current_date - interval '25 days', current_date + interval '5 days', 'active');

-- lama (tn-6) موقوفة — اشتراكها مجمد
insert into public.subscriptions
  (id, trainee_id, package_id, total_sessions, used_sessions, start_date, end_date, status, frozen_at)
values
  ('00000000-0000-0000-0000-0000000000d6',
   '00000000-0000-0000-0000-000000000b06',
   '00000000-0000-0000-0000-0000000000c2',
   12, 5, current_date - interval '20 days', current_date + interval '25 days', 'frozen', now());

-- Ledger entries لإظهار الرصيد الحالي (credit عند التفعيل، debit لكل جلسة مستخدمة)
insert into public.ledger_entries
  (trainee_id, subscription_id, type, amount, reason, balance_after, entry_date)
values
  -- fatima: +12 تفعيل، -4 جلسات استخدمتها
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000d1',
   'credit', 12, 'تفعيل باقة: باقة 12 جلسة', 12, current_date - interval '10 days'),
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000d1',
   'debit', 1, 'حجز: يوغا الصباح', 11, current_date - interval '8 days'),
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000d1',
   'debit', 1, 'حجز: تأمل', 10, current_date - interval '6 days'),
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000d1',
   'debit', 1, 'حجز: تمدد', 9, current_date - interval '4 days'),
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000d1',
   'debit', 1, 'حجز: يوغا المساء', 8, current_date - interval '2 days'),

  -- mona: +8 تفعيل، -2 استخدمت
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000d2',
   'credit', 8, 'تفعيل باقة: باقة 8 جلسات', 8, current_date - interval '5 days'),
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000d2',
   'debit', 1, 'حجز: يوغا', 7, current_date - interval '3 days'),
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000d2',
   'debit', 1, 'حجز: تأمل', 6, current_date - interval '1 days'),

  -- hanouf
  ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-0000000000d3',
   'credit', 16, 'تفعيل باقة: باقة VIP', 16, current_date - interval '15 days'),
  ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-0000000000d3',
   'debit', 3, 'حجوزات متعددة', 13, current_date - interval '7 days'),

  -- rawan قريبة من الانتهاء
  ('00000000-0000-0000-0000-000000000b05', '00000000-0000-0000-0000-0000000000d5',
   'credit', 8, 'تفعيل باقة: باقة 8 جلسات', 8, current_date - interval '25 days'),
  ('00000000-0000-0000-0000-000000000b05', '00000000-0000-0000-0000-0000000000d5',
   'debit', 6, 'حجوزات متعددة', 2, current_date - interval '5 days');

-- ═══════════════════════════════════════════════════════════════
-- 8) SESSIONS — جدول أسبوعي حول "اليوم"
-- ═══════════════════════════════════════════════════════════════

insert into public.sessions
  (id, name, type, trainer_id, branch_id, date, start_time, end_time, capacity, enrolled, status, level)
values
  -- أمس
  ('00000000-0000-0000-0000-0000000000e1',
   'يوغا الصباح', 'يوغا', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-00000000bc01',
   current_date - 1, '07:00', '08:00', 12, 10, 'completed', 'intermediate'),
  ('00000000-0000-0000-0000-0000000000e2',
   'تأمل مسائي', 'تأمل', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-00000000bc02',
   current_date - 1, '18:00', '19:00', 8, 7, 'completed', 'all'),

  -- اليوم
  ('00000000-0000-0000-0000-0000000000e3',
   'يوغا الصباح', 'يوغا', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-00000000bc01',
   current_date, '07:00', '08:00', 12, 8, 'open', 'intermediate'),
  ('00000000-0000-0000-0000-0000000000e4',
   'تمدد وتنفس', 'تمدد', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-00000000bc02',
   current_date, '10:00', '11:00', 10, 6, 'open', 'all'),
  ('00000000-0000-0000-0000-0000000000e5',
   'يوغا متقدمة', 'متقدمة', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-00000000bc01',
   current_date, '17:30', '18:30', 8, 8, 'full', 'advanced'),
  ('00000000-0000-0000-0000-0000000000e6',
   'تأمل مسائي', 'تأمل', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-00000000bc01',
   current_date, '19:00', '20:00', 15, 5, 'open', 'all'),

  -- غداً
  ('00000000-0000-0000-0000-0000000000e7',
   'يوغا الصباح', 'يوغا', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-00000000bc01',
   current_date + 1, '07:00', '08:00', 12, 3, 'open', 'intermediate'),
  ('00000000-0000-0000-0000-0000000000e8',
   'تنفس عميق', 'تنفس', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-00000000bc02',
   current_date + 1, '11:00', '12:00', 10, 2, 'open', 'beginner'),
  ('00000000-0000-0000-0000-0000000000e9',
   'تمدد', 'تمدد', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-00000000bc01',
   current_date + 1, '18:00', '19:00', 10, 1, 'open', 'all'),

  -- بعد غد
  ('00000000-0000-0000-0000-0000000000ea',
   'يوغا الصباح', 'يوغا', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-00000000bc01',
   current_date + 2, '07:00', '08:00', 12, 0, 'open', 'intermediate'),
  ('00000000-0000-0000-0000-0000000000eb',
   'جلسة خاصة', 'خاصة', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-00000000bc01',
   current_date + 2, '15:00', '16:00', 4, 0, 'open', 'advanced'),

  -- بعد 3-4 أيام
  ('00000000-0000-0000-0000-0000000000ec',
   'يوغا المساء', 'يوغا', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-00000000bc02',
   current_date + 3, '18:00', '19:00', 12, 0, 'open', 'all'),
  ('00000000-0000-0000-0000-0000000000ed',
   'تأمل ذهني', 'تأمل', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-00000000bc01',
   current_date + 4, '19:00', '20:00', 15, 0, 'open', 'all');

-- ═══════════════════════════════════════════════════════════════
-- 9) BOOKINGS — بعض الحجوزات بحالات متنوعة للعرض التجريبي
-- ═══════════════════════════════════════════════════════════════

insert into public.bookings
  (trainee_id, session_id, status, session_deducted, created_at, attended_marked_at)
values
  -- fatima: حجز مؤكد اليوم، مكتملة بالأمس
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000e3',
   'confirmed', true, now() - interval '1 day', null),
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000e1',
   'attended', true, now() - interval '2 days', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000e7',
   'confirmed', true, now() - interval '1 hour', null),

  -- mona: حجز في جلسة تمدد اليوم، حجز للأسبوع القادم
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000e4',
   'confirmed', true, now() - interval '12 hours', null),
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000e8',
   'confirmed', true, now() - interval '3 hours', null),

  -- hanouf: حضرت متقدمة
  ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-0000000000e5',
   'confirmed', true, now() - interval '1 day', null),
  ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-0000000000e2',
   'attended', true, now() - interval '2 days', now() - interval '1 day'),

  -- dalal: باقة مفتوحة، حجوزات متعددة
  ('00000000-0000-0000-0000-000000000b04', '00000000-0000-0000-0000-0000000000e4',
   'confirmed', false, now() - interval '8 hours', null),
  ('00000000-0000-0000-0000-000000000b04', '00000000-0000-0000-0000-0000000000e6',
   'confirmed', false, now() - interval '4 hours', null),
  ('00000000-0000-0000-0000-000000000b04', '00000000-0000-0000-0000-0000000000e2',
   'attended', false, now() - interval '2 days', now() - interval '1 day'),

  -- rawan: حجز قادم
  ('00000000-0000-0000-0000-000000000b05', '00000000-0000-0000-0000-0000000000e9',
   'confirmed', true, now() - interval '2 hours', null),

  -- غياب سابق للتجربة
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000e1',
   'absent', true, now() - interval '2 days', now() - interval '1 day');

-- إعادة تفعيل الـ triggers — الـ runtime يُحمَى كما يجب من هنا فصاعداً
set session_replication_role = 'origin';

-- ════════════════════════════════════════════════════════════════════════════
-- نهاية Seed — بعد تشغيل هذا الملف:
--   - سجّل دخول admin/admin123 → /admin ترى كل شيء
--   - sara/pass123 → /trainer ترى جلسات سارة (3 اليوم على الأقل)
--   - fatima/pass123 → /trainee ترى باقة 12 مع 8 متبقية وحجوزين قادمين
-- ════════════════════════════════════════════════════════════════════════════
