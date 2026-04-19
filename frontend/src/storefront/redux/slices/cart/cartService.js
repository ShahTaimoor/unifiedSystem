import axiosInstance from '../auth/axiosInstance';
import { loadCartState, saveCartState } from './cartLocalStorage';

export const fetchCart = async () => loadCartState();

export const addToCart = async ({ productId, quantity, product }) => {
  if (!product || !(product._id || product.id)) {
    return Promise.reject('Product data is required to add to cart.');
  }
  const p = { ...product, _id: product._id || product.id };
  const { items } = loadCartState();
  const idx = items.findIndex((i) => String(i.product?._id) === String(productId));
  if (idx >= 0) {
    items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
  } else {
    items.push({ product: p, quantity });
  }
  saveCartState(items);
  return { items };
};

export const removeFromCart = async (productId) => {
  const { items } = loadCartState();
  const next = items.filter((i) => String(i.product?._id) !== String(productId));
  saveCartState(next);
  return { items: next };
};

export const emptyCart = async () => {
  saveCartState([]);
  return { items: [] };
};

export const updateCartQuantity = async ({ productId, quantity }) => {
  const { items } = loadCartState();
  const idx = items.findIndex((i) => String(i.product?._id) === String(productId));
  if (idx < 0) return { items };
  if (quantity <= 0) {
    items.splice(idx, 1);
  } else {
    items[idx] = { ...items[idx], quantity };
  }
  saveCartState(items);
  return { items };
};

export const checkStock = async (products) => {
  const res = await axiosInstance.post(
    '/storefront/check-stock',
    { products },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};
