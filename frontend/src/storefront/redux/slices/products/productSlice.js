import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productService from "./productService";

export const AddProduct = createAsyncThunk(
    'products/AddProduct',
    async (inputValues, thunkAPI) => {
        try {
            const res = await productService.createProduct(inputValues);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

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

export const updateSingleProduct = createAsyncThunk(
    "products/updateSingleProduct",
    async ({ id, inputValues }, thunkAPI) => {
        try {
            const res = await productService.updateProd({ id, inputValues });
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const deleteSingleProduct = createAsyncThunk(
    'products/deleteSingleProduct',
    async (id, thunkAPI) => {
        try {
            const res = await productService.deleteProduct(id);
            return { id, ...res };
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const importProductsFromExcel = createAsyncThunk(
    'products/importProductsFromExcel',
    async (excelFile, thunkAPI) => {
        try {
            const res = await productService.importProductsFromExcel(excelFile);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const updateProductStock = createAsyncThunk(
    'products/updateProductStock',
    async ({ id, stock }, thunkAPI) => {
        try {
            const res = await productService.updateProductStock({ id, stock });
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

export const bulkUpdateFeatured = createAsyncThunk(
    'products/bulkUpdateFeatured',
    async ({ productIds, isFeatured }, thunkAPI) => {
        try {
            const res = await productService.bulkUpdateFeatured({ productIds, isFeatured });
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

export const fetchLowStockCount = createAsyncThunk(
    'products/fetchLowStockCount',
    async (_, thunkAPI) => {
        try {
            const axiosInstance = (await import('../auth/axiosInstance')).default;
            const response = await axiosInstance.get('/low-stock-count', {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data.count || 0;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to fetch low stock count');
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
    lowStockCount: 0,
    // Search state
    searchResults: [],
    searchStatus: 'idle',
    searchQuery: '',
    searchPagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
    },
    // Suggestions state
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
            .addCase(AddProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(AddProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const newProduct = action.payload.product;
                
                // Transform the product to match the expected structure
                const transformedProduct = {
                    ...newProduct,
                    image: newProduct.picture?.secure_url || null
                };
                
                state.products.push(transformedProduct);
            })
            .addCase(AddProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
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
            .addCase(updateSingleProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
           .addCase(updateSingleProduct.fulfilled, (state, action) => {
  state.status = 'succeeded';
  const updatedProduct = action.payload.product;

  if (!updatedProduct || !updatedProduct._id) {
    return;
  }

  // Get the image URL from the updated product
  const imageUrl = updatedProduct.picture?.secure_url || updatedProduct.image || null;
  
  // Get existing image URL to compare
  const existingProduct = state.products.find(p => {
    const compareIds = (id1, id2) => {
      if (!id1 || !id2) return false;
      return String(id1) === String(id2);
    };
    return compareIds(p._id, updatedProduct._id);
  });
  const existingImageUrl = existingProduct?.image || existingProduct?.picture?.secure_url || null;
  
  // Check if image actually changed
  const imageChanged = existingImageUrl !== imageUrl;
  
  // Transform the updated product - ensure picture object and image field are both set
  const transformedProduct = {
    ...updatedProduct,
    // Ensure picture object is properly structured
    picture: updatedProduct.picture || (imageUrl ? { secure_url: imageUrl } : null),
    // Set image field for backward compatibility
    image: imageUrl,
    // Add timestamp to force image reload - always update timestamp if image changed
    _imageUpdated: imageChanged ? Date.now() : (existingProduct?._imageUpdated || Date.now())
  };

  // Helper function to compare IDs (handle string vs ObjectId)
  const compareIds = (id1, id2) => {
    if (!id1 || !id2) return false;
    return String(id1) === String(id2);
  };

  // Find and update the product in the products list
  // Merge with existing product to preserve all fields
  const productsIndex = state.products.findIndex(p => compareIds(p._id, updatedProduct._id));
  if (productsIndex !== -1) {
    // Create a new object to ensure React detects the change
    const existingProduct = state.products[productsIndex];
    // Create a completely new object to force React re-render
    const updatedProductObj = {
      ...existingProduct,
      ...transformedProduct,
      // Ensure category is preserved if it exists in the updated product
      category: transformedProduct.category || existingProduct.category,
      // Force update picture and image fields
      picture: transformedProduct.picture,
      image: transformedProduct.image,
      _imageUpdated: transformedProduct._imageUpdated
    };
    // Replace the entire array to ensure reference change
    state.products = [
      ...state.products.slice(0, productsIndex),
      updatedProductObj,
      ...state.products.slice(productsIndex + 1)
    ];
  }

  // Also update in searchResults if it exists
  if (state.searchResults && Array.isArray(state.searchResults)) {
    const searchIndex = state.searchResults.findIndex(p => compareIds(p._id, updatedProduct._id));
    if (searchIndex !== -1) {
      // Create a new object to ensure React detects the change
      const existingProduct = state.searchResults[searchIndex];
      const updatedSearchProduct = {
        ...existingProduct,
        ...transformedProduct,
        // Ensure category is preserved if it exists in the updated product
        category: transformedProduct.category || existingProduct.category,
        // Force update picture and image fields
        picture: transformedProduct.picture,
        image: transformedProduct.image,
        _imageUpdated: transformedProduct._imageUpdated
      };
      // Replace the entire array to ensure reference change
      state.searchResults = [
        ...state.searchResults.slice(0, searchIndex),
        updatedSearchProduct,
        ...state.searchResults.slice(searchIndex + 1)
      ];
    }
  }

  // Update singleProducts if it's the same product
  if (state.singleProducts && compareIds(state.singleProducts._id, updatedProduct._id)) {
    state.singleProducts = {
      ...state.singleProducts,
      ...transformedProduct,
      category: transformedProduct.category || state.singleProducts.category,
      picture: transformedProduct.picture,
      image: transformedProduct.image,
      _imageUpdated: transformedProduct._imageUpdated
    };
  }
})
            .addCase(updateSingleProduct.rejected, (state, action) => {
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
            .addCase(deleteSingleProduct.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteSingleProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = state.products.filter(prod => prod._id !== action.payload.id);
            })
            .addCase(deleteSingleProduct.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(importProductsFromExcel.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(importProductsFromExcel.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Refresh products after successful import
                // The products will be refetched by the component
            })
            .addCase(importProductsFromExcel.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateProductStock.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateProductStock.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const updatedProduct = action.payload.product;
                
                // Find and update the product in the current list
                const index = state.products.findIndex(p => p._id === updatedProduct._id);
                if (index !== -1) {
                    state.products[index] = {
                        ...state.products[index],
                        stock: updatedProduct.stock
                    };
                }
            })
            .addCase(updateProductStock.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(bulkUpdateFeatured.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(bulkUpdateFeatured.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const { productIds, isFeatured } = action.meta.arg;
                
                // Update all selected products in the current list
                state.products = state.products.map(product => {
                    if (productIds.includes(product._id)) {
                        return {
                            ...product,
                            isFeatured: isFeatured
                        };
                    }
                    return product;
                });
            })
            .addCase(bulkUpdateFeatured.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchLowStockCount.fulfilled, (state, action) => {
                state.lowStockCount = action.payload;
            })
            .addCase(fetchLowStockCount.rejected, (state) => {
                state.lowStockCount = 0;
            })
            // Search products
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
            // Search suggestions
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
            })

    }
});

export const { clearSearchResults, clearSuggestions } = productsSlice.actions;
export default productsSlice.reducer;
