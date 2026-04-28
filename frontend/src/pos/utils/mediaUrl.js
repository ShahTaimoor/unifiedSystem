/**
 * Resolve product/category image URLs for the admin SPA.
 *
 * The API often returns absolute URLs like http://localhost:5000/api/images/...
 * while the SPA runs on another port (e.g. 5173). Using that URL as <img src>
 * can break when mixed content or proxy expectations differ. Paths under /api
 * are rewritten to the current page origin so the Vite proxy can serve them
 * in dev, or same-origin routing applies in prod behind one host.
 */
function rewriteApiUrlToPageOrigin(trimmed) {
  if (typeof window === 'undefined') return trimmed;
  try {
    const u = new URL(trimmed);
    if (!u.pathname.startsWith('/api')) return trimmed;
    const page = window.location;

    if (import.meta.env.DEV) {
      return `${page.origin}${u.pathname}${u.search}`;
    }

    if (page.protocol === 'https:' && u.protocol === 'http:' && u.hostname === page.hostname) {
      return `${page.origin}${u.pathname}${u.search}`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export function resolveMediaUrl(url) {
  if (url == null || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return url;

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return rewriteApiUrlToPageOrigin(trimmed);
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('/api')) {
    return trimmed;
  }

  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    window.location?.origin &&
    trimmed.startsWith('/api')
  ) {
    return `${window.location.origin}${trimmed}`;
  }

  const raw = import.meta.env.VITE_API_URL;
  let origin;
  if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    try {
      origin = new URL(raw).origin;
    } catch {
      origin = typeof window !== 'undefined' ? window.location.origin : '';
    }
  } else if (import.meta.env.DEV && (!raw || raw.startsWith('/'))) {
    origin = 'http://localhost:5000';
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  } else {
    origin = '';
  }

  if (!origin) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}

