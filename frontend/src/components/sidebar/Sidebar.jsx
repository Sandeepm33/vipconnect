'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import useAuthStore from '@/store/authStore';
import ChatList from './ChatList';
import ContactSearch from './ContactSearch';
import CreateGroup from '@/components/groups/CreateGroup';
import ProfileEditor from '@/components/profile/ProfileEditor';

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [view, setView] = useState('chats'); // 'chats' | 'search' | 'profile'
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const avatarUrl = user?.avatar?.url || null;
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <aside className="w-full md:w-[360px] flex-shrink-0 flex flex-col bg-chat-sidebar border-r border-chat-border h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-chat-header border-b border-chat-border">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-400 font-semibold text-lg">{initials}</span>
                )}
              </div>
              <div className="online-dot" />
            </div>
            <span className="text-white font-medium text-sm">{user?.name}</span>
          </button>

          <div className="flex items-center gap-1">
            {/* New chat / compose */}
            <button
              id="search-contacts-btn"
              onClick={() => setView(view === 'search' ? 'chats' : 'search')}
              title="New chat"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Create group */}
            <button
              id="create-group-btn"
              onClick={() => setShowCreateGroup(true)}
              title="Create group"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Menu */}
            <div className="relative">
              <button
                id="sidebar-menu-btn"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 bg-chat-panel border border-chat-border rounded-xl shadow-xl z-50 min-w-40 overflow-hidden animate-scale-in">
                  <button
                    onClick={() => { setShowProfile(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { handleLogout(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {view === 'chats' ? <ChatList /> : <ContactSearch onClose={() => setView('chats')} />}
        </div>
      </aside>

      {/* Create Group Modal */}
      {showCreateGroup && <CreateGroup onClose={() => setShowCreateGroup(false)} />}

      {/* Profile Editor Modal */}
      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}

      {/* Close menu on outside click */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </>
  );
}
