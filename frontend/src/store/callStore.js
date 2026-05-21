import { create } from 'zustand';

const useCallStore = create((set, get) => ({
  // Current active call
  activeCall: null,
  // Incoming call notification
  incomingCall: null,
  // Call state
  isCallActive: false,
  isVideoEnabled: true,
  isAudioEnabled: true,
  isSpeakerEnabled: false,
  // WebRTC peer connections map: socketId -> RTCPeerConnection
  peerConnections: {},
  // Remote streams map: socketId -> { stream, user }
  remoteStreams: {},
  // Local stream
  localStream: null,
  // Participants in the call
  callParticipants: [],
  // Offers received before local stream was ready
  pendingOffers: [],

  addPendingOffer: (offer) => set((state) => ({ pendingOffers: [...state.pendingOffers, offer] })),
  clearPendingOffers: () => set({ pendingOffers: [] }),

  setIncomingCall: (call) => set({ incomingCall: call }),
  clearIncomingCall: () => set({ incomingCall: null }),

  // Promise to track in-flight media requests
  mediaPromise: null,
  setMediaPromise: (promise) => set({ mediaPromise: promise }),

  setActiveCall: (call) => set({ activeCall: call, isCallActive: !!call }),

  setLocalStream: (stream) => set({ localStream: stream }),

  addRemoteStream: (socketId, stream, user) => {
    set((state) => ({
      remoteStreams: { ...state.remoteStreams, [socketId]: { stream, user } },
    }));
  },

  removeRemoteStream: (socketId) => {
    set((state) => {
      const { [socketId]: removed, ...rest } = state.remoteStreams;
      return { remoteStreams: rest };
    });
  },

  addPeerConnection: (socketId, pc) => {
    set((state) => ({
      peerConnections: { ...state.peerConnections, [socketId]: pc },
    }));
  },

  removePeerConnection: (socketId) => {
    const { peerConnections } = get();
    if (peerConnections[socketId]) {
      peerConnections[socketId].close();
    }
    set((state) => {
      const { [socketId]: removed, ...rest } = state.peerConnections;
      return { peerConnections: rest };
    });
  },

  setCallParticipants: (participants) => set({ callParticipants: participants }),

  addParticipant: (participant) => {
    set((state) => ({
      callParticipants: [...state.callParticipants.filter(p => p.socketId !== participant.socketId), participant],
    }));
  },

  removeParticipant: (socketId) => {
    set((state) => ({
      callParticipants: state.callParticipants.filter((p) => p.socketId !== socketId),
    }));
  },

  updateParticipantMedia: (socketId, video, audio) => {
    set((state) => ({
      callParticipants: state.callParticipants.map((p) =>
        p.socketId === socketId ? { ...p, videoEnabled: video, audioEnabled: audio } : p
      ),
    }));
  },

  toggleVideo: () => {
    const { localStream } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        set({ isVideoEnabled: videoTrack.enabled });
      }
    }
  },

  toggleAudio: () => {
    const { localStream } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        set({ isAudioEnabled: audioTrack.enabled });
      }
    }
  },

  endCall: () => {
    const { localStream, peerConnections } = get();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    Object.values(peerConnections).forEach((pc) => {
      try { pc.close(); } catch {}
    });
    set({
      activeCall: null,
      incomingCall: null,
      isCallActive: false,
      localStream: null,
      remoteStreams: {},
      peerConnections: {},
      callParticipants: [],
      pendingOffers: [],
      mediaPromise: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
    });
  },
}));

export default useCallStore;
