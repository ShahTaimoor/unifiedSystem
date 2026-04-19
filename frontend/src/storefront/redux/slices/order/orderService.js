import axiosInstance from '../auth/axiosInstance';

const getAllOrder = async () => {
  try {
    const axiosResponse = await axiosInstance.get('/storefront/orders', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred while fetching orders.';
    return Promise.reject(errorMessage);
  }
};

const addOrder = async (orderData) => {
  try {
    const body = {
      products: (orderData.products || []).map((p) => ({
        id: p.id || p._id,
        _id: p.id || p._id,
        quantity: p.quantity,
      })),
      address: orderData.address,
      phone: orderData.phone,
      city: orderData.city,
      amount: orderData.amount,
    };
    const axiosResponse = await axiosInstance.post('/storefront/orders', body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred while adding the order.';
    return Promise.reject(errorMessage);
  }
};

const cancelOrder = async (orderId) => {
  try {
    const axiosResponse = await axiosInstance.put(
      `/storefront/orders/${orderId}/cancel`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Could not cancel this order.';
    return Promise.reject(errorMessage);
  }
};

const orderService = { getAllOrder, addOrder, cancelOrder };

export default orderService;
