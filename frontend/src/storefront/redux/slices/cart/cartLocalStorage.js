const STORAGE_KEY = 'ecomerce_cart_v1';

export function loadCartState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

export function saveCartState(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
}
