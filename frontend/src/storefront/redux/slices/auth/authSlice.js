import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

const initialState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
  tokenExpired: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      return await authService.loginUser(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, thunkAPI) => {
    try {
      return await authService.updateProfile(formData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, thunkAPI) => {
    try {
      return await authService.changePassword(passwordData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const signupOrLogin = createAsyncThunk(
  'auth/signupOrLogin',
  async (userData, thunkAPI) => {
    try {
      return await authService.signupOrLogin(userData);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, thunkAPI) => {
    try {
      const { authService } = await import('@/storefront/services/authService');
      await authService.logout();
      return true;
    } catch (error) {
      return true;
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, thunkAPI) => {
    try {
      const response = await authService.getCurrentUser();
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(null);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.tokenExpired = false;
    },
    setTokenExpired: (state, action) => {
      state.tokenExpired = true;
      state.user = null;
      state.isAuthenticated = false;
    },
    clearTokenExpired: (state) => {
      state.tokenExpired = false;
    },
    restoreUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.tokenExpired = false;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.tokenExpired = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(signupOrLogin.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(signupOrLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.tokenExpired = false;
      })
      .addCase(signupOrLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
        state.isAuthenticated = false;
        state.tokenExpired = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.status = 'idle';
        state.user = null;
        state.isAuthenticated = false;
        state.tokenExpired = false;
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.tokenExpired = false;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.status = 'idle';
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, setTokenExpired, clearTokenExpired, restoreUser } = authSlice.actions;
export default authSlice.reducer;
