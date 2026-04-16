/**
 * Shared API primitives — used across all domain modules.
 */

export interface RpcResult<T = unknown> {
  ok: boolean;
  reason?: string;
  data?: T;
}

/**
 * Maps Postgres error messages to user-facing Arabic strings.
 * RPCs raise with errcode=P0001 and already-Arabic messages; we pass through.
 */
export function translateError(msg: string | undefined): string {
  if (!msg) return 'حدث خطأ غير متوقع';
  return msg;
}
