'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import useAuthStore from '@/store/authStore';
import { format, isToday, isYesterday } from 'date-fns';

function formatChatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yy');
}

function getMessageIcon(lastMsg) {
  if (!lastMsg) return null;
  if (lastMsg.deletedForEveryone) return '🚫';
  if (lastMsg.type === 'image') return '📷';
  if (lastMsg.type === 'document') return '📎';
  if (lastMsg.type === 'audio') return '🎤';
  return null;
}

function getMessagePreview(lastMsg) {
  if (!lastMsg) return 'No messages yet';
  if (lastMsg.deletedForEveryone) return 'Message deleted';
  if (lastMsg.type === 'image') return 'Photo';
  if (lastMsg.type === 'document') return lastMsg.file?.originalName || 'Document';
  if (lastMsg.type === 'audio') return 'Voice message';
  if (lastMsg.type === 'system') return lastMsg.content;
  return lastMsg.content;
}

// Gradient palette per initial letter
const gradients = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-pink-700',
];

function getGradient(name) {
  const code = (name?.charCodeAt(0) || 0) % gradients.length;
  return gradients[code];
}

function ChatItem({ chat, isActive }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { onlineUsers } = useChatStore();
  const [pressed, setPressed] = useState(false);

  const otherMember = !chat.isGroup
    ? chat.members?.find((m) => m._id !== user?._id)
    : null;

  const displayName = chat.isGroup ? chat.name : otherMember?.name || 'Unknown';
  const avatarUrl = chat.isGroup ? chat.groupPicture?.url : otherMember?.avatar?.url;
  const initials = displayName?.charAt(0)?.toUpperCase() || '?';
  const isOnline = otherMember && onlineUsers.has(otherMember._id);
  const gradient = getGradient(displayName);

  const lastMsg = chat.lastMessage;
  const icon = getMessageIcon(lastMsg);
  const preview = getMessagePreview(lastMsg);
  const isMine = lastMsg?.sender?._id === user?._id;
  const timeStr = formatChatTime(chat.updatedAt);

  return (
    <div
      onClick={() => router.push(`/chat?id=${chat._id}`)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={`relative flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-primary-500/12 to-transparent border-l-[3px] border-primary-500'
          : 'border-l-[3px] border-transparent hover:bg-white/4'
      } ${pressed ? 'scale-[0.99]' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-13 h-13 w-[52px] h-[52px] rounded-2xl overflow-hidden shadow-lg transition-transform duration-200 group-hover:scale-105 ${
          isActive ? 'ring-2 ring-primary-500/60 shadow-primary-500/20' : ''
        }`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">{initials}</span>
            </div>
          )}
        </div>
        {/* Online dot */}
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-500 rounded-full border-2"
            style={{ borderColor: '#111827' }}
          />
        )}
        {/* Group icon badge */}
        {chat.isGroup && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: '#111827' }}
          >
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`font-semibold text-sm truncate transition-colors ${
            isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'
          }`}>
            {displayName}
          </span>
          <span className={`text-[11px] flex-shrink-0 ml-2 font-medium ${
            isActive ? 'text-primary-400' : 'text-gray-500'
          }`}>
            {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isMine && (
            <svg className="w-3 h-3 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
          {icon && (
            <span className="text-xs">{icon}</span>
          )}
          <p className={`text-xs truncate ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
            {preview}
          </p>
        </div>
      </div>

      {/* Active right accent glow */}
      {isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-primary-500/80 shadow-sm shadow-primary-500" />
      )}
    </div>
  );
}

export default function ChatList() {
  const { chats, isLoadingChats, fetchChats } = useChatStore();
  const searchParams = useSearchParams();
  const rawId = searchParams ? searchParams.get('id') : null;
  const id = (rawId === 'undefined' || rawId === 'null') ? null : rawId;

  useEffect(() => {
    fetchChats();
  }, []);

  if (isLoadingChats) {
    return (
      <div className="flex flex-col gap-1 px-3 pt-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-3 animate-pulse">
            <div className="w-[52px] h-[52px] rounded-2xl bg-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/5 rounded-full w-28" />
              <div className="h-2.5 bg-white/5 rounded-full w-40" />
            </div>
            <div className="h-2.5 bg-white/5 rounded-full w-10 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/8">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">No conversations yet</p>
        <p className="text-gray-600 text-xs mt-1">Search for people to start chatting</p>
      </div>
    );
  }

  return (
    <div className="pb-2">
      {chats.map((chat) => (
        <ChatItem key={chat._id} chat={chat} isActive={chat._id === id} />
      ))}
    </div>
  );
}
