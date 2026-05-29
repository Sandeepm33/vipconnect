'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const rawId = searchParams ? searchParams.get('id') : null;
  const id = (rawId === 'undefined' || rawId === 'null') ? null : rawId;
  const router = useRouter();
  const { activeChat, messages, fetchMessages, typingUsers, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const isAdmin = activeChat?.isGroup && activeChat?.admins?.some(a => a._id === user?._id || a === user?._id);
  const { setActiveCall } = useCallStore();
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

  const isBusiness = otherMember?.isBusiness;
  const businessHours = otherMember?.businessHours;

  const parseTime = (timeStr) => {
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const parts = clean.replace('AM', '').replace('PM', '').split(':');
    let hours = parseInt(parts[0]);
    const mins = parts[1] ? parseInt(parts[1]) : 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const isOutOfHours = (() => {
    if (!isBusiness || !businessHours) return false;
    try {
      const parts = businessHours.split('-');
      if (parts.length !== 2) return false;
      const start = parseTime(parts[0]);
      const end = parseTime(parts[1]);
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      return currentMin < start || currentMin > end;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (!id) return;
    setPage(1);
    setHasMore(true);
    joinChat(id);
    fetchMessages(id, 1).then((pagination) => {
      if (pagination) setHasMore(pagination.page < pagination.pages);
    });
    return () => leaveChat(id);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  useEffect(() => {
    if (chatMessages.length > 0 && id) {
      const unreadIds = chatMessages
        .filter((m) => m.sender?._id !== user?._id && !m.readBy?.some((r) => r.user?._id === user?._id))
        .map((m) => m._id);
      if (unreadIds.length > 0) markMessagesRead(id, unreadIds);
    }
  }, [chatMessages.length, id]);

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
    if (!socket) return;
    socket.off('call_created');
    socket.off('call_error');
    socket.once('call_created', ({ callId, roomId }) => {
      setActiveCall({
        callId, roomId, type,
        isGroup: activeChat?.isGroup,
        chat: activeChat,
        initiator: user,
      });
    });
    socket.once('call_error', ({ error }) => {
      import('react-hot-toast').then(({ default: toast }) => toast.error(`Call failed: ${error}`));
    });
    socket.emit('call_initiate', { chatId: id, type, isGroup: activeChat?.isGroup });
  };

  const groupedMessages = chatMessages.reduce((acc, msg) => {
    const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full relative overflow-hidden">

        {/* ── Chat Header ─────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-between px-4 py-3 flex-shrink-0 z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(26,31,46,0.95) 100%)',
            borderBottom: '1px solid rgba(45,55,72,0.5)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

          {/* Left: back + avatar + info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile back */}
            <button
              onClick={() => router.push('/chat')}
              className="md:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all flex-shrink-0 active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            {/* Avatar + name */}
            <div
              className="flex items-center gap-3 cursor-pointer group min-w-0"
              onClick={() => activeChat?.isGroup && setShowGroupInfo(true)}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-primary-500/40 transition-all shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: activeChat?.isGroup
                          ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                          : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      }}
                    >
                      <span className="text-white font-bold">{initials}</span>
                    </div>
                  )}
                </div>
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary-500 rounded-full border-2 border-[#1a1f2e]" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-white font-semibold text-sm truncate group-hover:text-primary-300 transition-colors flex items-center gap-1.5">
                  {displayName}
                  {isBusiness && (
                    <span className="text-[9px] font-extrabold bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded tracking-wide uppercase">Business</span>
                  )}
                </h2>
                <div className="text-xs truncate">
                  {typingNames.length > 0 ? (
                    <span className="text-primary-400 flex items-center gap-1">
                      <TypingDots />
                      {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  ) : activeChat?.isGroup ? (
                    <span className="text-gray-500">{activeChat?.members?.length} members</span>
                  ) : isOnline ? (
                    <span className="text-primary-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse inline-block" />
                      Online
                    </span>
                  ) : (
                    <span className="text-gray-600">Offline</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <HeaderAction
              id="audio-call-btn"
              title="Voice call"
              onClick={() => handleCall('audio')}
              color="text-emerald-400 hover:bg-emerald-500/15"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </HeaderAction>

            <HeaderAction
              id="video-call-btn"
              title="Video call"
              onClick={() => handleCall('video')}
              color="text-blue-400 hover:bg-blue-500/15"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </HeaderAction>

            <HeaderAction
              id="chat-info-btn"
              title="Chat info"
              onClick={() => setShowGroupInfo(true)}
              color="text-gray-400 hover:bg-white/8"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </HeaderAction>
          </div>
        </div>

        {/* ── Messages Area ────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3"
          style={{
            background: `
              radial-gradient(ellipse at 20% 10%, rgba(37,211,102,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 90%, rgba(59,130,246,0.03) 0%, transparent 50%),
              #0d1117
            `,
          }}
          onScroll={(e) => {
            if (e.target.scrollTop < 100 && hasMore && !isLoadingMore) loadMoreMessages();
          }}
        >
          {/* Out of hours business alert */}
          {isBusiness && isOutOfHours && (
            <div className="flex justify-center my-3 message-enter">
              <span className="text-[11px] text-orange-400 bg-orange-500/10 border border-orange-500/25 px-3.5 py-2 rounded-2xl max-w-xs text-center leading-normal">
                💼 Out of business hours ({businessHours}). Replies may be slow.
              </span>
            </div>
          )}

          {/* Load more spinner */}
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-white/4 border border-white/8 flex items-center justify-center mb-4 shadow-xl">
                <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium text-sm">No messages yet</p>
              <p className="text-gray-600 text-xs mt-1">Say hello to {displayName} 👋</p>
            </div>
          )}

          {/* Date-grouped messages */}
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(45,55,72,0.4)' }} />
                <span className="text-[11px] text-gray-500 font-medium px-3 py-1 rounded-full border"
                  style={{ background: 'rgba(22,27,34,0.8)', borderColor: 'rgba(45,55,72,0.5)' }}
                >
                  {format(new Date(date), 'MMMM d, yyyy')}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(45,55,72,0.4)' }} />
              </div>

              {msgs.map((message, index) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={message.sender?._id === user?._id}
                  isAdmin={isAdmin}
                  onDelete={(msgId) => deleteMessage(id, msgId, true)}
                  onEdit={() => setEditingMessage(message)}
                  showAvatar={
                    activeChat?.isGroup &&
                    (index === 0 || msgs[index - 1]?.sender?._id !== message.sender?._id)
                  }
                />
              ))}
            </div>
          ))}

          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* ── Message Input ────────────────────────────────────────────── */}
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

// ── Sub-components ──────────────────────────────────────────────────────────

function HeaderAction({ id, title, onClick, color, children }) {
  return (
    <button
      id={id}
      title={title}
      onClick={onClick}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${color}`}
    >
      {children}
    </button>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] mr-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-primary-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </span>
  );
}
