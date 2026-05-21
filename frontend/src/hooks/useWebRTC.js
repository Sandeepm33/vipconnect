'use client';
import { useCallback, useRef, useEffect } from 'react';
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

const useWebRTC = () => {
  const socket = getSocket();
  const {
    addPeerConnection,
    removePeerConnection,
    addRemoteStream,
    removeRemoteStream,
    setLocalStream,
    setMediaPromise,
    addParticipant,
    removeParticipant,
    peerConnections,
  } = useCallStore();

  const localStreamRef = useRef(null);
  const isMounted = useRef(true);
  const globalIceQueue = useRef({});

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get user media
  const getLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const { mediaPromise, localStream } = useCallStore.getState();
      
      // If we already have a stream, return it
      if (localStream) return localStream;

      // If a request is already in flight, wait for it
      if (mediaPromise) {
        const stream = await mediaPromise;
        if (stream) return stream;
      }

      // Create a new request and store the promise globally
      const promise = navigator.mediaDevices.getUserMedia({ video, audio });
      setMediaPromise(promise);

      const stream = await promise;
      
      if (!isMounted.current) {
        stream.getTracks().forEach(t => t.stop());
        setMediaPromise(null);
        return null;
      }
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaPromise(null);
      return stream;
    } catch (err) {
      console.error('getUserMedia error:', err);
      toast.error('Could not access camera/microphone');
      setMediaPromise(null);
      throw err;
    }
  }, [setLocalStream, setMediaPromise]);

  // Create a peer connection with a remote peer
  const createPeerConnection = useCallback(
    (remoteSocketId, localStream, roomId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      pc.ontrack = (event) => {
        // Create a completely new MediaStream using the tracks from the event stream
        // This forces React to detect a state change and re-assign srcObject
        const eventStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        const newStream = new MediaStream(eventStream.getTracks());
        
        const { callParticipants } = useCallStore.getState();
        const pUser = callParticipants.find((p) => p.socketId === remoteSocketId)?.user || null;
        addRemoteStream(remoteSocketId, newStream, pUser);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('webrtc_ice_candidate', {
            targetSocketId: remoteSocketId,
            candidate: event.candidate,
            roomId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          removeRemoteStream(remoteSocketId);
          removeParticipant(remoteSocketId);
        }
      };

      addPeerConnection(remoteSocketId, pc);

      // Add any globally queued ICE candidates that arrived before PC was created
      if (globalIceQueue.current[remoteSocketId]) {
        pc.iceQueue = (pc.iceQueue || []).concat(globalIceQueue.current[remoteSocketId]);
        delete globalIceQueue.current[remoteSocketId];
      }

      return pc;
    },
    [socket, addPeerConnection, addRemoteStream, removeRemoteStream, removeParticipant]
  );

  // Initiate connection to a new participant (send offer)
  const connectToPeer = useCallback(
    async (remoteSocketId, localStream, roomId, user) => {
      addParticipant({ socketId: remoteSocketId, user, videoEnabled: true, audioEnabled: true });
      const pc = createPeerConnection(remoteSocketId, localStream, roomId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('webrtc_offer', { targetSocketId: remoteSocketId, offer, roomId });
      return pc;
    },
    [socket, createPeerConnection, addParticipant]
  );

  // Handle incoming offer
  const handleOffer = useCallback(
    async ({ offer, fromSocketId, fromUser, roomId }, localStream) => {
      addParticipant({ socketId: fromSocketId, user: fromUser, videoEnabled: true, audioEnabled: true });
      const pc = createPeerConnection(fromSocketId, localStream, roomId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Process queued candidates
      if (pc.iceQueue) {
        for (const candidate of pc.iceQueue) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error('Delayed ICE error:', e));
        }
        pc.iceQueue = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('webrtc_answer', { targetSocketId: fromSocketId, answer, roomId });
      addParticipant({ socketId: fromSocketId, user: fromUser, videoEnabled: true, audioEnabled: true });
      return pc;
    },
    [socket, createPeerConnection, addParticipant]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(
    async ({ answer, fromSocketId }) => {
      const { peerConnections } = useCallStore.getState();
      const pc = peerConnections[fromSocketId];
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Process queued candidates
        if (pc.iceQueue) {
          for (const candidate of pc.iceQueue) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error('Delayed ICE error:', e));
          }
          pc.iceQueue = [];
        }
      }
    },
    []
  );

  // Handle ICE candidate
  const handleIceCandidate = useCallback(
    async ({ candidate, fromSocketId }) => {
      const { peerConnections } = useCallStore.getState();
      const pc = peerConnections[fromSocketId];
      if (pc && candidate) {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pc.iceQueue = pc.iceQueue || [];
            pc.iceQueue.push(candidate);
          }
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else if (!pc && candidate) {
        // PC not created yet, queue it globally
        globalIceQueue.current[fromSocketId] = globalIceQueue.current[fromSocketId] || [];
        globalIceQueue.current[fromSocketId].push(candidate);
      }
    },
    []
  );

  // Handle participant leaving
  const handleParticipantLeft = useCallback(
    ({ socketId }) => {
      removePeerConnection(socketId);
      removeRemoteStream(socketId);
      removeParticipant(socketId);
    },
    [removePeerConnection, removeRemoteStream, removeParticipant]
  );

  // Clean up all connections
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
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
