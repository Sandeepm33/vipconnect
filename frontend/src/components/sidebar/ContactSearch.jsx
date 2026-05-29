'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useChatStore from '@/store/chatStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Gradient palette per initial letter
const gradients = [
  'linear-gradient(135deg,#7c3aed,#6d28d9)',
  'linear-gradient(135deg,#2563eb,#1d4ed8)',
  'linear-gradient(135deg,#059669,#047857)',
  'linear-gradient(135deg,#ea580c,#dc2626)',
  'linear-gradient(135deg,#db2777,#be185d)',
  'linear-gradient(135deg,#0891b2,#1d4ed8)',
  'linear-gradient(135deg,#d97706,#ea580c)',
  'linear-gradient(135deg,#a21caf,#db2777)',
];
function getGradient(name) {
  return gradients[(name?.charCodeAt(0) || 0) % gradients.length];
}

export default function ContactSearch({ onClose }) {
  const router = useRouter();
  const { searchUsers, searchResults, isSearching, createChat, clearSearch } = useChatStore();
  const [query, setQuery] = useState('');
  const [syncedContacts, setSyncedContacts] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [view, setView] = useState('default'); // 'default' | 'synced'
  const inputRef = useRef(null);

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
      router.push(`/chat?id=${chat._id}`);
      onClose();
    } catch {
      toast.error('Could not open chat');
    }
  };

  const syncContacts = useCallback(async () => {
    if (!contactsSupported) return;
    try {
      setIsSyncing(true);
      toast('Opening your contacts...', { icon: '📱', duration: 2000 });
      const selected = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      if (!selected || selected.length === 0) { setIsSyncing(false); return; }

      const phones = [];
      selected.forEach((c) => (c.tel || []).forEach((t) => t && phones.push(t.trim())));
      if (!phones.length) {
        toast('No phone numbers found in selected contacts', { icon: 'ℹ️' });
        setIsSyncing(false); return;
      }

      const data = await api.post('/users/sync-contacts', { phones });
      setSyncedContacts(data.users || []);
      setSyncDone(true);
      setView('synced');
      if (data.users.length === 0) {
        toast('None of your contacts are on VipConnect yet 😔\nShare the app with them!', { duration: 4000 });
      } else {
        toast.success(`✅ Found ${data.users.length} contact${data.users.length > 1 ? 's' : ''} on VipConnect!`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Contact sync failed. Please try again.');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [contactsSupported]);

  const displayList = view === 'synced' ? syncedContacts : searchResults;

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .cs-search-wrap {
          position: relative;
          margin-bottom: 10px;
        }
        .cs-search-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 10px 40px 10px 38px;
          font-size: 13px;
          color: white;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cs-search-input::placeholder { color: rgba(107,114,128,0.8); }
        .cs-search-input:focus {
          border-color: rgba(124,58,237,0.6);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
          background: rgba(124,58,237,0.04);
        }
        .cs-sync-btn {
          width: 100%;
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.06));
          border: 1px solid rgba(124,58,237,0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cs-sync-btn:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.14), rgba(37,99,235,0.1));
          border-color: rgba(124,58,237,0.45);
        }
        .cs-sync-btn:active { transform: scale(0.98); }
        .cs-sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cs-sync-icon {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(124,58,237,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cs-info-banner {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .cs-user-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s;
          border-radius: 12px;
          margin: 2px 8px;
        }
        .cs-user-row:hover { background: rgba(255,255,255,0.04); }
        .cs-user-row:active { transform: scale(0.98); }
        .cs-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .cs-online-dot {
          position: absolute; bottom: 0; right: 0;
          width: 12px; height: 12px; border-radius: 50%;
          background: #10b981;
          border: 2px solid #111827;
          box-shadow: 0 0 6px #10b981;
        }
        .cs-empty-icon {
          width: 56px; height: 56px; border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .cs-section-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: rgba(107,114,128,1);
          padding: 8px 16px 4px;
        }
      ` }} />

      {/* ── Search Header ────────────────────────────────────────── */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Search Input */}
        <div className="cs-search-wrap">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
               style={{ color: 'rgba(107,114,128,0.8)' }}
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            id="contact-search-input"
            type="text"
            className="cs-search-input"
            placeholder="Search by name, email or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); clearSearch(); if (syncDone) setView('synced'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(107,114,128,1)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(209,213,219,1)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(107,114,128,1)'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>

        {/* Contact Sync Card */}
        {contactsSupported ? (
          <button
            id="sync-contacts-btn"
            className="cs-sync-btn"
            onClick={syncContacts}
            disabled={isSyncing}
          >
            <div className="cs-sync-icon">
              {isSyncing ? (
                <div style={{ width: 16, height: 16, border: '2px solid rgba(124,58,237,0.3)',
                  borderTopColor: 'rgba(124,58,237,1)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg className="w-5 h-5" style={{ color: 'rgba(167,139,250,1)' }}
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                {isSyncing ? 'Syncing contacts…' : syncDone ? 'Re-sync Phone Contacts' : 'Sync Phone Contacts'}
              </p>
              <p style={{ color: 'rgba(107,114,128,1)', fontSize: 11 }}>
                {syncDone
                  ? `${syncedContacts.length} contact${syncedContacts.length !== 1 ? 's' : ''} found on VipConnect`
                  : 'Find your contacts who use VipConnect'}
              </p>
            </div>
            {syncDone && (
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 12, height: 12, color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ) : (
          <div className="cs-info-banner">
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg className="w-5 h-5" style={{ color: 'rgba(107,114,128,1)' }}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p style={{ color: 'rgba(156,163,175,1)', fontSize: 13, fontWeight: 500 }}>Contact Sync</p>
              <p style={{ color: 'rgba(75,85,99,1)', fontSize: 11, marginTop: 2 }}>Open on Chrome Android to sync contacts</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Results List ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ paddingTop: 6 }}>

        {/* Section label for synced contacts */}
        {view === 'synced' && syncedContacts.length > 0 && !query && (
          <div className="cs-section-label">📱 Contacts on VipConnect
            <span style={{ color: 'rgba(167,139,250,0.8)', marginLeft: 6 }}>{syncedContacts.length} found</span>
          </div>
        )}

        {/* Loading spinner */}
        {(isSearching || isSyncing) && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(124,58,237,0.2)',
              borderTopColor: 'rgba(124,58,237,0.9)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* No search results */}
        {!isSearching && !isSyncing && query && searchResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="cs-empty-icon">
              <svg className="w-7 h-7" style={{ color: 'rgba(75,85,99,1)' }}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p style={{ color: 'rgba(156,163,175,1)', fontSize: 13, fontWeight: 500 }}>
              No users found for &ldquo;{query}&rdquo;
            </p>
            <p style={{ color: 'rgba(75,85,99,1)', fontSize: 11, marginTop: 6 }}>
              Try searching by phone number
            </p>
          </div>
        )}

        {/* Synced — no contacts on VipConnect */}
        {!isSearching && !isSyncing && view === 'synced' && syncedContacts.length === 0 && !query && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="cs-empty-icon">
              <svg className="w-7 h-7" style={{ color: 'rgba(75,85,99,1)' }}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p style={{ color: 'rgba(156,163,175,1)', fontSize: 13, fontWeight: 500 }}>
              No contacts on VipConnect yet
            </p>
            <p style={{ color: 'rgba(75,85,99,1)', fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
              Share the app with your contacts so they can join!
            </p>
          </div>
        )}

        {/* Default empty — prompt to search */}
        {!query && !syncDone && !isSearching && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="cs-empty-icon" style={{ borderRadius: '50%' }}>
              <svg className="w-7 h-7" style={{ color: 'rgba(75,85,99,1)' }}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p style={{ color: 'rgba(156,163,175,1)', fontSize: 13, fontWeight: 500 }}>
              Find people on VipConnect
            </p>
            <p style={{ color: 'rgba(75,85,99,1)', fontSize: 11, marginTop: 6, lineHeight: 1.5, maxWidth: 200, margin: '6px auto 0' }}>
              {contactsSupported
                ? 'Sync your phone contacts above, or search by name, email or phone'
                : 'Search by name, email or phone number'}
            </p>
          </div>
        )}

        {/* User results list */}
        {!isSearching && !isSyncing && displayList.map((user) => (
          <div key={user._id} className="cs-user-row" onClick={() => handleSelectUser(user)}>
            {/* Avatar */}
            <div className="cs-avatar">
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: getGradient(user.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              {user.status === 'online' && <div className="cs-online-dot" />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                {user.name}
              </p>
              <p style={{ color: 'rgba(107,114,128,1)', fontSize: 11, overflow: 'hidden',
                whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user.phone ? `📱 ${user.phone}` : user.email}
              </p>
            </div>

            {/* Arrow */}
            <svg style={{ width: 16, height: 16, color: 'rgba(75,85,99,1)', flexShrink: 0 }}
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
