import { create } from 'zustand';
import api from '@/lib/api';

const useStatusStore = create((set, get) => ({
  statuses: [],
  isLoading: false,

  fetchStatuses: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get('/status');
      set({ statuses: data.statuses, isLoading: false });
    } catch (err) {
      console.error('fetchStatuses error:', err);
      set({ isLoading: false });
    }
  },

  postTextStatus: async (text, backgroundColor = '#7c3aed', privacy = 'everyone') => {
    set({ isLoading: true });
    try {
      const data = await api.post('/status', { text, backgroundColor, privacy });
      set((state) => ({
        statuses: [data.status, ...state.statuses],
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  postMediaStatus: async (formData) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({
        statuses: [data.status, ...state.statuses],
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  viewStatus: async (statusId) => {
    try {
      await api.post(`/status/${statusId}/view`);
      // Update local view count/status if needed
      get().fetchStatuses();
    } catch (err) {
      console.error('viewStatus error:', err);
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await api.delete(`/status/${statusId}`);
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
}));

export default useStatusStore;
