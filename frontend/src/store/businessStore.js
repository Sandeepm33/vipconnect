import { create } from 'zustand';
import api from '@/lib/api';
import useAuthStore from './authStore';

const useBusinessStore = create((set, get) => ({
  catalog: [],
  isLoading: false,

  fetchCatalog: async (userId) => {
    set({ isLoading: true });
    try {
      const data = await api.get(`/business/catalog/${userId}`);
      set({ catalog: data.products, isLoading: false });
    } catch (err) {
      console.error('fetchCatalog error:', err);
      set({ isLoading: false });
    }
  },

  addProduct: async (formData) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/business/catalog', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({
        catalog: [data.product, ...state.catalog],
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  deleteProduct: async (productId) => {
    try {
      await api.delete(`/business/catalog/${productId}`);
      set((state) => ({
        catalog: state.catalog.filter((p) => p._id !== productId),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateBusinessProfile: async (settings) => {
    set({ isLoading: true });
    try {
      const data = await api.put('/business/profile', settings);
      // Sync with user details in authStore
      useAuthStore.getState().updateUser(data.user);
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },
}));

export default useBusinessStore;
