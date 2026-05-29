'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useChatStore from '@/store/chatStore';
import useCallStore from '@/store/callStore';
import { initSocket } from '@/lib/socket';
import useSocket from '@/hooks/useSocket';
import Sidebar from '@/components/sidebar/Sidebar';
import IncomingCallModal from '@/components/calls/IncomingCallModal';
import CallWindow from '@/components/calls/CallWindow';

import { Suspense } from 'react';

function SocketInitializer() {
  useSocket(true);
  return null;
}

function MainLayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  if (!mounted) {
    return (
      <div className="h-[100dvh] w-full flex overflow-hidden bg-chat-bg">
        <div className="h-full flex-shrink-0" />
        <main className="flex flex-col overflow-hidden flex-1" />
      </div>
    );
  }

  if (!isAuthenticated && !localStorage.getItem('vipconnect_token')) {
    return null;
  }

  const rawId = searchParams?.get('id');
  const validId = (rawId && rawId !== 'undefined' && rawId !== 'null') ? rawId : null;
  const isChatRoute = pathname.startsWith('/chat') && !!validId;

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

export default function MainLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] w-full flex overflow-hidden bg-chat-bg">
        <div className="h-full flex-shrink-0" />
        <main className="flex flex-col overflow-hidden flex-1" />
      </div>
    }>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  );
}
