'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import useCallStore from '@/store/callStore';
import useWebRTC from '@/hooks/useWebRTC';
import useAuthStore from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function CallWindow() {
  const {
    activeCall,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStreams,
    toggleVideo,
    toggleAudio,
    endCall,
    addParticipant,
    setCallParticipants,
  } = useCallStore();

  const { user } = useAuthStore();
  const {
    getLocalStream,
    connectToPeer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleParticipantLeft,
  } = useWebRTC();

  const localVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const durationRef = useRef(null);
  const activeCallRef = useRef(activeCall);
  const [facingMode, setFacingMode] = useState('user');
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  const handleSwitchCamera = useCallback(async () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) {
      toast.error('No video track to switch');
      return;
    }

    try {
      const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
      toast('Switching camera...', { icon: '🔄' });

      // Stop old video track
      videoTrack.stop();

      // Request new stream with the updated facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacingMode } },
        audio: isAudioEnabled
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack) {
        // Remove old track and add new track to existing localStream
        localStream.removeTrack(videoTrack);
        localStream.addTrack(newVideoTrack);

        // Update active tracks in all peer connections
        const { peerConnections } = useCallStore.getState();
        Object.values(peerConnections).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack).catch(err => {
              console.error('replaceTrack error:', err);
            });
          }
        });

        // Trigger reference update to local video elements
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
          localVideoRef.current.srcObject = localStream;
        }

        setFacingMode(nextFacingMode);
        toast.success(`Switched to ${nextFacingMode === 'user' ? 'front' : 'back'} camera`);
      } else {
        toast.error('Could not get new camera track');
      }
    } catch (err) {
      console.error('Switch camera error:', err);
      toast.error(`Could not switch camera: ${err.message || 'Unknown error'}`);
    }
  }, [localStream, facingMode, isAudioEnabled]);

  // ─── Start call: get media and connect to any pre-existing participants ───
  useEffect(() => {
    if (!activeCall?.roomId) return;
    let cancelled = false;

    const initCall = async () => {
      const isVideo = activeCall.type === 'video';
      let stream = useCallStore.getState().localStream;
      if (!stream) stream = await getLocalStream(isVideo, true);
      if (!stream || cancelled) return;

      durationRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

      const { callParticipants, peerConnections } = useCallStore.getState();
      const mySocketId = getSocket()?.id;
      for (const p of callParticipants) {
        if (!peerConnections[p.socketId] && !cancelled) {
          if (mySocketId > p.socketId) {
            await connectToPeer(p.socketId, stream, activeCall.roomId, p.user);
          }
        }
      }

      const { pendingOffers } = useCallStore.getState();
      if (pendingOffers.length > 0) {
        const offers = [...pendingOffers];
        useCallStore.getState().clearPendingOffers();
        for (const data of offers) {
          if (!cancelled) await handleOffer(data, stream);
        }
      }
    };

    initCall();
    return () => { cancelled = true; clearInterval(durationRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall?.roomId]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, remoteStreams]);

  // ─── Socket event handlers ────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onCallParticipants = async ({ participants }) => {
      setCallParticipants(participants);
      const stream = useCallStore.getState().localStream;
      if (!stream) return;
      const { peerConnections } = useCallStore.getState();
      const mySocketId = socket.id;
      for (const p of participants) {
        if (!peerConnections[p.socketId]) {
          if (mySocketId > p.socketId) {
            await connectToPeer(p.socketId, stream, activeCallRef.current?.roomId, p.user);
          }
        }
      }
    };

    const onParticipantJoined = async ({ socketId, user: pUser }) => {
      addParticipant({ socketId, user: pUser, videoEnabled: true, audioEnabled: true });
      const stream = useCallStore.getState().localStream;
      if (!stream) return;
      const { peerConnections } = useCallStore.getState();
      const mySocketId = socket.id;
      if (!peerConnections[socketId]) {
        if (mySocketId > socketId) {
          await connectToPeer(socketId, stream, activeCallRef.current?.roomId, pUser);
        }
      }
    };

    const onWebRTCOffer = async (data) => {
      const stream = useCallStore.getState().localStream;
      if (stream) {
        await handleOffer(data, stream);
      } else {
        useCallStore.getState().addPendingOffer(data);
      }
    };

    const onWebRTCAnswer = (data) => handleAnswer(data);
    const onWebRTCIce = (data) => handleIceCandidate(data);
    const onParticipantLeft = (data) => handleParticipantLeft(data);
    const onCallEnded = () => endCall();

    socket.on('call_participants', onCallParticipants);
    socket.on('participant_joined', onParticipantJoined);
    socket.on('webrtc_offer', onWebRTCOffer);
    socket.on('webrtc_answer', onWebRTCAnswer);
    socket.on('webrtc_ice_candidate', onWebRTCIce);
    socket.on('participant_left', onParticipantLeft);
    socket.on('call_ended', onCallEnded);
    socket.on('call_rejected', onCallEnded);

    return () => {
      socket.off('call_participants', onCallParticipants);
      socket.off('participant_joined', onParticipantJoined);
      socket.off('webrtc_offer', onWebRTCOffer);
      socket.off('webrtc_answer', onWebRTCAnswer);
      socket.off('webrtc_ice_candidate', onWebRTCIce);
      socket.off('participant_left', onParticipantLeft);
      socket.off('call_ended', onCallEnded);
      socket.off('call_rejected', onCallEnded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Controls ─────────────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    const socket = getSocket();
    socket?.emit('call_end', {
      callId: activeCallRef.current?.callId,
      roomId: activeCallRef.current?.roomId,
    });
    endCall();
  }, [endCall]);

  const handleToggleVideo = useCallback(() => {
    const socket = getSocket();
    toggleVideo();
    socket?.emit('media_state_change', {
      roomId: activeCallRef.current?.roomId,
      video: !isVideoEnabled,
      audio: isAudioEnabled,
    });
  }, [toggleVideo, isVideoEnabled, isAudioEnabled]);

  const handleToggleAudio = useCallback(() => {
    const socket = getSocket();
    toggleAudio();
    socket?.emit('media_state_change', {
      roomId: activeCallRef.current?.roomId,
      video: isVideoEnabled,
      audio: !isAudioEnabled,
    });
  }, [toggleAudio, isVideoEnabled, isAudioEnabled]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const remoteStreamEntries = Object.entries(remoteStreams);
  const isGroup = activeCall?.isGroup;
  const isVideo = activeCall?.type === 'video';
  const isInitiator = activeCall?.initiator?._id === user?._id;

  const otherMember = !isGroup && activeCall?.chat?.members
    ? activeCall.chat.members.find((m) => String(m._id) !== String(user?._id))
    : null;

  const remoteUser = otherMember || (!isInitiator ? activeCall?.initiator : null);
  const displayName = isGroup ? activeCall?.chat?.name : (remoteUser?.name || 'Unknown');
  const displayAvatar = isGroup ? activeCall?.chat?.groupPicture?.url : remoteUser?.avatar?.url;
  const isConnected = remoteStreamEntries.length > 0;

  const gridClass = remoteStreamEntries.length === 0
    ? 'grid-cols-1'
    : remoteStreamEntries.length === 1
    ? 'grid-cols-1'
    : remoteStreamEntries.length <= 3
    ? 'grid-cols-2'
    : 'grid-cols-2 sm:grid-cols-3';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        @keyframes callPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes callPulse2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.5); }
          50% { box-shadow: 0 0 0 14px rgba(124,58,237,0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }

        .call-bg {
          background: radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(56,189,248,0.08) 0%, transparent 50%),
                      #060a11;
        }
        .call-header-glass {
          background: rgba(6,10,17,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .call-controls-glass {
          background: rgba(6,10,17,0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .video-tile {
          background: #0d1220;
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,255,255,0.06);
          animation: scaleIn 0.4s ease both;
        }
        .video-tile-waiting {
          background: linear-gradient(135deg, #0d1220, #111827);
          border: 1px solid rgba(124,58,237,0.15);
        }
        .pip-local {
          position: absolute;
          bottom: 16px;
          right: 16px;
          width: 120px;
          height: 160px;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid rgba(124,58,237,0.5);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.2);
          animation: scaleIn 0.4s ease 0.2s both;
        }
        .ctrl-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .ctrl-btn:active { transform: scale(0.9); }
        .ctrl-btn-circle {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .ctrl-btn-circle::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.08);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .ctrl-btn-circle:hover::after { opacity: 1; }
        .ctrl-normal {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .ctrl-off {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
        }
        .ctrl-end {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: none;
          box-shadow: 0 4px 20px rgba(239,68,68,0.4);
        }
        .ctrl-end:hover { box-shadow: 0 4px 30px rgba(239,68,68,0.6); }
        .status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .pulse-ring-1 {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(124,58,237,0.3);
          animation: callPulse 2s ease-in-out infinite;
        }
        .pulse-ring-2 {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          background: rgba(124,58,237,0.15);
          animation: callPulse2 2s ease-in-out infinite 0.5s;
        }
        .avatar-glow {
          box-shadow: 0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.15);
          animation: breathe 3s ease-in-out infinite;
        }
        .duration-badge {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 20px;
          padding: 2px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
          letter-spacing: 0.05em;
        }
        .participant-badge {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 11px;
          color: rgba(156,163,175,1);
        }
        .name-tag {
          position: absolute;
          bottom: 10px;
          left: 12px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 600;
          color: white;
        }
      `}</style>

      {/* ── Background ── */}
      <div className="call-bg absolute inset-0" />

      {/* ── Header ── */}
      <div className="call-header-glass relative z-10 flex items-center justify-between px-6 py-4"
           style={{ animation: 'slideDown 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1a2035] flex items-center justify-center flex-shrink-0">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-violet-400">
                {displayName?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm leading-tight">{displayName}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {isConnected ? (
                <>
                  <div className="status-dot" />
                  <span className="duration-badge">{formatDuration(callDuration)}</span>
                </>
              ) : (
                <span className="text-xs text-gray-500">Connecting...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGroup && (
            <div className="participant-badge">
              {remoteStreamEntries.length + 1} participants
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {isVideo ? (
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24
                  1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17
                  0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            )}
            <span className="text-xs font-medium" style={{ color: 'rgba(156,163,175,1)' }}>
              {isVideo ? 'Video' : 'Audio'} Call
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-hidden relative z-10">

        {/* Video Call */}
        {isVideo ? (
          <div className="h-full w-full relative">
            {remoteStreamEntries.length === 0 ? (
              // ─── WAITING STATE: Local camera feeds full-screen, remote avatar overlaid ───
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-[#0d1220] flex items-center justify-center">
                    <span className="text-5xl font-bold text-violet-400">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Profile detail overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px] z-10">
                  <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease both' }}>
                    <div className="relative w-28 h-28 mx-auto mb-6">
                      <div className="pulse-ring-1" />
                      <div className="pulse-ring-2" />
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#1a2035] flex items-center justify-center relative z-10 avatar-glow">
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-bold text-violet-400">
                            {displayName?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-white font-semibold text-lg mb-1">{displayName}</p>
                    <p className="text-gray-300 text-sm">Waiting to connect…</p>
                    <div className="flex justify-center gap-1.5 mt-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                             style={{ animation: `callPulse 1.4s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : remoteStreamEntries.length === 1 ? (
              // ─── ONE-ON-ONE STATE: Remote stream covers screen, local floats in PiP ───
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                {remoteStreamEntries.map(([socketId, { stream, user: pUser }]) => (
                  <RemoteVideo key={socketId} stream={stream} user={pUser} isFullScreen={true} />
                ))}
              </div>
            ) : (
              // ─── GROUP STATE: Remote streams arranged in grid, local floats in PiP ───
              <div className={`h-full grid gap-2 p-3 ${gridClass}`}>
                {remoteStreamEntries.map(([socketId, { stream, user: pUser }]) => (
                  <RemoteVideo key={socketId} stream={stream} user={pUser} isFullScreen={false} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Audio Call UI ── */
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease both' }}>
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="pulse-ring-1" style={{ inset: '-20px' }} />
                <div className="pulse-ring-2" style={{ inset: '-36px' }} />
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1a2035] flex items-center justify-center relative z-10 avatar-glow">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold text-violet-400">
                      {displayName?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-white font-bold text-2xl mb-1">{displayName}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {isConnected ? (
                  <>
                    <div className="status-dot" />
                    <span className="text-emerald-400 text-sm font-semibold">Connected · {formatDuration(callDuration)}</span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Calling…</span>
                )}
              </div>

              {/* Waveform decorative */}
              {isConnected && (
                <div className="flex items-center justify-center gap-1 mt-6">
                  {[3, 6, 9, 5, 8, 4, 7, 3, 6].map((h, i) => (
                    <div key={i} className="w-1 rounded-full bg-violet-500/60"
                         style={{
                           height: `${h * 3}px`,
                           animation: `callPulse ${0.8 + i * 0.1}s ease-in-out infinite`,
                           animationDelay: `${i * 0.08}s`
                         }} />
                  ))}
                </div>
              )}

              {/* Hidden audio elements */}
              {remoteStreamEntries.map(([socketId, { stream }]) => (
                <AudioOnly key={socketId} stream={stream} />
              ))}
            </div>
          </div>
        )}

        {/* Local video PiP box overlay (only shown when call is connected/active) */}
        {isVideo && remoteStreamEntries.length > 0 && (
          <div className="pip-local">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d1220]">
                <span className="text-xl font-bold text-violet-400">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="name-tag">You</div>
          </div>
        )}
      </div>

      {/* ── Controls Bar ── */}
      <div className="call-controls-glass relative z-10 flex items-center justify-center gap-5 py-6 px-8"
           style={{ animation: 'fadeInUp 0.4s ease 0.1s both' }}>

        {/* Mute / Unmute */}
        <CallButton
          id="toggle-audio-btn"
          active={!isAudioEnabled}
          onClick={handleToggleAudio}
          label={isAudioEnabled ? 'Mute' : 'Unmute'}
          icon={
            isAudioEnabled ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1
                  1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61
                  6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9
                  3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76
                  0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
              </svg>
            )
          }
        />

        {/* Camera toggle (video only) */}
        {isVideo && (
          <CallButton
            id="toggle-video-btn"
            active={!isVideoEnabled}
            onClick={handleToggleVideo}
            label={isVideoEnabled ? 'Cam Off' : 'Cam On'}
            icon={
              isVideoEnabled ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14m-5 0H5a2 2 0 01-2-2V8m0 0l5-5M3 3l18 18" />
                </svg>
              )
            }
          />
        )}

        {/* Switch Camera button (video only) */}
        {isVideo && localStream && localStream.getVideoTracks().length > 0 && (
          <CallButton
            id="switch-camera-btn"
            active={false}
            onClick={handleSwitchCamera}
            label="Flip Cam"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
            }
          />
        )}

        {/* End Call */}
        <div className="ctrl-btn" onClick={handleEndCall}>
          <button
            id="end-call-btn"
            className="ctrl-btn-circle ctrl-end w-16 h-16 text-white"
            style={{ fontSize: 0 }}
          >
            <svg className="w-7 h-7 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24
                1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17
                0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </button>
          <span style={{ fontSize: 11, color: 'rgba(239,68,68,0.8)', fontWeight: 500 }}>End</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CallButton({ id, active, onClick, icon, label }) {
  return (
    <div className="ctrl-btn" onClick={onClick}>
      <button
        id={id}
        className={`ctrl-btn-circle w-12 h-12 ${active ? 'ctrl-off' : 'ctrl-normal'}`}
      >
        {icon}
      </button>
      <span style={{ fontSize: 11, color: active ? 'rgba(239,68,68,0.8)' : 'rgba(156,163,175,1)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

function RemoteVideo({ stream, user: pUser, isFullScreen }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = null;
      el.srcObject = stream;
      el.play().catch((e) => console.warn('RemoteVideo play error:', e.message));
    }
  }, [stream]);

  return (
    <div className={isFullScreen ? "absolute inset-0 w-full h-full overflow-hidden" : "video-tile"}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="name-tag">{pUser?.name || 'Participant'}</div>
    </div>
  );
}

function AudioOnly({ stream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const el = audioRef.current;
    if (el && stream) {
      el.srcObject = stream;
      el.play().catch((e) => console.warn('Audio play error:', e.message));
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
