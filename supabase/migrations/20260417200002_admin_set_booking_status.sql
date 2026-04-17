-- ════════════════════════════════════════════════════════════════════════════
-- admin_set_booking_status — تصحيح حالة الحجز من الإدارة
-- ────────────────────────────────────────────────────────────────────────────
-- `mark_attendance` يُستخدم من المدربة ويقبل فقط: attended/absent/late.
-- لكن الإدارة قد تحتاج:
--   * إعادة حجز ملغى إلى "مؤكد" (إذا كان الإلغاء بالخطأ)
--   * تصحيح من attended/absent إلى confirmed
--
-- هذه الدالة تسمح للـ admin فقط بتغيير حالة الحجز إلى أي حالة صالحة،
-- مع مراعاة إعادة ضبط enrolled counter ومتابعة القيود.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_set_booking_status(
  p_booking_id uuid,
  p_status     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_new_status booking_status;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مسموح' USING errcode = 'P0001';
  END IF;

  -- التحقق من صلاحية الحالة
  IF p_status NOT IN ('confirmed','attended','absent','late') THEN
    RAISE EXCEPTION 'حالة غير صالحة: %', p_status USING errcode = 'P0001';
  END IF;

  v_new_status := p_status::booking_status;

  SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الحجز غير موجود' USING errcode = 'P0001';
  END IF;

  -- لا تعديل إذا الحالة الحالية cancelled_* (إلغاء نهائي — يحتاج حجز جديد)
  IF v_booking.status IN ('cancelled_with_refund','cancelled_no_refund') THEN
    RAISE EXCEPTION 'لا يمكن تعديل حجز ملغى — يجب إنشاء حجز جديد' USING errcode = 'P0001';
  END IF;

  -- تحديث الحالة
  UPDATE public.bookings
    SET status = v_new_status,
        attended_marked_at = CASE
          WHEN v_new_status IN ('attended','absent','late') THEN now()
          ELSE NULL
        END
    WHERE id = p_booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_booking_status(uuid, text) TO authenticated;
