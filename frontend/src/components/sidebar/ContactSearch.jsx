'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useChatStore from '@/store/chatStore';

export default function ContactSearch({ onClose }) {
  const router = useRouter();
  const { searchUsers, searchResults, isSearching, createChat, clearSearch } = useChatStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearSearch();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) searchUsers(query);
      else clearSearch();
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = async (user) => {
    try {
      const chat = await createChat(user._id);
      router.push(`/chat/${chat._id}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-chat-border">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            id="contact-search-input"
            type="text"
            className="w-full bg-dark-700 border border-chat-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-primary-500 transition-colors"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); clearSearch(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isSearching && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {!isSearching && query && searchResults.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            <p>No users found for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!isSearching && searchResults.map((user) => (
          <div
            key={user._id}
            onClick={() => handleSelectUser(user)}
            className="sidebar-item cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center flex-shrink-0">
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-400 font-semibold text-lg">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-gray-500 text-xs truncate">{user.email}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-primary-500' : 'bg-gray-600'}`} />
          </div>
        ))}

        {!query && (
          <div className="text-center py-10 text-gray-500 text-sm px-4">
            <svg className="w-10 h-10 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>Search for people to start a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
