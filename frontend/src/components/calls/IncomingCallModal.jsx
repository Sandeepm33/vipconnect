'use client';
import { useEffect, useRef } from 'react';
import useCallStore from '@/store/callStore';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function IncomingCallModal() {
  const { incomingCall, clearIncomingCall, setActiveCall } = useCallStore();
  const ringtoneRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    if (incomingCall) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      let oscillator;
      const play = () => {
        oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 440;
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.stop(ctx.currentTime + 0.6);
      };
      const interval = setInterval(play, 1500);
      play();
      ringtoneRef.current = interval;
      return () => {
        clearInterval(interval);
        try { ctx.close(); } catch {}
      };
    }
  }, [incomingCall]);

  const handleAccept = () => {
    if (!incomingCall) return;
    clearInterval(ringtoneRef.current);
    toast.dismiss();
    socket?.emit('call_accept', {
      callId: incomingCall.callId,
      roomId: incomingCall.roomId,
    });
    setActiveCall({
      callId: incomingCall.callId,
      roomId: incomingCall.roomId,
      type: incomingCall.type,
      isGroup: incomingCall.isGroup,
      chat: incomingCall.chat,
      initiator: incomingCall.initiator,
    });
    clearIncomingCall();
  };

  const handleReject = () => {
    if (!incomingCall) return;
    clearInterval(ringtoneRef.current);
    toast.dismiss();
    socket?.emit('call_reject', {
      callId: incomingCall.callId,
      roomId: incomingCall.roomId,
    });
    clearIncomingCall();
    toast('Call declined');
  };

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';
  const callerName = incomingCall.initiator?.name || 'Unknown';
  const callerAvatar = incomingCall.initiator?.avatar?.url;
  const callLabel = `Incoming ${incomingCall.isGroup ? 'group ' : ''}${incomingCall.type} call`;

  return (
    <div className="fixed bottom-5 right-5 z-[300] animate-scale-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ringPulse1 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.18); opacity: 0; }
        }
        @keyframes ringPulse2 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        .incoming-card {
          background: rgba(10, 14, 24, 0.92);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(124, 58, 237, 0.25);
          border-radius: 28px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px rgba(124,58,237,0.12);
          width: 300px;
          padding: 28px 24px 24px;
          animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .ring-pulse-1 {
          position: absolute; inset: 0;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.35);
          animation: ringPulse1 2s ease-in-out infinite;
        }
        .ring-pulse-2 {
          position: absolute;
          inset: -16px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.15);
          animation: ringPulse2 2s ease-in-out infinite 0.4s;
        }
        .avatar-ring {
          position: relative; width: 80px; height: 80px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .avatar-inner {
          position: relative; z-index: 1;
          width: 80px; height: 80px;
          border-radius: 50%; overflow: hidden;
          background: linear-gradient(135deg, #4c1d95, #6d28d9);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(124,58,237,0.6);
          box-shadow: 0 0 20px rgba(124,58,237,0.4);
        }
        .btn-decline {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(239,68,68,0.15);
          border: 1.5px solid rgba(239,68,68,0.4);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease;
          color: #ef4444;
        }
        .btn-decline:hover {
          background: rgba(239,68,68,0.25);
          border-color: rgba(239,68,68,0.7);
          transform: scale(1.08);
          box-shadow: 0 0 20px rgba(239,68,68,0.3);
        }
        .btn-decline:active { transform: scale(0.94); }
        .btn-accept {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease;
          color: white;
          box-shadow: 0 4px 20px rgba(124,58,237,0.5);
        }
        .btn-accept:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 30px rgba(124,58,237,0.7);
        }
        .btn-accept:active { transform: scale(0.94); }
        .dot-bounce {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(124,58,237,0.7);
          display: inline-block;
          animation: dotBounce 1.4s ease-in-out infinite;
        }
        .call-type-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 11px; font-weight: 600;
          color: rgba(167,139,250,1);
        }
      `}</style>

      <div className="incoming-card">

        {/* Top: Caller Avatar + Info */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Pulsing avatar */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div className="avatar-ring" style={{ margin: '0 auto' }}>
              <div className="ring-pulse-1" />
              <div className="ring-pulse-2" />
              <div className="avatar-inner">
                {callerAvatar ? (
                  <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(196,181,253,1)' }}>
                    {callerName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: 17, marginBottom: 5 }}>
            {callerName}
          </h3>

          {/* Call type badge */}
          <div className="call-type-badge">
            <span>{isVideo ? '📹' : '📞'}</span>
            <span>{callLabel}</span>
          </div>

          {/* Animated dots */}
          <div style={{ display: 'flex', gap: 5, marginTop: 12, justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="dot-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {/* Decline */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button id="reject-call-btn" className="btn-decline" onClick={handleReject}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"
                   style={{ transform: 'rotate(135deg)' }}>
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36
                  1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39
                  0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57
                  3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </button>
            <span style={{ fontSize: 11, color: 'rgba(239,68,68,0.8)', fontWeight: 500 }}>Decline</span>
          </div>

          {/* Accept */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button id="accept-call-btn" className="btn-accept" onClick={handleAccept}>
              {isVideo ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36
                    1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39
                    0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57
                    3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              )}
            </button>
            <span style={{ fontSize: 11, color: 'rgba(167,139,250,0.9)', fontWeight: 500 }}>Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
