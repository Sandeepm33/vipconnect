'use client';
import { useState, useEffect } from 'react';
import useStatusStore from '@/store/statusStore';
import useAuthStore from '@/store/authStore';
import StoryPlayer from './StoryPlayer';
import toast from 'react-hot-toast';

export default function StatusTab() {
  const { statuses, fetchStatuses, postTextStatus, postMediaStatus, deleteStatus } = useStatusStore();
  const { user } = useAuthStore();
  const [showTextComposer, setShowTextComposer] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerColor, setComposerColor] = useState('#7c3aed');
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

  // States for media composer/preview modal
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaPrivacy, setMediaPrivacy] = useState('everyone');
  const [showMediaComposer, setShowMediaComposer] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    return `${backendBase}${url}`;
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    const setupPreview = () => {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMediaCaption('');
      setMediaPrivacy('everyone');
      setShowMediaComposer(true);
      e.target.value = ''; // Reset input so same file can be selected again
    };

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > 120) {
          toast.error('Video duration cannot exceed 2 minutes 🚫');
          e.target.value = ''; // Reset input
          return;
        }
        setupPreview();
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        toast.error('Failed to load video metadata');
        e.target.value = ''; // Reset input
      };
    } else {
      setupPreview();
    }
  };

  const handleMediaSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mediaType', selectedFile.type.startsWith('video/') ? 'video' : 'image');
    formData.append('caption', mediaCaption);
    formData.append('privacy', mediaPrivacy);

    const loadId = toast.loading('Uploading status media...');
    const res = await postMediaStatus(formData);
    if (res.success) {
      toast.success('Status posted successfully! ✨', { id: loadId });
      handleCancelMediaComposer();
    } else {
      toast.error(`Upload failed: ${res.error || 'Unknown error'}`, { id: loadId });
    }
  };

  const handleCancelMediaComposer = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setMediaCaption('');
    setMediaPrivacy('everyone');
    setShowMediaComposer(false);
  };

  const handleTextSubmit = async () => {
    if (!composerText.trim()) return;
    const loadId = toast.loading('Posting status...');
    const res = await postTextStatus(composerText, composerColor);
    if (res.success) {
      toast.success('Status posted successfully! ✨', { id: loadId });
      setComposerText('');
      setShowTextComposer(false);
    } else {
      toast.error(`Posting failed: ${res.error || 'Unknown error'}`, { id: loadId });
    }
  };

  // Group statuses by user ID
  const groupedStatuses = statuses.reduce((acc, status) => {
    const userId = status.user?._id;
    if (!userId) return acc;
    if (!acc[userId]) {
      acc[userId] = {
        user: status.user,
        items: [],
      };
    }
    acc[userId].items.push(status);
    return acc;
  }, {});

  // Sort each user's status updates chronologically (oldest first) so they play in order
  Object.values(groupedStatuses).forEach((group) => {
    group.items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  });

  const myStatusGroup = groupedStatuses[user?._id] || { user, items: [] };
  const contactStatusGroups = Object.values(groupedStatuses).filter(g => g.user?._id !== user?._id);

  const colors = ['#7c3aed', '#db2777', '#2563eb', '#059669', '#d97706', '#dc2626'];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Scrollable Story Panel */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
        {/* Header Action panel */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">My Status</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTextComposer(true)}
              className="p-2 rounded-xl text-primary-400 hover:text-white hover:bg-primary-500/10 transition-all duration-200"
              title="Add text status"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <label className="p-2 rounded-xl text-primary-400 hover:text-white hover:bg-primary-500/10 transition-all duration-200 cursor-pointer" title="Upload media status">
              <input type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" />
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
          </div>
        </div>

        {/* Self Status Card */}
        <div className="flex items-center justify-between p-3 rounded-2xl glass hover:bg-white/5 transition-all">
          <div className="flex items-center gap-3">
            <div
              className={`relative p-0.5 rounded-full ${myStatusGroup.items.length > 0 ? 'ring-2 ring-primary-500 animate-pulse' : ''} cursor-pointer`}
              onClick={() => myStatusGroup.items.length > 0 && setActiveStoryGroup(myStatusGroup)}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                {user?.avatar?.url ? (
                  <img src={getMediaUrl(user.avatar.url)} alt="My profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{user?.name?.charAt(0)}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">My Status</p>
              <p className="text-xs text-gray-400">
                {myStatusGroup.items.length > 0
                  ? `${myStatusGroup.items.length} update${myStatusGroup.items.length > 1 ? 's' : ''} active`
                  : 'Tap icons to compose updates'}
              </p>
            </div>
          </div>
          {myStatusGroup.items.length > 0 && (
            <button
              onClick={() => {
                myStatusGroup.items.forEach(async (item) => {
                  await deleteStatus(item._id);
                });
              }}
              className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded-lg hover:bg-red-500/10 transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Recent updates list */}
        <div className="space-y-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Recent Updates</span>
          {contactStatusGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No status updates yet. Encourage contacts to post!
            </div>
          ) : (
            <div className="space-y-2">
              {contactStatusGroups.map((group) => {
                const lastItem = group.items[0];
                return (
                  <div
                    key={group.user?._id}
                    onClick={() => setActiveStoryGroup(group)}
                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <div className="relative p-0.5 rounded-full ring-2 ring-primary-500">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                        {group.user?.avatar?.url ? (
                          <img src={getMediaUrl(group.user.avatar.url)} alt={group.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold">{group.user?.name?.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{group.user?.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(lastItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Text Story Composer Modal */}
      {showTextComposer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center"
               style={{ background: composerColor, transition: 'background 0.3s ease' }}>
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-white font-semibold text-sm">Compose Text Status</span>
              <button onClick={() => setShowTextComposer(false)} className="text-white/60 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={150}
              className="w-full bg-black/15 text-white placeholder-white/50 text-xl font-bold text-center p-4 rounded-2xl focus:outline-none border border-white/10 resize-none mb-6"
            />

            {/* Colors picker */}
            <div className="w-full flex items-center justify-between">
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setComposerColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${composerColor === c ? 'border-white' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={!composerText.trim()}
                className="px-6 py-2 rounded-xl bg-white text-gray-900 font-bold hover:scale-105 active:scale-95 disabled:opacity-50 transition-all text-sm"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Media Story Composer Modal */}
      {showMediaComposer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center bg-[#111827]">
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-white font-semibold text-sm">Post Media Status</span>
              <button onClick={handleCancelMediaComposer} className="text-white/60 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Media Preview */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/30 border border-white/5 flex items-center justify-center mb-6 relative">
              {selectedFile?.type.startsWith('video/') ? (
                <video src={previewUrl} controls className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
              )}
            </div>

            {/* Comment/Caption Input */}
            <textarea
              value={mediaCaption}
              onChange={(e) => setMediaCaption(e.target.value)}
              placeholder="Add a comment or caption..."
              rows={2}
              maxLength={200}
              className="w-full bg-black/15 text-white placeholder-white/50 text-sm p-3 rounded-2xl focus:outline-none border border-white/10 resize-none mb-6 focus:border-primary-500/50"
            />

            {/* Privacy selection and Submit */}
            <div className="w-full flex items-center justify-between">
              {/* Privacy button group */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMediaPrivacy('everyone')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    mediaPrivacy === 'everyone'
                      ? 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                      : 'bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10'
                  }`}
                  title="Share with everyone"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setMediaPrivacy('contacts')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    mediaPrivacy === 'contacts'
                      ? 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                      : 'bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10'
                  }`}
                  title="Share with contacts only"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Contacts
                </button>
              </div>

              <button
                onClick={handleMediaSubmit}
                className="px-5 py-2 rounded-xl bg-primary-500 text-white font-bold hover:scale-105 active:scale-95 transition-all text-xs"
              >
                Post Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Story Player Overlay */}
      {activeStoryGroup && (
        <StoryPlayer
          group={activeStoryGroup}
          onClose={() => setActiveStoryGroup(null)}
        />
      )}
    </div>
  );
}
