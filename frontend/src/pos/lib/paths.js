/** Base path for POS admin when served from the unified Vite app */
export const POS_BASE = '/pos';

/** Turn an app-internal path like `/dashboard` into `/pos/dashboard`. `/` maps to dashboard. */
export function posPath(internalPath) {
  if (internalPath == null || internalPath === '') return `${POS_BASE}/dashboard`;
  const p = internalPath.startsWith('/') ? internalPath : `/${internalPath}`;
  if (p === '/') return `${POS_BASE}/dashboard`;
  if (p === POS_BASE || p.startsWith(`${POS_BASE}/`)) return p;
  return `${POS_BASE}${p}`;
}

