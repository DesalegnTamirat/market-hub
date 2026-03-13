import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';
import { api, handleApiError } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const { data } = await api.post<AuthResponse>(
            '/auth/login',
            credentials,
          );

          // Save tokens
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });

          // Get user profile
          await get().checkAuth();

          set({ isLoading: false });
        } catch (error) {
          const message = handleApiError(error);
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post<AuthResponse>('/auth/register', data);

          // Save tokens
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          });

          // Get user profile
          await get().checkAuth();

          set({ isLoading: false });
        } catch (error) {
          const message = handleApiError(error);
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Call backend logout endpoint
        api.post('/auth/logout').catch(() => {
          // Ignore errors, logout anyway
        });

        // Clear local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Clear state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      },

      checkAuth: async () => {
        try {
          const { data } = await api.get<User>('/auth/profile');
          set({ user: data });
        } catch (error) {
          // If profile check fails, clear auth
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },
    },
  ),
);
