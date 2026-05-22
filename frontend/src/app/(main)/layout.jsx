'use client';
import { useEffect, useState } from 'react';
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
  useSocket(true);
  return null;
}

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token, fetchMe } = useAuthStore();
  const { fetchChats } = useChatStore();
  const { incomingCall, isCallActive } = useCallStore();

  // Tracks whether we've completed client-side mount (avoids SSR/hydration mismatch)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  // Before mount: always render the layout shell (same on server & client → no hydration mismatch).
  // After mount: if no auth at all, redirect to login (handled in useEffect above).
  // Zustand persist rehydration happens client-side; isAuthenticated may briefly be false even
  // when a token exists — so we don't block render here, we let the useEffect handle redirects.
  if (!mounted) {
    // Render a minimal, consistent skeleton on both server and client during hydration
    return (
      <div className="h-[100dvh] w-full flex overflow-hidden bg-chat-bg">
        {/* Same DOM structure as the real layout so hydration is consistent */}
        <div className="h-full flex-shrink-0" />
        <main className="flex flex-col overflow-hidden flex-1" />
      </div>
    );
  }

  // After mount: if truly no auth token anywhere, show nothing (redirect is in flight)
  if (!isAuthenticated && !localStorage.getItem('vipconnect_token')) {
    return null;
  }

  const isChatRoute = pathname.startsWith('/chat/');

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-chat-bg">
      <SocketInitializer />

      {/* Sidebar — hidden on mobile when inside a chat */}
      <div className={`h-full flex-shrink-0 ${isChatRoute ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <Sidebar />
      </div>

      {/* Main content */}
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
