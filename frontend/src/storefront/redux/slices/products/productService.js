import axiosInstance from '../auth/axiosInstance';

// all product
const allProduct = async (category = 'all', page = 1, limit = 2000, stockFilter = 'active', sortBy = 'az') => {
    try {
      const response = await axiosInstance.get(
        '/get-products',
        {
          params: { category, page, limit, stockFilter: stockFilter || 'active', sortBy },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Something went wrong';
      return Promise.reject(errorMessage);
    }
};

// single product
const getSingleProd = async (id) => {
    try {
        const axiosResponse = await axiosInstance.get(
            `/single-product/${id}`,
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// search products
const searchProducts = async (query, limit = 20, page = 1) => {
    try {
        const response = await axiosInstance.get(
            '/search',
            {
                params: { q: query, limit, page },
                headers: { 'Content-Type': 'application/json' },
            }
        );
        return response.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// search suggestions (autocomplete)
const searchSuggestions = async (query, limit = 8) => {
    try {
        const response = await axiosInstance.get(
            '/search-suggestions',
            {
                params: { q: query, limit },
                headers: { 'Content-Type': 'application/json' },
            }
        );
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
