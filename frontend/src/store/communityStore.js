import { create } from 'zustand';
import api from '@/lib/api';

const useCommunityStore = create((set, get) => ({
  communities: [],
  isLoading: false,

  fetchCommunities: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get('/communities');
      set({ communities: data.communities, isLoading: false });
    } catch (err) {
      console.error('fetchCommunities error:', err);
      set({ isLoading: false });
    }
  },

  createCommunity: async (formData) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/communities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({
        communities: [data.community, ...state.communities],
        isLoading: false,
      }));
      return { success: true, community: data.community };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  addGroupToCommunity: async (communityId, chatId) => {
    try {
      const data = await api.post(`/communities/${communityId}/groups`, { chatId });
      set((state) => ({
        communities: state.communities.map((c) =>
          c._id === communityId ? data.community : c
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  broadcastAnnouncement: async (communityId, content) => {
    try {
      await api.post(`/communities/${communityId}/broadcast`, { content });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
}));

export default useCommunityStore;
