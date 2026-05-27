'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import useSocket from '@/hooks/useSocket';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import useAuthStore from '@/store/authStore';
import useChatStore from '@/store/chatStore';
import useAIStore from '@/store/aiStore';

export default function MessageInput({ chatId, editingMessage, onCancelEdit }) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const { sendMessage, sendTypingStart, sendTypingStop, notifyFileSent, editMessage } = useSocket();
  const activeChat = useChatStore((s) => s.activeChat);
  const { user } = useAuthStore();
  const { summarizeConversation } = useAIStore();
  
  const messages = useChatStore((s) => s.messages[chatId] || []);
  const [aiSummary, setAiSummary] = useState('');

  const isAdmin = activeChat?.admins?.some((a) => a._id === user?._id || a === user?._id);
  const restricted = activeChat?.isGroup && activeChat?.settings?.adminOnlyMessage && !isAdmin;

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
    } else {
      setMessage('');
    }
  }, [editingMessage]);

  const handleTyping = useCallback(() => {
    sendTypingStart(chatId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTypingStop(chatId), 2000);
  }, [chatId, sendTypingStart, sendTypingStop]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      sendTypingStop(chatId);
    }
    if (editingMessage) {
      editMessage(chatId, editingMessage._id, message.trim());
      onCancelEdit?.();
    } else {
      sendMessage(chatId, message.trim());
    }
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      return toast.error('File too large. Maximum size is 50MB');
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api.post(`/uploads/message/${chatId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notifyFileSent(chatId, data.message._id);
      toast.success('File sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAiSummarize = async () => {
    if (messages.length === 0) return;
    const textArray = messages.slice(-15).map(m => `${m.sender?.name || 'User'}: ${m.content}`);
    const res = await summarizeConversation(textArray);
    if (res.success) {
      setAiSummary(res.summary);
    }
  };

  if (restricted) {
    return (
      <div className="flex-shrink-0 px-4 py-4 bg-chat-header border-t border-chat-border text-center">
        <p className="text-sm text-gray-400 bg-chat-panel inline-block px-4 py-2 rounded-full border border-chat-border">
          Only admins can send messages
        </p>
      </div>
    );
  }

  // Quick replies conditions
  const showQuickReplies = message.startsWith('/') && user?.quickReplies?.length > 0;
  const filterQuery = message.slice(1).toLowerCase();
  const matchedReplies = user?.quickReplies?.filter(q => q.trigger.toLowerCase().startsWith(filterQuery)) || [];

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-chat-header border-t border-chat-border flex flex-col gap-2 relative">
      {/* Floating Quick Replies popover */}
      {showQuickReplies && matchedReplies.length > 0 && (
        <div className="absolute bottom-16 left-4 right-4 max-h-48 overflow-y-auto rounded-2xl border border-white/10 p-2 shadow-2xl z-[90] space-y-1"
             style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 py-1">Quick Replies</p>
          {matchedReplies.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMessage(q.reply);
                // Adjust textarea height if needed
                const el = document.getElementById(`message-input-${chatId}`);
                if (el) el.style.height = 'auto';
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex justify-between items-center"
            >
              <span className="font-bold text-primary-400">/{q.trigger}</span>
              <span className="text-gray-400 truncate max-w-[70%]">{q.reply}</span>
            </button>
          ))}
        </div>
      )}

      {/* AI Summary banner overlay */}
      {aiSummary && (
        <div className="bg-primary-500/10 border border-primary-500/20 px-4 py-3 rounded-2xl text-xs text-gray-300 flex flex-col gap-1.5 relative">
          <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">ConnectX AI Summary</span>
          <p className="whitespace-pre-line leading-relaxed">{aiSummary}</p>
          <button
            onClick={() => setAiSummary('')}
            className="absolute right-3 top-3 text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Action helpers deck */}
      {messages.length > 0 && !aiSummary && (
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            onClick={handleAiSummarize}
            className="px-2.5 py-1 rounded-full bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-[10px] font-bold text-primary-400 hover:text-white transition flex items-center gap-1 active:scale-95"
          >
            ✨ Summarize Chat
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="flex items-center justify-between bg-dark-600 px-4 py-2 rounded-xl text-sm border border-chat-border">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-gray-300">Editing message</span>
          </div>
          <button onClick={onCancelEdit} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* File attachments */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.mp3,.wav,.ogg"
            className="hidden"
            id={`file-upload-${chatId}`}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach file"
            className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
                setTimeout(() => {
                  if (fileInputRef.current) fileInputRef.current.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.mp3,.wav,.ogg';
                }, 500);
              }
            }}
            title="Send image"
            className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            id={`message-input-${chatId}`}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full bg-chat-input border border-chat-border rounded-2xl px-4 py-3 pr-12 text-gray-200 placeholder-gray-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all resize-none max-h-32 scrollbar-thin text-sm leading-relaxed"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />

          <button
            className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-300 transition-colors"
            title="Emoji drawer (coming soon)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Send triggers */}
        <button
          id={`send-btn-${chatId}`}
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className={`p-3 rounded-2xl transition-all flex-shrink-0 ${
            message.trim()
              ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 active:scale-95'
              : 'bg-dark-600 text-gray-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
