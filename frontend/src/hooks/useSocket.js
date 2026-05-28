'use client';
import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import useChatStore from '@/store/chatStore';
import useCallStore from '@/store/callStore';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

const useSocket = (registerListeners = false) => {
  const socket = getSocket();
  const {
    addMessage,
    updateMessage,
    setTyping,
    setUserOnline,
    setUserOffline,
    updateChatLastMessage,
    activeChat,
  } = useChatStore();
  const { setIncomingCall } = useCallStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !user || !registerListeners) return;

    // Chat events
    const handleNewMessage = ({ message, chatId }) => {
      addMessage(chatId, message);

      const senderId = message.sender?._id || message.sender;
      if (senderId && senderId !== user?._id) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const playBeep = (freq, startTime, duration) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, startTime);
              gain.gain.setValueAtTime(0, startTime);
              gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(startTime);
              osc.stop(startTime + duration);
            };
            const now = ctx.currentTime;
            playBeep(880, now, 0.12);
            playBeep(1200, now + 0.08, 0.22);
          }
        } catch (err) {
          console.error('Failed to play notification sound:', err);
        }
      }
    };

    const handleChatUpdated = ({ chatId, lastMessage }) => {
      updateChatLastMessage(chatId, lastMessage);
    };

    const handleTypingStart = ({ chatId, user: typingUser }) => {
      setTyping(chatId, typingUser._id, typingUser.name, true);
    };

    const handleTypingStop = ({ chatId, userId }) => {
      setTyping(chatId, userId, '', false);
    };

    const handleMessageDeleted = ({ messageId, chatId, deleteForEveryone }) => {
      if (deleteForEveryone) {
        updateMessage(chatId, messageId, {
          deletedForEveryone: true,
          content: 'This message was deleted',
        });
      } else {
        useChatStore.getState().removeMessage(chatId, messageId);
      }
    };

    const handleMessageEdited = ({ messageId, chatId, content, isEdited, editedAt }) => {
      updateMessage(chatId, messageId, {
        content,
        isEdited,
        editedAt,
      });
    };

    const handleMessageReaction = ({ messageId, chatId, reactions }) => {
      updateMessage(chatId, messageId, { reactions });
    };

    const handleMessagesRead = ({ chatId, messageIds, readBy }) => {
      messageIds.forEach((id) => {
        updateMessage(chatId, id, {
          readBy: [{ user: { _id: readBy }, readAt: new Date() }],
        });
      });
    };

    // Presence events
    const handleUserOnline = (userId) => {
      setUserOnline(userId);
    };

    const handleUserOffline = (userId) => {
      setUserOffline(userId);
    };

    const handleInitialOnlineUsers = (users) => {
      users.forEach((userId) => setUserOnline(userId));
    };

    // Call events
    const handleIncomingCall = (callData) => {
      setIncomingCall(callData);
      toast(
        `📞 Incoming ${callData.type} call from ${callData.initiator.name}`,
        { duration: 30000, icon: callData.type === 'video' ? '📹' : '📞' }
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('chat_updated', handleChatUpdated);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_reaction', handleMessageReaction);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('online_users', handleInitialOnlineUsers);
    socket.on('call_incoming', handleIncomingCall);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('chat_updated', handleChatUpdated);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_reaction', handleMessageReaction);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('online_users', handleInitialOnlineUsers);
      socket.off('call_incoming', handleIncomingCall);
    };
  }, [socket, user]);

  const joinChat = useCallback(
    (chatId) => {
      socket?.emit('join_chat', chatId);
    },
    [socket]
  );

  const leaveChat = useCallback(
    (chatId) => {
      socket?.emit('leave_chat', chatId);
    },
    [socket]
  );

  const sendMessage = useCallback(
    (chatId, content, type = 'text', replyTo = null, tempId = null) => {
      socket?.emit('send_message', { chatId, content, type, replyTo, tempId });
    },
    [socket]
  );

  const sendTypingStart = useCallback(
    (chatId) => {
      socket?.emit('typing_start', { chatId });
    },
    [socket]
  );

  const sendTypingStop = useCallback(
    (chatId) => {
      socket?.emit('typing_stop', { chatId });
    },
    [socket]
  );

  const markMessagesRead = useCallback(
    (chatId, messageIds) => {
      socket?.emit('messages_read', { chatId, messageIds });
    },
    [socket]
  );

  const notifyFileSent = useCallback(
    (chatId, messageId) => {
      socket?.emit('file_message_sent', { chatId, messageId });
    },
    [socket]
  );

  const deleteMessage = useCallback(
    (chatId, messageId, deleteForEveryone) => {
      socket?.emit('delete_message', { chatId, messageId, deleteForEveryone });
    },
    [socket]
  );

  const editMessage = useCallback(
    (chatId, messageId, newContent) => {
      socket?.emit('edit_message', { chatId, messageId, newContent });
    },
    [socket]
  );

  return {
    socket,
    joinChat,
    leaveChat,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markMessagesRead,
    notifyFileSent,
    deleteMessage,
    editMessage,
  };
};

export default useSocket;
