import axiosInstance from '../auth/axiosInstance';

const allProduct = async (category = 'all', page = 1, limit = 24, stockFilter = 'active', sortBy = 'az') => {
    try {
      const params = { page, limit };
      if (category && category !== 'all') {
        params.category = category;
      }
      const response = await axiosInstance.get('/storefront/products', {
        params,
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

const getSingleProd = async (id) => {
    try {
        const axiosResponse = await axiosInstance.get(`/storefront/products/${id}`, {
            headers: { 'Content-Type': 'application/json' },
        });
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

const searchProducts = async (query, limit = 20, page = 1) => {
    try {
        const response = await axiosInstance.get('/storefront/search', {
            params: { q: query, limit, page },
            headers: { 'Content-Type': 'application/json' },
        });
        return response.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

const searchSuggestions = async (query, limit = 8) => {
    try {
        const response = await axiosInstance.get('/storefront/search-suggestions', {
            params: { q: query, limit },
            headers: { 'Content-Type': 'application/json' },
        });
        return response.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

const productService = {
    allProduct,
    getSingleProd,
    searchProducts,
    searchSuggestions
};

export default productService;
