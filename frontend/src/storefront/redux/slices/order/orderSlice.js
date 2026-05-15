import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import orderService from "./orderService";

// Add Order
export const addOrder = createAsyncThunk(
  'orders/addOrder',
  async (orderData, thunkAPI) => {
    try {
      const res = await orderService.addOrder(orderData);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// Fetch Orders (User)
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, thunkAPI) => {
    try {
      const res = await orderService.getAllOrder();
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const initialState = {
  orders: [],
  status: 'idle',
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Orders (User)
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload.data;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Add Order
      .addCase(addOrder.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders.push(action.payload.data);
      })
      .addCase(addOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
  },
});

export default ordersSlice.reducer;
