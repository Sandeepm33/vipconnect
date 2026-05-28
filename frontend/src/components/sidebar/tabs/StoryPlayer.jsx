'use client';
import { useState, useEffect, useRef } from 'react';
import useChatStore from '@/store/chatStore';
import useAuthStore from '@/store/authStore';
import useStatusStore from '@/store/statusStore';

export default function StoryPlayer({ group, onClose }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const { createChat, addMessage } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const { viewStatus, deleteStatus } = useStatusStore();
  const timerRef = useRef(null);
  const mediaRef = useRef(null);

  const activeStory = group.items[index];
  const isOwnStory = group.user?._id === currentUser?._id;
  const isMedia = activeStory?.mediaType === 'video' || activeStory?.mediaType === 'voice';
  const isPaused = showViewers || showDeleteMenu;

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
    const backendBase = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    return `${backendBase}${url}`;
  };

  // Deduplicate views by user ID in the UI to ensure no duplicates are rendered or counted
  const uniqueViews = (() => {
    const list = [];
    const seen = new Set();
    (activeStory?.views || []).forEach((v) => {
      if (!v || !v.user) return;
      let id = '';
      if (typeof v.user === 'object') {
        id = v.user._id?.toString() || v.user.id?.toString() || v.user.name || '';
      } else if (typeof v.user === 'string') {
        id = v.user;
      }
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push(v);
      }
    });
    return list;
  })();

  // Record status view
  useEffect(() => {
    if (activeStory && !isOwnStory) {
      viewStatus(activeStory._id);
    }
  }, [activeStory, isOwnStory, viewStatus]);

  // Reset progress when index changes
  useEffect(() => {
    setProgress(0);
  }, [index]);

  // Handle play/pause of media element based on pause state
  useEffect(() => {
    if (isMedia && mediaRef.current) {
      if (isPaused) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play().catch((err) => console.log('Autoplay blocked:', err));
      }
    }
  }, [isPaused, isMedia, index]);

  // Auto progression for non-media (text/image)
  useEffect(() => {
    if (isMedia) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2; // increments every 100ms (5s total)
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isPaused, isMedia]);

  const handleNext = () => {
    if (index < group.items.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleTimeUpdate = (e) => {
    const { currentTime, duration } = e.target;
    if (duration) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleMediaEnded = () => {
    handleNext();
  };

  const handleDeleteStatus = async () => {
    if (!activeStory) return;
    const targetId = activeStory._id;
    const res = await deleteStatus(targetId);
    if (res.success) {
      setShowDeleteMenu(false);
      group.items = group.items.filter((item) => item._id !== targetId);
      if (group.items.length === 0) {
        onClose();
      } else {
        if (index >= group.items.length) {
          setIndex(group.items.length - 1);
        } else {
          setProgress(0);
          setIndex(index);
        }
      }
    } else {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Failed to delete status');
      });
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const chat = await createChat(group.user._id);
      // Construct user-reply message
      const textMsg = `💬 Story Reply: "${replyText}" on story item: ${activeStory.caption || activeStory.mediaType}`;
      
      // Send mock message to direct chat
      // Actually we'd trigger a POST /messages/send or socket emission. Let's send an API call.
      // We import api and send message
      const api = (await import('@/lib/api')).default;
      const data = await api.post('/messages', {
        chatId: chat._id,
        content: textMsg,
        type: 'text'
      });
      
      addMessage(chat._id, data.message);
      setReplyText('');
      onClose();
    } catch (err) {
      console.error('reply error:', err);
    }
  };

  const handleEmojiReaction = async (emoji) => {
    try {
      const chat = await createChat(group.user._id);
      const textMsg = `Story Reaction: ${emoji}`;
      const api = (await import('@/lib/api')).default;
      const data = await api.post('/messages', {
        chatId: chat._id,
        content: textMsg,
        type: 'text'
      });
      addMessage(chat._id, data.message);
      onClose();
    } catch (err) {
      console.error('emoji reaction error:', err);
    }
  };

  const formatViewedAt = (dateStr) => {
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col justify-between" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── TOP PROGRESS BARS ───────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
        {group.items.map((item, idx) => {
          let fillWidth = 0;
          if (idx < index) fillWidth = 100;
          else if (idx === index) fillWidth = progress;

          return (
            <div key={item._id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${fillWidth}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
            {group.user?.avatar?.url ? (
              <img src={getMediaUrl(group.user.avatar.url)} alt={group.user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold">{group.user?.name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{group.user?.name}</p>
            <p className="text-xs text-white/60">
              {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mute/Unmute toggle for video */}
          {activeStory.mediaType === 'video' && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          )}

          {/* Three-dot menu for own stories */}
          {isOwnStory && (
            <div className="relative">
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
                title="Options"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showDeleteMenu && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl border border-white/10 shadow-2xl z-[200] overflow-hidden bg-gray-900">
                  <button
                    onClick={handleDeleteStatus}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Status
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <button onClick={onClose} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── STORY BODY ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative w-full flex items-center justify-center min-h-0 overflow-hidden">
        {/* Left click navigations */}
        <div onClick={handlePrev} className="absolute left-0 top-0 bottom-0 w-1/4 z-40 cursor-pointer" />
        {/* Right click navigations */}
        <div onClick={handleNext} className="absolute right-0 top-0 bottom-0 w-1/4 z-40 cursor-pointer" />

        {/* Content displays */}
        {activeStory.mediaType === 'text' ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center px-8 text-center text-2xl font-bold text-white transition-all duration-300"
            style={{ backgroundColor: activeStory.backgroundColor }}
          >
            {activeStory.caption}
          </div>
        ) : activeStory.mediaType === 'image' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img src={getMediaUrl(activeStory.mediaUrl)} alt="Status Content" className="max-w-full max-h-full object-contain" />
            {activeStory.caption && (
              <div className="absolute bottom-24 left-0 right-0 text-center px-6 py-3 bg-black/40 backdrop-blur-sm text-white text-base font-semibold">
                {activeStory.caption}
              </div>
            )}
          </div>
        ) : activeStory.mediaType === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={mediaRef}
              src={getMediaUrl(activeStory.mediaUrl)}
              autoPlay
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleMediaEnded}
              className="max-w-full max-h-full object-contain"
            />
            {activeStory.caption && (
              <div className="absolute bottom-24 left-0 right-0 text-center px-6 py-3 bg-black/40 backdrop-blur-sm text-white text-base font-semibold">
                {activeStory.caption}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#111827] px-8 text-center text-white">
            <div className="p-4 rounded-full bg-primary-500/10 border border-primary-500/25 mb-4">
              <svg className="w-12 h-12 text-primary-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2">Voice Note Status</p>
            <audio
              ref={mediaRef}
              src={getMediaUrl(activeStory.mediaUrl)}
              controls
              autoPlay
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleMediaEnded}
              className="mt-4"
            />
          </div>
        )}
      </div>

      {/* ── FOOTER & ACTIONS ───────────────────────────────────────────── */}
      <div className="px-4 pb-8 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-4 relative z-50">
        {isOwnStory ? (
          <div className="flex flex-col items-center justify-center pb-2">
            <button
              onClick={() => setShowViewers(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 focus:outline-none transition-all active:scale-95 text-sm font-semibold cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{uniqueViews.length} View{uniqueViews.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Emoji Reactions Deck */}
            <div className="flex justify-center gap-4 py-2 border-b border-white/5">
              {['❤️', '😂', '😮', '😢', '👏', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input composer reply */}
            <form onSubmit={handleReplySubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="Type a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white placeholder-white/50 text-sm px-4 py-3 rounded-2xl border border-white/10 focus:outline-none focus:border-primary-500/50 transition-all"
              />
              <button
                type="submit"
                className="p-3 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white rounded-2xl transition-all"
              >
                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── VIEWER LIST DRAWER ────────────────────────────────────────── */}
      {showViewers && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[150] flex flex-col justify-end">
          <div className="w-full max-h-[60%] bg-[#111827] rounded-t-[32px] border-t border-white/10 p-6 flex flex-col animate-slide-up">
            {/* Header / Drag Bar */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-white font-extrabold text-lg">Views</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {uniqueViews.length} person{uniqueViews.length !== 1 ? 's' : ''} saw this update
                </p>
              </div>
              <button
                onClick={() => setShowViewers(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {uniqueViews.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
                  <div className="p-3 rounded-full bg-white/5 border border-white/5">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p>No views yet. Your contacts will appear here when they view your update.</p>
                </div>
              ) : (
                uniqueViews.map((view, idx) => {
                  const viewer = view.user;
                  if (!viewer) return null;
                  const initials = viewer.name?.charAt(0) || '?';
                  return (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
                          {viewer.avatar?.url ? (
                            <img src={getMediaUrl(viewer.avatar.url)} alt={viewer.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-primary-500 to-indigo-600">
                              <span className="text-white font-bold text-sm">{initials}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{viewer.name}</p>
                          <p className="text-[10px] text-gray-500">{viewer.email || ''}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {formatViewedAt(view.viewedAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── KEYFRAMES ANIMATIONS ───────────────────────────────────────── */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
