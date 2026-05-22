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
  const [view, setView] = useState('chats');
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
      <aside className="w-full md:w-[360px] flex-shrink-0 flex flex-col h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0f1623 0%, #111827 60%, #0d1520 100%)' }}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary-500/5 blur-3xl rounded-full pointer-events-none" />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b z-10"
          style={{ borderColor: 'rgba(45,55,72,0.6)', background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)' }}
        >
          {/* Left: App brand + user */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 group"
          >
            {/* Avatar with ring */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary-500/40 group-hover:ring-primary-500/70 transition-all duration-300 shadow-lg shadow-primary-500/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                  >
                    <span className="text-white font-bold text-base">{initials}</span>
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary-500 rounded-full border-2 border-[#111827] shadow-sm shadow-primary-500/50" />
            </div>

            {/* Name + status */}
            <div className="text-left">
              <p className="text-white font-semibold text-sm leading-tight group-hover:text-primary-400 transition-colors">
                {user?.name}
              </p>
              <p className="text-primary-400 text-[11px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse inline-block" />
                Active now
              </p>
            </div>
          </button>

          {/* Right: Action icons */}
          <div className="flex items-center gap-0.5">
            {/* Search / New Chat */}
            <IconBtn
              id="search-contacts-btn"
              title={view === 'search' ? 'Back to chats' : 'New chat'}
              active={view === 'search'}
              onClick={() => setView(view === 'search' ? 'chats' : 'search')}
            >
              {view === 'search' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </IconBtn>

            {/* Create Group */}
            <IconBtn id="create-group-btn" title="Create group" onClick={() => setShowCreateGroup(true)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </IconBtn>

            {/* Menu */}
            <div className="relative">
              <IconBtn id="sidebar-menu-btn" title="Menu" onClick={() => setShowMenu(!showMenu)}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </IconBtn>

              {showMenu && (
                <div className="absolute right-0 top-11 w-48 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in"
                  style={{ background: 'rgba(22,27,34,0.95)', border: '1px solid rgba(45,55,72,0.8)', backdropFilter: 'blur(20px)' }}
                >
                  <button
                    onClick={() => { setShowProfile(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-all flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Edit Profile
                  </button>
                  <div className="h-px mx-3" style={{ background: 'rgba(45,55,72,0.6)' }} />
                  <button
                    onClick={() => { handleLogout(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center gap-3"
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
        </div>

        {/* ── Section label ───────────────────────────────────────────────── */}
        {view === 'chats' && (
          <div className="px-5 pt-4 pb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Messages</span>
          </div>
        )}

        {/* ── Content area ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {view === 'chats' ? (
            <ChatList />
          ) : (
            <ContactSearch onClose={() => setView('chats')} />
          )}
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0d1520, transparent)' }}
        />
      </aside>

      {showCreateGroup && <CreateGroup onClose={() => setShowCreateGroup(false)} />}
      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </>
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
