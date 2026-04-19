const STORAGE_KEY = 'ecomerce_cart_v1';

export function loadCartState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    // Ensure all products have _id for component compatibility
    const normalizedItems = items.map(item => ({
      ...item,
      product: item.product ? { ...item.product, _id: item.product._id || item.product.id } : item.product
    }));
    return { items: normalizedItems };
  } catch {
    return { items: [] };
  }
}

export function saveCartState(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
}
