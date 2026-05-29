'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import ChatWindow from '@/components/chat/ChatWindow';
import api from '@/lib/api';

const FEATURES = [
  { icon: '🔒', label: 'End-to-end encrypted',  color: 'rgba(124,58,237,0.8)' },
  { icon: '⚡', label: 'Real-time messaging',    color: 'rgba(56,189,248,0.8)' },
  { icon: '📹', label: 'HD video calls',          color: 'rgba(52,211,153,0.8)' },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get('id');
  // Prevent string "undefined" or "null" from triggering backend CastError
  const id = (rawId === 'undefined' || rawId === 'null') ? null : rawId;
  const { setActiveChat, activeChat } = useChatStore();

  useEffect(() => {
    if (!id) {
      setActiveChat(null);
      return;
    }
    // Fetch chat details
    api.get(`/chats/${id}`).then((data) => {
      setActiveChat(data.chat);
    }).catch(console.error);

    return () => {
      setActiveChat(null);
    };
  }, [id, setActiveChat]);

  if (id) {
    if (!activeChat) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      );
    }
    return <ChatWindow />;
  }

  return (
    <div
      className="h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.07) 0%, transparent 65%), #080c14',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes iconPop {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }

        .chat-home-icon-wrap {
          position: relative;
          width: 120px; height: 120px;
          margin: 0 auto 28px;
        }
        .icon-orbit {
          position: absolute; inset: -18px;
          border-radius: 50%;
          border: 1px dashed rgba(124,58,237,0.2);
          animation: orbitSpin 12s linear infinite;
        }
        .icon-orbit-2 {
          position: absolute; inset: -36px;
          border-radius: 50%;
          border: 1px dashed rgba(124,58,237,0.1);
          animation: orbitSpin 20s linear infinite reverse;
        }
        .icon-core {
          width: 120px; height: 120px;
          border-radius: 36px;
          background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(109,40,217,0.06));
          border: 1px solid rgba(124,58,237,0.2);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(124,58,237,0.12), inset 0 0 30px rgba(124,58,237,0.04);
          animation: iconPop 4s ease-in-out infinite;
          position: relative; z-index: 1;
        }
        .chat-home-title {
          font-size: 28px; font-weight: 800;
          background: linear-gradient(135deg, #fff 30%, rgba(167,139,250,0.9));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
          animation: floatUp 0.6s ease both;
          animation-delay: 0.1s;
        }
        .chat-home-sub {
          color: rgba(107,114,128,1);
          font-size: 13.5px; line-height: 1.7;
          max-width: 300px; text-align: center;
          animation: floatUp 0.6s ease both;
          animation-delay: 0.2s;
        }
        .feature-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 12px; font-weight: 500;
          color: rgba(156,163,175,1);
          transition: all 0.2s ease;
          cursor: default;
        }
        .feature-chip:hover {
          background: rgba(124,58,237,0.08);
          border-color: rgba(124,58,237,0.25);
          color: rgba(196,181,253,1);
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
        }
        .select-hint {
          display: flex; align-items: center; gap: 8px;
          margin-top: 32px;
          padding: 10px 20px;
          border-radius: 14px;
          background: rgba(124,58,237,0.07);
          border: 1px solid rgba(124,58,237,0.15);
          font-size: 12px; font-weight: 500;
          color: rgba(167,139,250,0.85);
          animation: floatUp 0.6s ease both;
          animation-delay: 0.4s;
        }
      ` }} />

      {/* Subtle mesh background dots */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>

        {/* Icon with orbit rings */}
        <div className="chat-home-icon-wrap" style={{ animation: 'floatUp 0.5s ease both' }}>
          <div className="icon-orbit" />
          <div className="icon-orbit-2" />
          <div className="icon-core">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24"
                 style={{ color: 'rgba(167,139,250,0.8)' }}>
              <path fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
        </div>

        {/* Title + subtitle */}
        <h2 className="chat-home-title">VipConnect</h2>
        <p className="chat-home-sub">
          Select a conversation to start messaging, or create a new one from the sidebar.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24,
                      animation: 'floatUp 0.6s ease 0.3s both' }}>
          {FEATURES.map(({ icon, label, color }) => (
            <div key={label} className="feature-chip">
              <div className="dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span>{icon} {label}</span>
            </div>
          ))}
        </div>

        {/* Hint */}
        <div className="select-hint">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"
               style={{ color: 'rgba(167,139,250,0.7)', flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 19l-7-7 7-7" />
          </svg>
          Select a chat from the sidebar to get started
        </div>
      </div>
    </div>
  );
}

export default function ChatHome() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
