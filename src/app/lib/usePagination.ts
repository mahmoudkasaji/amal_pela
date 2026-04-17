/**
 * Generic pagination hook — client-side slicing.
 *
 * Usage:
 *   const { page, setPage, totalPages, pageItems, showingFrom, showingTo, total } =
 *     usePagination(filteredArray, 10);
 *
 *   {pageItems.map(...)}
 *   <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
 */
import { useEffect, useMemo, useState } from 'react';

export function usePagination<T>(items: T[], pageSize: number = 10) {
  const [page, setPage] = useState(1);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // إذا تغيرت قائمة الـ items (بسبب فلترة/بحث) بحيث صارت أقصر،
  // نعيد الصفحة إلى 1 لتجنّب عرض "صفحة 5 من 2".
  useEffect(() => {
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  function reset() {
    setPage(1);
  }

  return {
    page,
    setPage,
    totalPages,
    pageItems,
    showingFrom,
    showingTo,
    total,
    reset,
  };
}
