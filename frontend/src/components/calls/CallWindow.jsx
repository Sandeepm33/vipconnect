'use client';
import { useEffect, useRef, useState } from 'react';
import useCallStore from '@/store/callStore';
import useWebRTC from '@/hooks/useWebRTC';
import useAuthStore from '@/store/authStore';
import { getSocket } from '@/lib/socket';

export default function CallWindow() {
  const {
    activeCall,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStreams,
    callParticipants,
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
    cleanup,
  } = useWebRTC();

  const localVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const durationRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    if (!activeCall) return;
    startCall();
    durationRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

    return () => {
      clearInterval(durationRef.current);
    };
  }, []);

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const startCall = async () => {
    const isVideo = activeCall?.type === 'video';
    let stream = localStream;
    if (!stream) {
      stream = await getLocalStream(isVideo, true);
    }
    if (!stream) return; // Aborted due to unmount

    // Connect to any participants that are already in the store (e.g. from call_participants)
    const { callParticipants, peerConnections } = useCallStore.getState();
    for (const p of callParticipants) {
      if (!peerConnections[p.socketId]) {
        await connectToPeer(p.socketId, stream, activeCall?.roomId, p.user);
      }
    }

    // Process any offers that arrived while we were getting camera permissions
    const { pendingOffers, clearPendingOffers } = useCallStore.getState();
    if (pendingOffers.length > 0) {
      for (const data of pendingOffers) {
        await handleOffer(data, stream);
      }
      clearPendingOffers();
    }
  };

  // WebRTC socket event listeners
  useEffect(() => {
    if (!socket) return;

    const onCallParticipants = async ({ participants }) => {
      setCallParticipants(participants);
      const stream = useCallStore.getState().localStream;
      if (stream) {
        const { peerConnections } = useCallStore.getState();
        for (const p of participants) {
          if (!peerConnections[p.socketId]) {
            await connectToPeer(p.socketId, stream, activeCall?.roomId, p.user);
          }
        }
      }
    };

    const onParticipantJoined = ({ socketId, user: pUser }) => {
      addParticipant({ socketId, user: pUser, videoEnabled: true, audioEnabled: true });
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

    const onCallEnded = () => {
      endCall();
    };

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
  }, [socket]);

  const handleEndCall = () => {
    socket?.emit('call_end', {
      callId: activeCall?.callId,
      roomId: activeCall?.roomId,
    });
    endCall();
  };

  const handleToggleVideo = () => {
    toggleVideo();
    socket?.emit('media_state_change', {
      roomId: activeCall?.roomId,
      video: !isVideoEnabled,
      audio: isAudioEnabled,
    });
  };

  const handleToggleAudio = () => {
    toggleAudio();
    socket?.emit('media_state_change', {
      roomId: activeCall?.roomId,
      video: isVideoEnabled,
      audio: !isAudioEnabled,
    });
  };

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
    ? activeCall.chat.members.find(m => String(m._id) !== String(user?._id))
    : null;

  const remoteUser = otherMember || (!isInitiator ? activeCall?.initiator : null);

  const displayName = isGroup 
    ? activeCall?.chat?.name 
    : (remoteUser?.name || 'Unknown');
    
  const displayAvatar = isGroup
    ? activeCall?.chat?.groupPicture?.url
    : remoteUser?.avatar?.url;

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col">
      {/* Call header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div>
          <h2 className="text-white font-semibold">
            {displayName}
          </h2>
          <p className="text-primary-400 text-sm">
            {callDuration > 0 ? formatDuration(callDuration) : 'Connecting...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGroup && (
            <span className="text-xs text-gray-400 border border-gray-700 px-2 py-1 rounded-lg">
              {remoteStreamEntries.length + 1} participants
            </span>
          )}
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-hidden relative">
        {isVideo ? (
          <div className={`h-full grid gap-2 p-3 ${
            remoteStreamEntries.length === 0 ? 'grid-cols-1' :
            remoteStreamEntries.length === 1 ? 'grid-cols-1' :
            remoteStreamEntries.length <= 3 ? 'grid-cols-2' :
            'grid-cols-2 sm:grid-cols-3'
          }`}>
            {/* Remote videos */}
            {remoteStreamEntries.map(([socketId, { stream, user: pUser }]) => (
              <RemoteVideo key={socketId} stream={stream} user={pUser} socketId={socketId} />
            ))}

            {/* No remote streams yet */}
            {remoteStreamEntries.length === 0 && (
              <div className="flex items-center justify-center rounded-2xl bg-dark-700">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-dark-600 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-primary-400">
                        {displayName?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">Waiting for others to join...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Audio call UI */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="relative w-36 h-36 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 rounded-full bg-primary-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                <div className="relative w-full h-full rounded-full overflow-hidden bg-dark-600 flex items-center justify-center">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold text-primary-400">
                      {displayName?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm">Voice call in progress</p>
              {remoteStreamEntries.map(([socketId, { stream }]) => (
                <AudioOnly key={socketId} stream={stream} />
              ))}
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {isVideo && (
          <div className="absolute bottom-4 right-4 w-32 h-44 rounded-2xl overflow-hidden bg-dark-700 shadow-xl border border-white/10">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                <span className="text-2xl font-bold text-primary-400">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <p className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-gray-400">You</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-6 bg-black/50 backdrop-blur-sm border-t border-white/10">
        {/* Mute */}
        <CallButton
          id="toggle-audio-btn"
          active={!isAudioEnabled}
          activeColor="bg-red-500"
          onClick={handleToggleAudio}
          icon={
            isAudioEnabled ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
              </svg>
            )
          }
          label={isAudioEnabled ? 'Mute' : 'Unmute'}
        />

        {/* Video toggle */}
        {isVideo && (
          <CallButton
            id="toggle-video-btn"
            active={!isVideoEnabled}
            activeColor="bg-red-500"
            onClick={handleToggleVideo}
            icon={
              isVideoEnabled ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14m-5 0H5a2 2 0 01-2-2V8m0 0l5-5M3 3l18 18" />
                </svg>
              )
            }
            label={isVideoEnabled ? 'Camera Off' : 'Camera On'}
          />
        )}

        {/* End call */}
        <CallButton
          id="end-call-btn"
          active={true}
          activeColor="bg-red-500"
          onClick={handleEndCall}
          icon={
            <svg className="w-7 h-7 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          }
          label="End"
          large
        />
      </div>
    </div>
  );
}

function CallButton({ id, active, activeColor, onClick, icon, label, large }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        id={id}
        onClick={onClick}
        className={`${large ? 'w-16 h-16' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${
          active ? `${activeColor} shadow-red-500/30` : 'bg-white/10 hover:bg-white/20'
        } text-white`}
      >
        {icon}
      </button>
      <span className="text-gray-400 text-xs">{label}</span>
    </div>
  );
}

function RemoteVideo({ stream, user: pUser, socketId }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoObj = videoRef.current;
    if (videoObj && stream) {
      // Always forcefully re-assign to ensure the video element picks up track changes
      videoObj.srcObject = null;
      videoObj.srcObject = stream;
      
      // Ensure the video plays
      videoObj.play().catch(e => console.log('RemoteVideo play error:', e));
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-dark-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-3 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-lg">
        {pUser?.name || 'Participant'}
      </div>
    </div>
  );
}

function AudioOnly({ stream }) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(e => console.log('Audio play error:', e));
    }
  }, [stream]);
  return <audio ref={audioRef} autoPlay playsInline />;
}
