import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import httpClient from '../../services/httpClient';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
  error: string | null;
  checkingAuth: boolean;
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    checkingAuth: false,
  };

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await httpClient.post('/auth/login', credentials);
      const { access_token, user } = response.data;
      localStorage.setItem('access_token', access_token);
      return { user };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.get('/auth/check');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
      }
      return rejectWithValue(error.response?.data || 'Authentication failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem('access_token');
    }
  },
  extraReducers: (builder) => {
    // Login actions
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      toast.success('Login successful');
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });
    
    // Logout actions
    builder.addCase(logout.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.isLoading = false;
      toast.info('Logged out successfully');
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.isLoading = false;
      toast.error(action.payload as string);
    });
    
    // Check auth actions
    builder.addCase(checkAuth.pending, (state) => {
      state.checkingAuth = true;
      state.isLoading = true;
    });
    builder.addCase(checkAuth.fulfilled, (state, action) => {
      state.checkingAuth = false;
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
    });
    builder.addCase(checkAuth.rejected, (state) => {
      state.checkingAuth = false;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
    });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;