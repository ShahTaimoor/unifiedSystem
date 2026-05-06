
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/auth/authSlice'
import cartSlice from './slices/cart/cartSlice'
import categoriesReducer from './slices/categories/categoriesSlice'
import productsReducer from './slices/products/productSlice'
import ordersReducer from './slices/order/orderSlice'
import { setStoreReference } from './slices/auth/axiosInstance'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartSlice,
        products: productsReducer,
        categories: categoriesReducer,
        orders: ordersReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: [
                    'products/fetchAll/fulfilled',
                    'products/getSingleProduct/fulfilled',
                    'products/AddProduct/fulfilled',
                    'products/AddProduct/pending',
                    'products/AddProduct/rejected',
                    'products/updateSingleProduct/fulfilled',
                    'products/updateSingleProduct/pending',
                    'products/updateSingleProduct/rejected',
                    'products/importProductsFromExcel/fulfilled',
                ],
                // Ignore these field paths in all actions
                ignoredActionPaths: [
                    'payload.timestamp', 
                    'payload.error.stack',
                    'meta.arg.inputValues', // Allow FormData in updateSingleProduct and AddProduct actions
                ],
                // Ignore these paths in the state
                ignoredPaths: [
                    'products.products',
                    'products.singleProducts',
                    'auth.user',
                ],
                // Increase the warning threshold to 50ms
                warnAfter: 50,
            },
        }),
})

// Set the store reference for axiosInstance
setStoreReference(store)
