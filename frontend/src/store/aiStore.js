import { create } from 'zustand';
import api from '@/lib/api';

const useAIStore = create((set, get) => ({
  aiMessages: [
    { sender: 'ai', content: 'Hello! I am ConnectX AI. I can translate messages, summarize conversations, generate profile avatars, and answer questions. How can I help you today?', createdAt: new Date() }
  ],
  isLoading: false,

  sendAIMessage: async (text) => {
    const userMsg = { sender: 'user', content: text, createdAt: new Date() };
    set((state) => ({
      aiMessages: [...state.aiMessages, userMsg],
      isLoading: true,
    }));

    try {
      const data = await api.post('/ai/chat', { message: text });
      const aiReply = { sender: 'ai', content: data.reply, createdAt: new Date() };
      set((state) => ({
        aiMessages: [...state.aiMessages, aiReply],
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      const errorReply = { sender: 'ai', content: `Error: ${err.message}`, createdAt: new Date() };
      set((state) => ({
        aiMessages: [...state.aiMessages, errorReply],
        isLoading: false,
      }));
      return { success: false, error: err.message };
    }
  },

  translateText: async (text, targetLanguage) => {
    try {
      const data = await api.post('/ai/translate', { text, targetLanguage });
      return { success: true, translatedText: data.translatedText };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  generateAIImage: async (prompt) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/ai/generate', { prompt });
      set({ isLoading: false });
      return { success: true, imageUrl: data.imageUrl };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  summarizeConversation: async (messagesArray) => {
    try {
      const data = await api.post('/ai/summarize', { messages: messagesArray });
      return { success: true, summary: data.summary };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
}));

export default useAIStore;
