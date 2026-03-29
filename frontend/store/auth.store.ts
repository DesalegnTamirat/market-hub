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
  setAuthData: (accessToken: string, refreshToken: string, user?: User) => void;
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
      
      setAuthData: (accessToken: string, refreshToken: string, user?: User) => {
        if (user) {
          set({ accessToken, refreshToken, user });
        } else {
          set({ accessToken, refreshToken });
        }
      },

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const { data } = await api.post<AuthResponse>(
            '/auth/login',
            credentials,
          );

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
            isLoading: false,
          });
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

          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            user: response.data.user,
            isLoading: false,
          });
        } catch (error) {
          const message = handleApiError(error);
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        const token = get().accessToken;

        // Clear state immediately to prevent loops and ensure UI updates
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });

        // ONLY call backend logout if we were actually logged in
        if (token) {
          api.post('/auth/logout', {}, { 
            // Signal to interceptor not to retry/handle 401 for this request
            ...( { _retry: true } as any )
          }).catch(() => {
            // Ignore errors, we've already cleared local state
          });
        }
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
