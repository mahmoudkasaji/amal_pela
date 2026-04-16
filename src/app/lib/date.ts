/**
 * Date utilities — مصدر وحيد للتاريخ «اليوم».
 * ممنوع استخدام أي تاريخ ثابت (مثل '2026-04-15') في أي صفحة.
 * كل الصفحات يجب أن تستدعي today() أو مشتقاتها.
 */

/** تاريخ اليوم بصيغة ISO قصيرة 'YYYY-MM-DD'. */
export function today(): string {
  return toISODate(new Date());
}

/** تحويل Date إلى 'YYYY-MM-DD' (حسب التوقيت المحلي). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** إضافة أيام لتاريخ ISO وإرجاع ISO جديد. */
export function addDays(iso: string, delta: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

/** عدد الأيام بين تاريخين ISO (b - a). قد تكون سالبة. */
export function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.ceil(ms / 86400000);
}

/** «اليوم» / «غداً» / تاريخ مختصر عربي ('أحد، 15 أبريل'). */
export function formatShortArabic(iso: string): string {
  const t = today();
  if (iso === t) return 'اليوم';
  if (iso === addDays(t, 1)) return 'غداً';
  if (iso === addDays(t, -1)) return 'أمس';
  return new Date(iso).toLocaleDateString('ar-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** تاريخ عربي مطوّل (الأحد، 15 أبريل 2026). */
export function formatLongArabic(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** بداية الأسبوع (يوم أحد) لأي تاريخ. */
export function startOfWeek(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

/** مصفوفة من 7 تواريخ ISO تمثل الأسبوع الذي يحتوي iso (أحد → سبت). */
export function weekDates(iso: string): string[] {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** مصفوفة من 5 تواريخ عمل (أحد → خميس) — بيئة الاستوديو. */
export function workWeekDates(iso: string): string[] {
  const start = startOfWeek(iso);
  return Array.from({ length: 5 }, (_, i) => addDays(start, i));
}

/** عدد الساعات بين «الآن» وبداية جلسة (date + HH:MM). قد تكون سالبة لو الجلسة مرّت. */
export function hoursUntil(date: string, startTime: string): number {
  const [h, m] = startTime.split(':').map(Number);
  const target = new Date(date);
  target.setHours(h ?? 0, m ?? 0, 0, 0);
  return (target.getTime() - Date.now()) / 3_600_000;
}

/** تحقُّق من تعارض نافذتين زمنيتين ضمن نفس اليوم: [a1, a2) ∩ [b1, b2) ≠ ∅. */
export function timeOverlaps(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 < b2 && b1 < a2;
}

/** تحية حسب الوقت الحالي. */
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'مساء الخير';
  return 'مساء النور';
}
