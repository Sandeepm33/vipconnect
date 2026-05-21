import { create } from 'zustand';
import api from '@/lib/api';

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  isLoadingChats: false,
  isLoadingMessages: false,
  onlineUsers: new Set(),
  searchResults: [],
  isSearching: false,

  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const data = await api.get('/chats');
      set({ chats: data.chats, isLoadingChats: false });
    } catch (err) {
      console.error('fetchChats error:', err);
      set({ isLoadingChats: false });
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat });
  },

  fetchMessages: async (chatId, page = 1) => {
    set({ isLoadingMessages: true });
    try {
      const data = await api.get(`/messages/${chatId}?page=${page}&limit=50`);
      const existing = get().messages[chatId] || [];
      const newMessages = page === 1 ? data.messages : [...data.messages, ...existing];
      set((state) => ({
        messages: { ...state.messages, [chatId]: newMessages },
        isLoadingMessages: false,
      }));
      return data.pagination;
    } catch (err) {
      console.error('fetchMessages error:', err);
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (chatId, message) => {
    set((state) => {
      const existing = state.messages[chatId] || [];
      const isDuplicate = existing.some((m) => m._id === message._id);
      if (isDuplicate) return state;
      return {
        messages: {
          ...state.messages,
          [chatId]: [...existing, message],
        },
        chats: state.chats.map((c) =>
          c._id === chatId ? { ...c, lastMessage: message, updatedAt: new Date() } : c
        ),
      };
    });
  },

  updateMessage: (chatId, messageId, updates) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m._id === messageId ? { ...m, ...updates } : m
        ),
      },
    }));
  },

  removeMessage: (chatId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter((m) => m._id !== messageId),
      },
    }));
  },

  updateChatLastMessage: (chatId, lastMessage) => {
    set((state) => ({
      chats: state.chats
        .map((c) => (c._id === chatId ? { ...c, lastMessage, updatedAt: new Date() } : c))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }));
  },

  createChat: async (userId) => {
    const data = await api.post('/chats', { userId });
    const { chat } = data;
    set((state) => {
      const exists = state.chats.some((c) => c._id === chat._id);
      return {
        chats: exists ? state.chats : [chat, ...state.chats],
        activeChat: chat,
      };
    });
    return chat;
  },

  createGroup: async (formData) => {
    const data = await api.post('/chats/group', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { chat } = data;
    set((state) => ({ chats: [chat, ...state.chats], activeChat: chat }));
    return chat;
  },

  updateChat: (updatedChat) => {
    set((state) => ({
      chats: state.chats.map(c => c._id === updatedChat._id ? updatedChat : c),
      activeChat: state.activeChat?._id === updatedChat._id ? updatedChat : state.activeChat,
    }));
  },

  promoteAdmin: async (chatId, userId) => {
    const data = await api.put(`/chats/${chatId}/admins/${userId}`);
    get().updateChat(data.chat);
  },

  demoteAdmin: async (chatId, userId) => {
    const data = await api.delete(`/chats/${chatId}/admins/${userId}`);
    get().updateChat(data.chat);
  },

  updateGroupSettings: async (chatId, settings) => {
    const data = await api.put(`/chats/${chatId}/settings`, settings);
    get().updateChat(data.chat);
  },

  generateInviteLink: async (chatId) => {
    const data = await api.post(`/chats/${chatId}/invite`);
    // update chat's invite link
    set((state) => {
      const chat = state.chats.find(c => c._id === chatId);
      if (!chat) return state;
      const updatedChat = { ...chat, inviteLink: data.inviteLink };
      return {
        chats: state.chats.map(c => c._id === chatId ? updatedChat : c),
        activeChat: state.activeChat?._id === chatId ? updatedChat : state.activeChat,
      };
    });
    return data.inviteLink;
  },

  setTyping: (chatId, userId, userName, isTyping) => {
    set((state) => {
      const chatTyping = { ...(state.typingUsers[chatId] || {}) };
      if (isTyping) {
        chatTyping[userId] = userName;
      } else {
        delete chatTyping[userId];
      }
      return { typingUsers: { ...state.typingUsers, [chatId]: chatTyping } };
    });
  },

  setUserOnline: (userId) => {
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      return { onlineUsers: newSet };
    });
  },

  setUserOffline: (userId) => {
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    });
  },

  searchUsers: async (query) => {
    if (!query.trim()) return set({ searchResults: [], isSearching: false });
    set({ isSearching: true });
    try {
      const data = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: data.users, isSearching: false });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [], isSearching: false }),
}));

export default useChatStore;
