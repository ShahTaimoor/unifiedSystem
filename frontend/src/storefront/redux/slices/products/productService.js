import axiosInstance from '../auth/axiosInstance';

// Create product
const createProduct = async (inputValues) => {
    try {
        const axiosResponse = await axiosInstance.post(
            '/create-product',
            inputValues,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

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

// update product
const updateProd = async ({ inputValues, id }) => {
    try {
        const axiosResponse = await axiosInstance.put(
            `/update-product/${id}`,
            inputValues,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// delete product
const deleteProduct = async (id) => {
    try {
        const axiosResponse = await axiosInstance.delete(
            `/delete-product/${id}`,
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

// import products from Excel
const importProductsFromExcel = async (excelFile) => {
    try {
        const formData = new FormData();
        formData.append('excelFile', excelFile);
        
        const axiosResponse = await axiosInstance.post(
            '/import-excel',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            }
        );
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

// update product stock status
const updateProductStock = async ({ id, stock }) => {
    try {
        const axiosResponse = await axiosInstance.put(
            `/update-product-stock/${id}`,
            { stock },
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

// bulk update featured status
const bulkUpdateFeatured = async ({ productIds, isFeatured }) => {
    try {
        const axiosResponse = await axiosInstance.put(
            '/bulk-update-featured',
            { productIds, isFeatured },
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
    createProduct, 
    allProduct, 
    getSingleProd, 
    updateProd, 
    deleteProduct, 
    importProductsFromExcel, 
    updateProductStock, 
    bulkUpdateFeatured,
    searchProducts,
    searchSuggestions
};

export default productService;
