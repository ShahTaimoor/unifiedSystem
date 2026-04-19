import axiosInstance from '../auth/axiosInstance';

const getAllCat = async (search = '') => {
    try {
        const params = {};
        if (search && search.trim()) {
            params.search = search.trim();
        }
        const axiosResponse = await axiosInstance.get('/storefront/categories', {
            params,
            headers: { 'Content-Type': 'application/json' }
        });
        return axiosResponse.data;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
};

const categoryService = { getAllCat };

export default categoryService;
