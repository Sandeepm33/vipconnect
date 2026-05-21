'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import ChatWindow from '@/components/chat/ChatWindow';
import api from '@/lib/api';

export default function ChatPage() {
  const { id } = useParams();
  const { setActiveChat, activeChat } = useChatStore();

  useEffect(() => {
    if (!id) return;
    // Fetch chat details
    api.get(`/chats/${id}`).then((data) => {
      setActiveChat(data.chat);
    }).catch(console.error);

    return () => {
      setActiveChat(null);
    };
  }, [id]);

  if (!activeChat) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <ChatWindow />;
}
