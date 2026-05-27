'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import useAuthStore from '@/store/authStore';
import ChatList from './ChatList';
import ContactSearch from './ContactSearch';
import CreateGroup from '@/components/groups/CreateGroup';
import ProfileEditor from '@/components/profile/ProfileEditor';
import StatusTab from './tabs/StatusTab';
import CommunitiesTab from './tabs/CommunitiesTab';
import BusinessTab from './tabs/BusinessTab';
import AIAssistantTab from './tabs/AIAssistantTab';

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [view, setView] = useState('chats');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const avatarUrl = user?.avatar?.url || null;
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <div className="w-full md:w-[428px] h-full flex flex-shrink-0 border-r border-white/5 overflow-hidden">
        {/* ── Left Vertical Navigation Rail (68px) ────────────────────────── */}
        <div className="w-[68px] h-full flex flex-col items-center justify-between py-5 border-r border-white/5 flex-shrink-0"
             style={{ background: 'rgba(11, 16, 26, 0.95)', backdropFilter: 'blur(12px)' }}>
          {/* Top block: profile avatar */}
          <div className="flex flex-col items-center gap-7 w-full">
            <button
              onClick={() => setShowProfile(true)}
              className="relative p-0.5 rounded-2xl ring-2 ring-primary-500/30 hover:ring-primary-500/70 transition-all duration-300 shadow-md shadow-primary-500/10 active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-primary-500 to-indigo-600">
                    <span className="text-white font-bold text-sm">{initials}</span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-500 rounded-full border-2 border-[#0b101a] shadow-sm shadow-primary-500/50" />
            </button>

            {/* Middle block: navigation deck */}
            <div className="flex flex-col gap-4 w-full items-center">
              <RailIcon active={view === 'chats'} onClick={() => { setView('chats'); setShowSearch(false); }} title="Chats">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </RailIcon>

              <RailIcon active={view === 'status'} onClick={() => setView('status')} title="Stories">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                </svg>
              </RailIcon>

              <RailIcon active={view === 'communities'} onClick={() => setView('communities')} title="Communities">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="7" r="3" />
                  <circle cx="6" cy="17" r="2.5" />
                  <circle cx="18" cy="17" r="2.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5L6.5 14.5M15 7.5l2.5 7M7.5 17h9" />
                </svg>
              </RailIcon>

              <RailIcon active={view === 'business'} onClick={() => setView('business')} title="Business Tools">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </RailIcon>

              <RailIcon active={view === 'ai'} onClick={() => setView('ai')} title="AI Assistant">
                <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.904L9 9l.813 5.096L15 15l-5.187.904z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.071 4.929L18.5 8.5l-3.5-.571 2.929-1.429L18.5 3l.571 3.5 2.929 1.429-3.5.571z" />
                </svg>
              </RailIcon>
            </div>
          </div>

          {/* Bottom block: menu trigger */}
          <div className="flex flex-col items-center gap-4 relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
              title="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute left-14 bottom-0 w-44 rounded-2xl border border-white/10 shadow-2xl z-[100] overflow-hidden"
                   style={{ background: '#111827', backdropFilter: 'blur(20px)' }}>
                <button
                  onClick={() => { setShowProfile(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </button>
                <div className="h-px bg-white/5 mx-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Content Sub-Panel (Fill) ────────────────────────────────── */}
        <aside className="flex-1 flex flex-col h-full relative overflow-hidden"
               style={{ background: 'linear-gradient(180deg, #080c14 0%, #0d121d 60%, #060910 100%)' }}
        >
          {/* Faint top boundary glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent pointer-events-none" />

          {view === 'chats' && (
            <>
              {/* Chats header */}
              <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-black/10 backdrop-blur-md z-40">
                <span className="text-white font-extrabold text-base tracking-wide">ConnectX</span>
                <div className="flex gap-1">
                  <IconBtn
                    id="search-contacts-btn"
                    title={showSearch ? 'Back to chats' : 'New chat'}
                    active={showSearch}
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    {showSearch ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </IconBtn>
                  <IconBtn id="create-group-btn" title="Create group" onClick={() => setShowCreateGroup(true)}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </IconBtn>
                </div>
              </div>

              {/* Chats/Search content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {showSearch ? (
                  <ContactSearch onClose={() => setShowSearch(false)} />
                ) : (
                  <>
                    <div className="px-5 pt-4 pb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Messages</span>
                    </div>
                    <ChatList />
                  </>
                )}
              </div>
            </>
          )}

          {view === 'status' && <StatusTab />}
          {view === 'communities' && <CommunitiesTab />}
          {view === 'business' && <BusinessTab />}
          {view === 'ai' && <AIAssistantTab />}

          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-[#060910] to-transparent" />
        </aside>
      </div>

      {showCreateGroup && <CreateGroup onClose={() => setShowCreateGroup(false)} />}
      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </>
  );
}

function RailIcon({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all duration-300 group active:scale-95 ${
        active
          ? 'text-primary-400 bg-primary-500/10 ring-1 ring-primary-500/20 shadow-md shadow-primary-500/5'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
      {/* Active line indicator on left */}
      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary-500 rounded-r-full transition-all duration-300 ${
        active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
      }`} />
    </button>
  );
}

function IconBtn({ id, title, onClick, active, children }) {
  return (
    <button
      id={id}
      title={title}
      onClick={onClick}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
        active
          ? 'text-primary-400 bg-primary-500/15'
          : 'text-gray-400 hover:text-white hover:bg-white/8'
      }`}
    >
      {children}
    </button>
  );
}
