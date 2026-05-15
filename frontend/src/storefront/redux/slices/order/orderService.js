import axiosInstance from "../auth/axiosInstance";

// Get Orders By User ID
const getAllOrder = async () => {
  try {
    const axiosResponse = await axiosInstance.get("/get-orders-by-user-id", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred while fetching orders.";
    return Promise.reject(errorMessage);
  }
};

// Add New E-commerce Order
const addOrder = async (orderData) => {
  try {
    const axiosResponse = await axiosInstance.post("/order", orderData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred while adding the order.";
    return Promise.reject(errorMessage);
  }
};

const orderService = {
  getAllOrder,
  addOrder,
};

export default orderService;
