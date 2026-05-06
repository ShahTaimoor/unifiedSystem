import axiosInstance from '../auth/axiosInstance';

// Get current user's cart
export const fetchCart = async () => {
  const res = await axiosInstance.get('/', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};

// Add or update item in cart
export const addToCart = async ({ productId, quantity }) => {
  const res = await axiosInstance.post('/add', { productId, quantity }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};

// Remove item from cart
export const removeFromCart = async (productId) => {
  const res = await axiosInstance.post('/remove', { productId }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};

// Empty cart
export const emptyCart = async () => {
  const res = await axiosInstance.post('/empty', {}, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};

// Update quantity of an item in cart
export const updateCartQuantity = async ({ productId, quantity }) => {
  const res = await axiosInstance.post('/update', { productId, quantity }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};

// Check stock availability for multiple products (before checkout)
export const checkStock = async (products) => {
  const res = await axiosInstance.post('/check-stock', { products }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data;
};
