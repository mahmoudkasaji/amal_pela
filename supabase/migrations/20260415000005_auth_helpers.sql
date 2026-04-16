-- ════════════════════════════════════════════════════════════════════════════
-- Serene Studio — Auth helpers
-- ────────────────────────────────────────────────────────────────────────────
-- دوال مساعدة للمصادقة تُستخدَم من عميل anon قبل الدخول:
-- - resolve_login_email(username) → email | null
--   يسمح للمستخدمة بكتابة username بدل الإيميل في LoginPage
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.resolve_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email::text
    from public.profiles
   where username = p_username::citext
   limit 1
$$;

-- متاحة للـ anon لأن المستخدمة لم تدخل بعد
grant execute on function public.resolve_login_email(text) to anon, authenticated;
