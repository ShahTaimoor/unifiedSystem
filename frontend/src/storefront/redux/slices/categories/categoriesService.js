import axiosInstance from "../auth/axiosInstance";

// all category
const getAllCat = async (search = "") => {
  try {
    const axiosResponse = await axiosInstance.get("/all-category", {
      params: { search },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong while fetching categories";
    return Promise.reject(errorMessage);
  }
};

// single category
const getSingleCat = async (slug) => {
  try {
    const axiosResponse = await axiosInstance.get(`/single-category/${slug}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return axiosResponse.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong while fetching category";
    return Promise.reject(errorMessage);
  }
};

const categoryService = {
  getAllCat,
  getSingleCat,
};

export default categoryService;
