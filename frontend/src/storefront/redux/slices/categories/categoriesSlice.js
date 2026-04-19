import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import categoryService from "./categoriesService";

export const AllCategory = createAsyncThunk(
    'categories/allCategory',
    async (search = '', thunkAPI) => {
        try {
            const res = await categoryService.getAllCat(search);
            return res;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    }
);

const initialState = {
    categories: [],
    status: 'idle',
    error: null
};

const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(AllCategory.pending, (state) => { state.status = 'loading'; })
            .addCase(AllCategory.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.categories = Array.isArray(action.payload?.data) ? action.payload.data : [];
            })
            .addCase(AllCategory.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    }
});

export default categoriesSlice.reducer;
