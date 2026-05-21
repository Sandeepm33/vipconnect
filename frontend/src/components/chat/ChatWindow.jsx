'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import useAuthStore from '@/store/authStore';
import useCallStore from '@/store/callStore';
import useSocket from '@/hooks/useSocket';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GroupInfo from '@/components/groups/GroupInfo';
import { getSocket } from '@/lib/socket';
import { format } from 'date-fns';

export default function ChatWindow() {
  const { id } = useParams();
  const router = useRouter();
  const { activeChat, messages, fetchMessages, typingUsers, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const isAdmin = activeChat?.isGroup && activeChat?.admins?.some(a => a._id === user?._id || a === user?._id);
  const { setActiveCall, setIncomingCall } = useCallStore();
  const { joinChat, leaveChat, markMessagesRead, deleteMessage } = useSocket();
  const messagesEndRef = useRef(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const chatMessages = messages[id] || [];

  const otherMember = !activeChat?.isGroup
    ? activeChat?.members?.find((m) => m._id !== user?._id)
    : null;

  const displayName = activeChat?.isGroup ? activeChat?.name : otherMember?.name || '';
  const avatarUrl = activeChat?.isGroup ? activeChat?.groupPicture?.url : otherMember?.avatar?.url;
  const initials = displayName?.charAt(0)?.toUpperCase() || '?';
  const isOnline = otherMember && onlineUsers.has(otherMember._id);
  const typingInChat = typingUsers[id] || {};
  const typingNames = Object.values(typingInChat).filter(Boolean);

  useEffect(() => {
    if (!id) return;
    joinChat(id);
    fetchMessages(id, 1).then((pagination) => {
      if (pagination) setHasMore(pagination.page < pagination.pages);
    });

    return () => leaveChat(id);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length]);

  // Mark messages as read
  useEffect(() => {
    if (chatMessages.length > 0 && id) {
      const unreadIds = chatMessages
        .filter((m) => m.sender?._id !== user?._id && !m.readBy?.some((r) => r.user?._id === user?._id))
        .map((m) => m._id);
      if (unreadIds.length > 0) {
        markMessagesRead(id, unreadIds);
      }
    }
  }, [chatMessages.length, id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const pagination = await fetchMessages(id, nextPage);
    if (pagination) {
      setHasMore(nextPage < pagination.pages);
      setPage(nextPage);
    }
    setIsLoadingMore(false);
  };

  const handleCall = (type) => {
    const socket = getSocket();
    socket?.emit('call_initiate', {
      chatId: id,
      type,
      isGroup: activeChat?.isGroup,
    });

    socket?.once('call_created', ({ callId, roomId }) => {
      setActiveCall({
        callId,
        roomId,
        type,
        isGroup: activeChat?.isGroup,
        chat: activeChat,
        initiator: user,
      });
    });
  };

  // Group messages by date
  const groupedMessages = chatMessages.reduce((acc, msg) => {
    const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-chat-header border-b border-chat-border flex-shrink-0">
          {/* Left: back button + avatar + name — must shrink to leave room for buttons */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile Back Button */}
            <button 
              onClick={() => router.push('/chat')}
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/10 flex-shrink-0"
              title="Back to chats"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
              onClick={() => activeChat?.isGroup && setShowGroupInfo(true)}
            >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className={`text-lg font-semibold ${activeChat?.isGroup ? 'text-blue-400' : 'text-primary-400'}`}>
                    {initials}
                  </span>
                )}
              </div>
              {isOnline && <div className="online-dot" />}
            </div>

            <div className="min-w-0">
              <h2 className="text-white font-semibold text-sm truncate">{displayName}</h2>
              <p className="text-xs truncate">
                {typingNames.length > 0 ? (
                  <span className="text-primary-400 animate-pulse">
                    {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
                  </span>
                ) : activeChat?.isGroup ? (
                  <span className="text-gray-500">
                    {activeChat?.members?.length} members
                  </span>
                ) : isOnline ? (
                  <span className="text-primary-400">Online</span>
                ) : (
                  <span className="text-gray-500">Offline</span>
                )}
              </p>
            </div>
          </div>
          </div>

          {/* Call buttons — flex-shrink-0 keeps them always visible on mobile */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              id="audio-call-btn"
              onClick={() => handleCall('audio')}
              title="Voice call"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button
              id="video-call-btn"
              onClick={() => handleCall('video')}
              title="Video call"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </button>
            <button
              id="chat-info-btn"
              onClick={() => setShowGroupInfo(true)}
              title="Chat info"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(37, 211, 102, 0.03) 0%, transparent 50%)`,
          }}
          onScroll={(e) => {
            if (e.target.scrollTop < 100 && hasMore && !isLoadingMore) {
              loadMoreMessages();
            }
          }}
        >
          {/* Load more */}
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Date-grouped messages */}
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-chat-border" />
                <span className="text-xs text-gray-500 bg-chat-sidebar px-3 py-1 rounded-full border border-chat-border">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </span>
                <div className="flex-1 h-px bg-chat-border" />
              </div>

              {msgs.map((message, index) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={message.sender?._id === user?._id}
                  isAdmin={isAdmin}
                  onDelete={(msgId) => {
                    deleteMessage(id, msgId, true);
                  }}
                  onEdit={() => setEditingMessage(message)}
                  showAvatar={
                    activeChat?.isGroup &&
                    (index === 0 || msgs[index - 1]?.sender?._id !== message.sender?._id)
                  }
                />
              ))}
            </div>
          ))}

          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-dark-600 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No messages yet. Say hello! 👋</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput 
          chatId={id} 
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
        />
      </div>

      {/* Group Info Panel */}
      {showGroupInfo && (
        <GroupInfo chat={activeChat} onClose={() => setShowGroupInfo(false)} />
      )}
    </>
  );
}
