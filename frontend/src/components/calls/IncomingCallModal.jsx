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
    // Play ringtone (using Web Audio API)
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
    toast.dismiss(); // dismiss all toasts (including incoming call toast)
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
    toast('Call rejected');
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-scale-in">
      <div className="glass-card rounded-3xl p-6 w-80 shadow-2xl border border-primary-500/20">
        {/* Caller info */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center call-pulse relative">
              {incomingCall.initiator?.avatar?.url ? (
                <img src={incomingCall.initiator.avatar.url} alt={incomingCall.initiator.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary-400">
                  {incomingCall.initiator?.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <h3 className="text-white font-semibold text-lg">{incomingCall.initiator?.name}</h3>
          <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
            <span>{incomingCall.type === 'video' ? '📹' : '📞'}</span>
            <span>
              Incoming {incomingCall.isGroup && 'group '}
              {incomingCall.type} call
            </span>
          </p>

          {/* Animated dots */}
          <div className="flex gap-1 mt-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="typing-dot"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-around">
          <button
            id="reject-call-btn"
            onClick={handleReject}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-red-500/30">
              <svg className="w-7 h-7 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </div>
            <span className="text-red-400 text-xs">Decline</span>
          </button>

          <button
            id="accept-call-btn"
            onClick={handleAccept}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-primary-500/30 animate-pulse-soft">
              {incomingCall.type === 'video' ? (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              )}
            </div>
            <span className="text-primary-400 text-xs">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
