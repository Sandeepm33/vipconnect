'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useChatStore from '@/store/chatStore';
import useCallStore from '@/store/callStore';
import { initSocket } from '@/lib/socket';
import useSocket from '@/hooks/useSocket';
import Sidebar from '@/components/sidebar/Sidebar';
import IncomingCallModal from '@/components/calls/IncomingCallModal';
import CallWindow from '@/components/calls/CallWindow';

function SocketInitializer() {
  useSocket(true); // registers all socket event handlers
  return null;
}

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token, fetchMe } = useAuthStore();
  const { fetchChats } = useChatStore();
  const { incomingCall, isCallActive } = useCallStore();

  useEffect(() => {
    const localToken = localStorage.getItem('vipconnect_token');
    if (!isAuthenticated && !localToken) {
      router.replace('/login');
      return;
    }
    
    const activeToken = token || localToken;
    if (activeToken) {
      initSocket(activeToken);
      fetchMe();
      fetchChats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Don't block render if we have a token in localStorage (handles Zustand persist hydration delay)
  // This prevents the avatar from disappearing while the store is rehydrating
  const hasLocalToken = typeof window !== 'undefined' && !!localStorage.getItem('vipconnect_token');
  if (!isAuthenticated && !hasLocalToken) return null;

  const isChatRoute = pathname.startsWith('/chat/');

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-chat-bg">
      <SocketInitializer />

      {/* Sidebar — hidden on mobile when inside a chat */}
      <div className={`h-full flex-shrink-0 ${isChatRoute ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <Sidebar />
      </div>

      {/* Main Content — full width on mobile when inside a chat */}
      <main className={`flex flex-col overflow-hidden ${!isChatRoute ? 'hidden md:flex flex-1' : 'flex flex-1 w-full'}`}>
        {children}
      </main>

      {/* Incoming Call Modal */}
      {incomingCall && <IncomingCallModal />}

      {/* Active Call Window */}
      {isCallActive && <CallWindow />}
    </div>
  );
}
