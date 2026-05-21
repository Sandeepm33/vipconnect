'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ContactSearch({ onClose }) {
  const router = useRouter();
  const { searchUsers, searchResults, isSearching, createChat, clearSearch } = useChatStore();
  const [query, setQuery] = useState('');
  const [syncedContacts, setSyncedContacts] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [view, setView] = useState('default'); // 'default' | 'synced'
  const inputRef = useRef(null);

  // Check if Contact Picker API is available (Chrome Android only)
  const contactsSupported =
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    typeof window !== 'undefined' &&
    'ContactsManager' in window;

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearSearch();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setView('default');
        searchUsers(query);
      } else {
        clearSearch();
        if (syncDone) setView('synced');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = async (user) => {
    try {
      const chat = await createChat(user._id);
      router.push(`/chat/${chat._id}`);
      onClose();
    } catch (err) {
      toast.error('Could not open chat');
    }
  };

  // ─── Contact Sync ───────────────────────────────────────────────────────────
  const syncContacts = useCallback(async () => {
    if (!contactsSupported) return;
    try {
      setIsSyncing(true);
      toast('Opening your contacts...', { icon: '📱', duration: 2000 });

      // Native contact picker — user selects all or some contacts
      const selected = await navigator.contacts.select(['name', 'tel'], {
        multiple: true,
      });

      if (!selected || selected.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Collect all phone numbers
      const phones = [];
      selected.forEach((c) => (c.tel || []).forEach((t) => t && phones.push(t.trim())));

      if (!phones.length) {
        toast('No phone numbers found in selected contacts', { icon: 'ℹ️' });
        setIsSyncing(false);
        return;
      }

      // Ask backend which numbers are VipConnect users
      const data = await api.post('/users/sync-contacts', { phones });
      setSyncedContacts(data.users || []);
      setSyncDone(true);
      setView('synced');

      if (data.users.length === 0) {
        toast('None of your contacts are on VipConnect yet 😔\nShare the app with them!', {
          duration: 4000,
        });
      } else {
        toast.success(
          `✅ Found ${data.users.length} contact${data.users.length > 1 ? 's' : ''} on VipConnect!`
        );
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled — silently ignore
      } else {
        toast.error('Contact sync failed. Please try again.');
        console.error(err);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [contactsSupported]);

  const displayList = view === 'synced' ? syncedContacts : searchResults;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-chat-border space-y-3">

        {/* Search input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            id="contact-search-input"
            type="text"
            className="w-full bg-dark-700 border border-chat-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-primary-500 transition-colors"
            placeholder="Search by name, email or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => { setQuery(''); clearSearch(); if (syncDone) setView('synced'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Sync Contacts Card ─────────────────────────────────── */}
        {contactsSupported ? (
          <button
            id="sync-contacts-btn"
            onClick={syncContacts}
            disabled={isSyncing}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500/10 to-blue-500/10 border border-primary-500/30 hover:border-primary-500/60 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">
                {isSyncing ? 'Syncing contacts...' : syncDone ? 'Re-sync Phone Contacts' : 'Sync Phone Contacts'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {syncDone
                  ? `${syncedContacts.length} contact${syncedContacts.length !== 1 ? 's' : ''} found on VipConnect`
                  : 'Find your contacts who use VipConnect'}
              </p>
            </div>
            {syncDone && (
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ) : (
          /* Not supported — informational banner */
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Contact Sync</p>
              <p className="text-xs text-gray-600">Open on Chrome Android to sync contacts</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {/* Section label */}
        {view === 'synced' && syncedContacts.length > 0 && !query && (
          <div className="px-4 py-2 flex items-center justify-between border-b border-chat-border/30">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              📱 Contacts on VipConnect
            </span>
            <span className="text-xs text-primary-400">{syncedContacts.length} found</span>
          </div>
        )}

        {(isSearching || isSyncing) && (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {/* No results */}
        {!isSearching && !isSyncing && query && searchResults.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm px-6">
            <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No users found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs mt-1 text-gray-600">Try searching by phone number</p>
          </div>
        )}

        {/* Synced — no contacts on VipConnect */}
        {!isSearching && !isSyncing && view === 'synced' && syncedContacts.length === 0 && !query && (
          <div className="text-center py-12 text-gray-500 text-sm px-6">
            <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-medium">No contacts on VipConnect yet</p>
            <p className="text-xs mt-2 text-gray-600 leading-relaxed">
              Share the app with your contacts so they can join!
            </p>
          </div>
        )}

        {/* Default empty state */}
        {!query && !syncDone && !isSearching && (
          <div className="text-center py-12 text-gray-500 text-sm px-6">
            <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-medium">Find people on VipConnect</p>
            <p className="text-xs mt-2 text-gray-600">
              {contactsSupported
                ? 'Sync your phone contacts above, or search by name, email or phone number'
                : 'Search by name, email or phone number'}
            </p>
          </div>
        )}

        {/* User list */}
        {!isSearching && !isSyncing && displayList.map((user) => (
          <div
            key={user._id}
            onClick={() => handleSelectUser(user)}
            className="sidebar-item cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center flex-shrink-0">
                {user.avatar?.url ? (
                  <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-400 font-semibold text-lg">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              {/* Online indicator */}
              {user.status === 'online' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-chat-sidebar" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-gray-500 text-xs truncate">
                {user.phone ? `📱 ${user.phone}` : user.email}
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
