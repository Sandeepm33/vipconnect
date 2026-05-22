import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { initSocket, disconnectSocket } from '@/lib/socket';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.post('/auth/login', { email, password });
          const { token, user } = data;
          localStorage.setItem('vipconnect_token', token);
          initSocket(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.message };
        }
      },

      register: async (name, email, password, phone) => {
        set({ isLoading: true });
        try {
          const data = await api.post('/auth/register', { name, email, password, phone });
          const { token, user } = data;
          localStorage.setItem('vipconnect_token', token);
          initSocket(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.message };
        }
      },

      logout: () => {
        localStorage.removeItem('vipconnect_token');
        localStorage.removeItem('vipconnect_user');
        disconnectSocket();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updatedUser) => {
        set({ user: { ...get().user, ...updatedUser } });
      },

      fetchMe: async () => {
        try {
          const token = localStorage.getItem('vipconnect_token');
          if (!token) return;
          const data = await api.get('/auth/me');
          set({ user: data.user, isAuthenticated: true });
          if (!get().token) set({ token });
        } catch (err) {
          // Only clear auth state on a real auth failure (401), not network errors
          if (err.message?.includes('authorized') || err.message?.includes('not found') || err.message?.includes('invalid')) {
            localStorage.removeItem('vipconnect_token');
            set({ user: null, token: null, isAuthenticated: false });
          }
          // Otherwise keep existing state so a temporary network error doesn't log out the user
        }
      },

      setUserOnline: (userId, status) => {
        const { user } = get();
        if (user?._id === userId) {
          set({ user: { ...user, status } });
        }
      },
    }),
    {
      name: 'vipconnect-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
