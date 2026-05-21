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
  }, [isAuthenticated, token]);

  if (!isAuthenticated) return null;

  const isChatRoute = pathname.startsWith('/chat/');

  return (
    <div className="h-screen w-full flex overflow-hidden bg-chat-bg">
      <SocketInitializer />

      {/* Sidebar */}
      <div className={`h-full w-full md:w-auto flex-shrink-0 transition-all ${isChatRoute ? 'hidden md:block' : 'block'}`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all ${!isChatRoute ? 'hidden md:flex' : 'flex'}`}>
        {children}
      </main>

      {/* Incoming Call Modal */}
      {incomingCall && <IncomingCallModal />}

      {/* Active Call Window */}
      {isCallActive && <CallWindow />}
    </div>
  );
}
