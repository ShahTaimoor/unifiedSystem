import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productService from "./productService";

export const fetchProducts = createAsyncThunk(
    "products/fetchAll",
    async ({ category, page = 1, limit = 24, stockFilter, sortBy = 'az' }, thunkAPI) => {
        try {
            const res = await productService.allProduct(category, page, limit, stockFilter, sortBy);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const getSingleProduct = createAsyncThunk(
    "products/getSingleProduct",
    async (id, thunkAPI) => {
        try {
            const res = await productService.getSingleProd(id);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const searchProducts = createAsyncThunk(
    'products/searchProducts',
    async ({ query, limit = 20, page = 1 }, thunkAPI) => {
        try {
            const res = await productService.searchProducts(query, limit, page);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const fetchSearchSuggestions = createAsyncThunk(
    'products/fetchSearchSuggestions',
    async ({ query, limit = 8 }, thunkAPI) => {
        try {
            const res = await productService.searchSuggestions(query, limit);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

const initialState = {
    products: [],
    singleProducts: null,
    status: 'idle',
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    searchResults: [],
    searchStatus: 'idle',
    searchQuery: '',
    searchPagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    },
    suggestions: {
        products: [],
        categories: []
    },
    suggestionsStatus: 'idle',
    suggestionsQuery: ''
};

export const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSearchResults: (state) => {
            state.searchResults = [];
            state.searchQuery = '';
            state.searchStatus = 'idle';
            state.searchPagination = {
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0
            };
        },
        clearSuggestions: (state) => {
            state.suggestions = { products: [], categories: [] };
            state.suggestionsQuery = '';
            state.suggestionsStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const { data, pagination } = action.payload || {};
                state.products = data || [];
                state.currentPage = pagination?.page || 1;
                state.totalPages = pagination?.totalPages || 1;
                state.totalItems = pagination?.total || 0;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(getSingleProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getSingleProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.singleProducts = action.payload.product;
            })
            .addCase(getSingleProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(searchProducts.pending, (state) => {
                state.searchStatus = 'loading';
                state.error = null;
            })
            .addCase(searchProducts.fulfilled, (state, action) => {
                state.searchStatus = 'succeeded';
                const { data, query, pagination } = action.payload || {};
                state.searchResults = data || [];
                state.searchQuery = query || '';
                state.searchPagination = pagination || {
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 0
                };
            })
            .addCase(searchProducts.rejected, (state, action) => {
                state.searchStatus = 'failed';
                state.error = action.payload;
                state.searchResults = [];
            })
            .addCase(fetchSearchSuggestions.pending, (state) => {
                state.suggestionsStatus = 'loading';
            })
            .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
                state.suggestionsStatus = 'succeeded';
                const { data, query } = action.payload || {};
                state.suggestions = data || { products: [], categories: [] };
                state.suggestionsQuery = query || '';
            })
            .addCase(fetchSearchSuggestions.rejected, (state) => {
                state.suggestionsStatus = 'failed';
                state.suggestions = { products: [], categories: [] };
            });
    }
});

export const { clearSearchResults, clearSuggestions } = productsSlice.actions;
export default productsSlice.reducer;
