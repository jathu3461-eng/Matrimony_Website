import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/services/tokenStorage';
import type { AuthResponse, User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  expiresAt: number | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk<AuthResponse, { email: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const auth = await authApi.mobileLogin({ email, password });
      await tokenStorage.saveTokens(auth);
      await tokenStorage.saveUser(auth.user);
      return auth;
    } catch (err) {
      return rejectWithValue(String(err));
    }
  }
);

export const logout = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
  'auth/logout',
  async (_, { getState }) => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      await authApi.mobileLogout(refreshToken);
    }
    await tokenStorage.clear();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.status = 'authenticated';
      state.error = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.expiresAt = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.expiresAt = action.payload.expiresAt;
        state.status = 'authenticated';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload ?? 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.expiresAt = null;
        state.status = 'unauthenticated';
      });
  },
});

export const { setAuthenticated, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
