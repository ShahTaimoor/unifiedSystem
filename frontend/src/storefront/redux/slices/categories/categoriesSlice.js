import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import categoryService from "./categoriesService";

export const AllCategory = createAsyncThunk(
  "categories/allCategory",
  async (search = "", thunkAPI) => {
    try {
      const res = await categoryService.getAllCat(search);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

export const SingleCategory = createAsyncThunk(
  "categories/singleCategory",
  async (slug, thunkAPI) => {
    try {
      const res = await categoryService.getSingleCat(slug);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const normalizeCategoryImage = (category) => {
  if (!category) return category;
  return {
    ...category,
    image:
      category.image ||
      category.imageUrl ||
      category.picture?.secure_url ||
      category.picture?.url ||
      null,
  };
};

const initialState = {
  categories: [],
  status: "idle",
  error: null,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(AllCategory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(AllCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = Array.isArray(action.payload?.data)
          ? action.payload.data.map(normalizeCategoryImage)
          : [];
      })
      .addCase(AllCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(SingleCategory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(SingleCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = normalizeCategoryImage(action.payload.data);
      })
      .addCase(SingleCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default categoriesSlice.reducer;
