'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

function ChatItem({ chat, isActive }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { onlineUsers } = useChatStore();

  const otherMember = !chat.isGroup
    ? chat.members?.find((m) => m._id !== user?._id)
    : null;

  const displayName = chat.isGroup ? chat.name : otherMember?.name || 'Unknown';
  const avatarUrl = chat.isGroup
    ? chat.groupPicture?.url
    : otherMember?.avatar?.url;
  const initials = displayName?.charAt(0)?.toUpperCase() || '?';
  const isOnline = otherMember && onlineUsers.has(otherMember._id);

  const lastMsg = chat.lastMessage;
  let preview = 'No messages yet';
  if (lastMsg) {
    if (lastMsg.deletedForEveryone) preview = '🚫 Message deleted';
    else if (lastMsg.type === 'image') preview = '📷 Photo';
    else if (lastMsg.type === 'document') preview = `📎 ${lastMsg.file?.originalName || 'Document'}`;
    else if (lastMsg.type === 'audio') preview = '🎤 Voice message';
    else if (lastMsg.type === 'system') preview = lastMsg.content;
    else preview = lastMsg.content;
  }

  const isMine = lastMsg?.sender?._id === user?._id;

  return (
    <div
      onClick={() => router.push(`/chat/${chat._id}`)}
      className={`sidebar-item cursor-pointer select-none ${isActive ? 'bg-white/10 border-l-2 border-primary-500' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className={`text-lg font-semibold ${chat.isGroup ? 'text-blue-400' : 'text-primary-400'}`}>
              {initials}
            </span>
          )}
        </div>
        {isOnline && <div className="online-dot" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium text-sm truncate">{displayName}</span>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {formatChatTime(chat.updatedAt)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isMine && (
            <svg className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
          <p className="text-gray-400 text-xs truncate">{preview}</p>
        </div>
      </div>
    </div>
  );
}

export default function ChatList() {
  const { chats, isLoadingChats, fetchChats } = useChatStore();
  const { id } = useParams() || {};

  useEffect(() => {
    fetchChats();
  }, []);

  if (isLoadingChats) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-dark-600" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-dark-600 rounded w-32" />
              <div className="h-3 bg-dark-600 rounded w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-full bg-dark-600 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">No chats yet</p>
        <p className="text-gray-500 text-xs mt-1">Search for contacts to start chatting</p>
      </div>
    );
  }

  return (
    <div>
      {chats.map((chat) => (
        <ChatItem key={chat._id} chat={chat} isActive={chat._id === id} />
      ))}
    </div>
  );
}
