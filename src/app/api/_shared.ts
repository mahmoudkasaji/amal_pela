/**
 * Shared API primitives — used across all domain modules.
 */

export interface RpcResult<T = unknown> {
  ok: boolean;
  reason?: string;
  data?: T;
}

/**
 * يكتشف ويُصلح النصوص التي مرّت بـ double-encoding:
 * UTF-8 bytes تمّ تفسيرها كـ Latin-1 (أو Windows-1252).
 *
 * السبب النموذجي: السيرفر أرسل Arabic UTF-8 لكن طبقة وسيطة (مثلاً
 * PostgreSQL error with % format substitution أو response بدون charset
 * صريح) قرأتها كـ Latin-1 فأصبحت الأحرف الـ 2-byte تظهر كزوج من chars.
 *
 * النمط المميّز للـ mojibake العربي:
 *  - Ø (U+00D8) + حرف Latin-1 → UTF-8 لحرف عربي (0xD8 XX)
 *  - Ù (U+00D9) + حرف Latin-1 → UTF-8 لحرف عربي (0xD9 XX)
 *  - â€ (U+00E2 U+20AC) → UTF-8 لرمز punctuation (0xE2 0x80 XX)
 *  - Ã (U+00C3) + حرف → UTF-8 لحرف Latin extended (0xC3 XX)
 */
function repairMojibake(s: string): string {
  if (!s) return s;
  // كاشف سريع: هل السلسلة تحوي نمط mojibake مميّز؟
  const hasMojibakePattern = /[\u00C2-\u00C3\u00D8\u00D9][\u0080-\u00FF]/.test(s);
  if (!hasMojibakePattern) return s;

  try {
    // كل char في s يجب أن يكون code ≤ 0xFF (نطاق Latin-1).
    // نفسّرها كـ bytes UTF-8 ونُعيد decode.
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c > 0xff) return s; // ليست mojibake حقيقية — اتركها
      bytes[i] = c;
    }
    const repaired = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // تأكّد: النتيجة تحتوي Arabic حقيقية (نطاق U+0600-U+06FF)
    if (/[\u0600-\u06FF]/.test(repaired)) return repaired;
    return s;
  } catch {
    return s;
  }
}

/**
 * Maps Postgres error messages to user-facing Arabic strings.
 * RPCs raise with errcode=P0001 and already-Arabic messages; we pass through
 * بعد إصلاح أي mojibake (UTF-8 → Latin-1 double-encoding).
 */
export function translateError(msg: string | undefined): string {
  if (!msg) return 'حدث خطأ غير متوقع';
  return repairMojibake(msg);
}

// تصدير داخلي للاختبارات
export const __repairMojibake = repairMojibake;
