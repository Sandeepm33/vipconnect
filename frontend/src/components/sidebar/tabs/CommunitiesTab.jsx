'use client';
import { useState, useEffect } from 'react';
import useCommunityStore from '@/store/communityStore';
import useChatStore from '@/store/chatStore';

export default function CommunitiesTab() {
  const { communities, fetchCommunities, createCommunity, broadcastAnnouncement, addGroupToCommunity } = useCommunityStore();
  const { chats, fetchChats, setActiveChat } = useChatStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  
  const [showBroadcastModal, setShowBroadcastModal] = useState(null); // holds community object
  const [broadcastText, setBroadcastText] = useState('');

  useEffect(() => {
    fetchCommunities();
    fetchChats();
  }, [fetchCommunities, fetchChats]);

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const res = await createCommunity(formData);
    if (res.success) {
      // Add selected groups to community
      for (const groupId of selectedGroups) {
        await addGroupToCommunity(res.community._id, groupId);
      }
      
      setName('');
      setDescription('');
      setImageFile(null);
      setSelectedGroups([]);
      setShowCreateModal(false);
      fetchCommunities();
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim() || !showBroadcastModal) return;

    const res = await broadcastAnnouncement(showBroadcastModal._id, broadcastText);
    if (res.success) {
      setBroadcastText('');
      setShowBroadcastModal(null);
    }
  };

  const groupChatsOnly = chats.filter(c => c.isGroup);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
        {/* Header Action panel */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Communities</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-primary-500/10 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>
        </div>

        {/* Communities feed */}
        {communities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No communities created yet. Link your group chats together!
          </div>
        ) : (
          <div className="space-y-4">
            {communities.map((community) => (
              <div
                key={community._id}
                className="p-4 rounded-2xl glass border border-white/5 space-y-3 hover:border-white/10 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden flex items-center justify-center border border-white/5">
                      {community.image?.url ? (
                        <img src={community.image.url} alt={community.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{community.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{community.description}</p>
                    </div>
                  </div>
                  {/* Broadcast Button */}
                  <button
                    onClick={() => setShowBroadcastModal(community)}
                    className="p-2 rounded-lg text-primary-400 hover:text-white hover:bg-primary-500/10 transition"
                    title="Broadcast Announcement"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </button>
                </div>

                {/* Groups lists */}
                {community.groups?.length > 0 && (
                  <div className="pt-2 space-y-1.5 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Sub-groups</span>
                    <div className="space-y-1">
                      {community.groups.map((group) => (
                        <div
                          key={group._id}
                          onClick={() => setActiveChat(group)}
                          className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer transition text-xs text-gray-300 hover:text-white"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                            {group.groupPicture?.url ? (
                              <img src={group.groupPicture.url} alt={group.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-[10px]">{group.name?.charAt(0)}</span>
                            )}
                          </div>
                          <span className="font-medium truncate">{group.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CREATE COMMUNITY MODAL ──────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <form onSubmit={handleCreateSubmit} className="w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-white font-bold text-base">Create Community</span>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Community Logo</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-xs text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Community Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corporation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-sm transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="What is this community about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-sm transition resize-none h-20"
              />
            </div>

            {/* Select groups checklist */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Bind Group Chats</label>
              {groupChatsOnly.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic">No group chats available to bind.</p>
              ) : (
                <div className="max-h-28 overflow-y-auto border border-white/10 rounded-xl p-2 space-y-1 bg-white/5">
                  {groupChatsOnly.map(chat => (
                    <label key={chat._id} className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white p-1 rounded hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(chat._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups([...selectedGroups, chat._id]);
                          } else {
                            setSelectedGroups(selectedGroups.filter(id => id !== chat._id));
                          }
                        }}
                        className="rounded border-white/10 bg-black/40 text-primary-500 focus:ring-primary-500"
                      />
                      <span>{chat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs transition">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* ── BROADCAST ANNOUNCEMENT MODAL ───────────────────────────────── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <form onSubmit={handleBroadcastSubmit} className="w-full max-w-md p-6 rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div>
                <span className="text-white font-bold text-base block">Broadcast Announcement</span>
                <span className="text-[10px] text-gray-400">Broadcasting to community: {showBroadcastModal.name}</span>
              </div>
              <button type="button" onClick={() => setShowBroadcastModal(null)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <textarea
              required
              placeholder="Type your official announcement here..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-sm transition resize-none h-24"
            />

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowBroadcastModal(null)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs transition">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Broadcast
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
