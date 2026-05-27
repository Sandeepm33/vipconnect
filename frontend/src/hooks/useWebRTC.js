'use client';
import { useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import useCallStore from '@/store/callStore';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Global ICE queue — persists across hook instances
const globalIceQueue = {};

const useWebRTC = () => {
  const localStreamRef = useRef(null);

  // ─── Get local media stream ──────────────────────────────────────────────
  const getLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const { localStream } = useCallStore.getState();
      if (localStream) return localStream;

      // Check if browser context is secure (getUserMedia requires localhost or HTTPS)
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        toast.error(
          'Media access is blocked in non-secure HTTP contexts. Please use HTTPS or localhost to enable camera/microphone.',
          { duration: 8000 }
        );
        return null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Media devices are not supported or are blocked by browser settings.');
        return null;
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      } catch (firstErr) {
        console.warn('Initial getUserMedia failed, trying fallback...', firstErr);

        // If permission was explicitly denied, do not fallback/retry
        if (firstErr.name === 'NotAllowedError') {
          throw firstErr;
        }

        // Try fallback options if we requested both
        if (video && audio) {
          try {
            // Fallback 1: Try audio only
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            toast('No camera found, using microphone only', { icon: '🎙️' });
            useCallStore.setState({ isVideoEnabled: false });
          } catch (audioErr) {
            try {
              // Fallback 2: Try video only
              stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
              toast('No microphone found, using camera only', { icon: '📷' });
              useCallStore.setState({ isAudioEnabled: false });
            } catch (videoErr) {
              throw firstErr; // Propagate the original error if both failed
            }
          }
        } else {
          throw firstErr;
        }
      }

      localStreamRef.current = stream;
      useCallStore.getState().setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('getUserMedia error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please click the site settings icon in your browser URL bar to allow permissions.', { duration: 6000 });
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera or microphone hardware found on this device.');
      } else {
        toast.error(`Could not access camera/microphone: ${err.message || 'Unknown error'}`);
      }
      return null;
    }
  }, []);

  // ─── Create a peer connection ────────────────────────────────────────────
  const createPeerConnection = useCallback((remoteSocketId, localStream, roomId) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // When we receive remote tracks, add to store
    pc.ontrack = (event) => {
      const incomingStream = event.streams?.[0];
      const newStream = incomingStream
        ? new MediaStream(incomingStream.getTracks())
        : new MediaStream([event.track]);

      const { callParticipants } = useCallStore.getState();
      const pUser = callParticipants.find((p) => p.socketId === remoteSocketId)?.user || null;
      useCallStore.getState().addRemoteStream(remoteSocketId, newStream, pUser);
    };

    // Send ICE candidates to the remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          targetSocketId: remoteSocketId,
          candidate: event.candidate,
          roomId,
        });
      }
    };

    // Log ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE state [${remoteSocketId}]:`, pc.iceConnectionState);
    };

    // Clean up on disconnect/failure
    pc.onconnectionstatechange = () => {
      console.log(`Connection state [${remoteSocketId}]:`, pc.connectionState);
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        useCallStore.getState().removeRemoteStream(remoteSocketId);
        useCallStore.getState().removeParticipant(remoteSocketId);
      }
    };

    useCallStore.getState().addPeerConnection(remoteSocketId, pc);

    // Drain any ICE candidates that arrived before this PC was created
    if (globalIceQueue[remoteSocketId]?.length > 0) {
      pc.iceQueue = [...globalIceQueue[remoteSocketId]];
      delete globalIceQueue[remoteSocketId];
    }

    return pc;
  }, []);

  // ─── Flush queued ICE candidates after remote description is set ─────────
  const flushIceQueue = useCallback(async (pc) => {
    if (pc.iceQueue?.length > 0) {
      for (const candidate of pc.iceQueue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Queued ICE candidate error:', e.message);
        }
      }
      pc.iceQueue = [];
    }
  }, []);

  // ─── Initiate a connection (send offer) ──────────────────────────────────
  const connectToPeer = useCallback(async (remoteSocketId, localStream, roomId, user) => {
    const socket = getSocket();
    // Don't create duplicate connections
    const { peerConnections } = useCallStore.getState();
    if (peerConnections[remoteSocketId]) {
      console.log('Peer connection already exists for', remoteSocketId);
      return peerConnections[remoteSocketId];
    }

    useCallStore.getState().addParticipant({
      socketId: remoteSocketId,
      user,
      videoEnabled: true,
      audioEnabled: true,
    });

    const pc = createPeerConnection(remoteSocketId, localStream, roomId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('webrtc_offer', { targetSocketId: remoteSocketId, offer, roomId });
    } catch (err) {
      console.error('Error creating offer:', err);
    }

    return pc;
  }, [createPeerConnection]);

  // ─── Handle incoming offer (send answer) ─────────────────────────────────
  const handleOffer = useCallback(async ({ offer, fromSocketId, fromUser, roomId }, localStream) => {
    const socket = getSocket();
    // Don't handle duplicate offers
    const { peerConnections } = useCallStore.getState();
    if (peerConnections[fromSocketId]) {
      console.log('Already have peer connection for', fromSocketId, '— ignoring offer');
      return;
    }

    useCallStore.getState().addParticipant({
      socketId: fromSocketId,
      user: fromUser,
      videoEnabled: true,
      audioEnabled: true,
    });

    const pc = createPeerConnection(fromSocketId, localStream, roomId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIceQueue(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('webrtc_answer', { targetSocketId: fromSocketId, answer, roomId });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, flushIceQueue]);

  // ─── Handle incoming answer ───────────────────────────────────────────────
  const handleAnswer = useCallback(async ({ answer, fromSocketId }) => {
    const { peerConnections } = useCallStore.getState();
    const pc = peerConnections[fromSocketId];

    if (!pc) {
      console.warn('No peer connection found for answer from', fromSocketId);
      return;
    }

    if (pc.signalingState === 'stable') {
      console.warn('PC already stable, ignoring answer from', fromSocketId);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await flushIceQueue(pc);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, [flushIceQueue]);

  // ─── Handle incoming ICE candidate ───────────────────────────────────────
  const handleIceCandidate = useCallback(async ({ candidate, fromSocketId }) => {
    if (!candidate) return;

    const { peerConnections } = useCallStore.getState();
    const pc = peerConnections[fromSocketId];

    if (!pc) {
      // PC not created yet — queue it globally
      globalIceQueue[fromSocketId] = globalIceQueue[fromSocketId] || [];
      globalIceQueue[fromSocketId].push(candidate);
      return;
    }

    try {
      if (pc.remoteDescription?.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Remote description not set yet — queue on the PC
        pc.iceQueue = pc.iceQueue || [];
        pc.iceQueue.push(candidate);
      }
    } catch (err) {
      console.warn('ICE candidate error:', err.message);
    }
  }, []);

  // ─── Handle a participant leaving ─────────────────────────────────────────
  const handleParticipantLeft = useCallback(({ socketId }) => {
    useCallStore.getState().removePeerConnection(socketId);
    useCallStore.getState().removeRemoteStream(socketId);
    useCallStore.getState().removeParticipant(socketId);
    // Clean up global ICE queue for this peer
    delete globalIceQueue[socketId];
  }, []);

  // ─── Full cleanup ─────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    // Clear global ICE queue
    Object.keys(globalIceQueue).forEach((k) => delete globalIceQueue[k]);
  }, []);

  return {
    getLocalStream,
    createPeerConnection,
    connectToPeer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleParticipantLeft,
    cleanup,
  };
};

export default useWebRTC;
