'use client';
import { useState } from 'react';
import useChatStore from '@/store/chatStore';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupInfo({ chat, onClose }) {
  const { user } = useAuthStore();
  const { promoteAdmin, demoteAdmin, updateGroupSettings, generateInviteLink, updateChat } = useChatStore();
  const [members, setMembers] = useState(chat?.members || []);
  const isAdmin = chat?.admins?.some((a) => a._id === user?._id || a === user?._id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chat?.name || '');
  const [editDesc, setEditDesc] = useState(chat?.description || '');
  const [editPic, setEditPic] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const removeMember = async (userId) => {
    try {
      await api.delete(`/chats/${chat._id}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m._id !== userId));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handlePromote = async (userId) => {
    try {
      await promoteAdmin(chat._id, userId);
      toast.success('Promoted to Admin');
    } catch (err) {
      toast.error('Failed to promote user');
    }
  };

  const handleDemote = async (userId) => {
    try {
      await demoteAdmin(chat._id, userId);
      toast.success('Demoted from Admin');
    } catch (err) {
      toast.error('Failed to demote user');
    }
  };

  const toggleSetting = async (key) => {
    try {
      const currentVal = chat?.settings?.[key] || false;
      await updateGroupSettings(chat._id, { [key]: !currentVal });
      toast.success('Settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const handleGenerateLink = async () => {
    try {
      const link = await generateInviteLink(chat._id);
      navigator.clipboard.writeText(`${window.location.origin}/invite/${link}`);
      toast.success('Invite link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to generate invite link');
    }
  };

  const copyExistingLink = () => {
    if (chat.inviteLink) {
      navigator.clipboard.writeText(`${window.location.origin}/invite/${chat.inviteLink}`);
      toast.success('Invite link copied!');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return toast.error('Group name cannot be empty');
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('description', editDesc.trim());
      if (editPic) formData.append('groupPicture', editPic);

      const res = await api.put(`/chats/${chat._id}/group`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateChat(res.chat);
      toast.success('Group info updated!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update group info');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-chat-border">
          <h3 className="text-white font-semibold text-lg">
            {chat?.isGroup ? 'Group Info' : 'Contact Info'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh] scrollbar-thin">
          {/* Group picture and name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center mb-3 shadow-lg group">
              {editPic ? (
                <img src={URL.createObjectURL(editPic)} alt="Preview" className="w-full h-full object-cover" />
              ) : chat?.groupPicture?.url || chat?.members?.find(m => m._id !== user?._id)?.avatar?.url ? (
                <img
                  src={chat?.isGroup ? chat.groupPicture?.url : chat?.members?.find(m => m._id !== user?._id)?.avatar?.url}
                  alt={chat?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-400">
                  {(chat?.name || 'G')?.charAt(0)?.toUpperCase()}
                </span>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[10px] text-white">Change</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => setEditPic(e.target.files[0])} />
                </label>
              )}
            </div>

            {isEditing ? (
              <div className="w-full space-y-3 px-4">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-dark-600 border border-chat-border rounded-lg px-3 py-2 text-white text-center font-semibold text-lg outline-none focus:border-primary-500"
                  placeholder="Group Name"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-dark-600 border border-chat-border rounded-lg px-3 py-2 text-gray-300 text-sm outline-none focus:border-primary-500 resize-none h-20 text-center"
                  placeholder="Group Description"
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-dark-600 hover:bg-dark-500 rounded-lg text-sm transition-colors">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-semibold text-xl">
                    {chat?.isGroup ? chat.name : chat?.members?.find(m => m._id !== user?._id)?.name}
                  </h4>
                  {chat?.isGroup && isAdmin && (
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white transition-colors" title="Edit Group Info">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
                {chat?.description && (
                  <p className="text-gray-400 text-sm text-center mt-2 max-w-xs">{chat.description}</p>
                )}
              </>
            )}
          </div>

          {chat?.isGroup && isAdmin && (
            <div className="mb-6 space-y-4 border-t border-chat-border pt-4">
              <h5 className="text-primary-400 text-xs uppercase tracking-wider font-semibold">
                Admin Controls
              </h5>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Only Admins Can Message</p>
                  <p className="text-xs text-gray-500">Restrict sending messages to admins</p>
                </div>
                <button
                  onClick={() => toggleSetting('adminOnlyMessage')}
                  className={`w-11 h-6 rounded-full relative transition-colors ${chat?.settings?.adminOnlyMessage ? 'bg-primary-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${chat?.settings?.adminOnlyMessage ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Only Admins Edit Info</p>
                  <p className="text-xs text-gray-500">Restrict editing group info</p>
                </div>
                <button
                  onClick={() => toggleSetting('adminOnlyInfo')}
                  className={`w-11 h-6 rounded-full relative transition-colors ${chat?.settings?.adminOnlyInfo ? 'bg-primary-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${chat?.settings?.adminOnlyInfo ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-sm text-white font-medium mb-2">Group Invite Link</p>
                {chat.inviteLink ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/invite/${chat.inviteLink}`}
                      className="bg-chat-bg text-gray-300 text-xs px-2 py-1.5 rounded-lg flex-1 border border-chat-border outline-none"
                    />
                    <button onClick={copyExistingLink} className="p-1.5 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors">
                      Copy
                    </button>
                    <button onClick={handleGenerateLink} className="p-1.5 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors" title="Reset Link">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  </div>
                ) : (
                  <button onClick={handleGenerateLink} className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                    Generate Invite Link
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Members list (groups only) */}
          {chat?.isGroup && (
            <div>
              <h5 className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-medium">
                {members.length} Members
              </h5>
              <div className="space-y-2">
                {members.map((member) => {
                  const mId = member._id || member;
                  const isMe = mId === user?._id;
                  const mIsAdmin = chat.admins?.some((a) => a._id === mId || a === mId);

                  return (
                    <div key={mId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center flex-shrink-0">
                        {member.avatar?.url ? (
                          <img src={member.avatar.url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary-400 font-semibold">
                            {member.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium truncate">
                            {member.name || 'Member'} {isMe && '(You)'}
                          </span>
                          {mIsAdmin && (
                            <span className="text-[10px] text-primary-400 border border-primary-500/30 px-1.5 py-0.5 rounded-full bg-primary-500/10">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate">{member.email || ''}</p>
                      </div>
                      
                      {isAdmin && !isMe && (
                        <div className="hidden group-hover:flex items-center gap-1">
                          {mIsAdmin ? (
                            <button
                              onClick={() => handleDemote(mId)}
                              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePromote(mId)}
                              className="text-xs px-2 py-1 rounded bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-colors"
                            >
                              Promote
                            </button>
                          )}
                          <button
                            onClick={() => removeMember(mId)}
                            className="text-red-400 hover:text-white p-1 rounded hover:bg-red-500 transition-colors ml-1"
                            title="Remove member"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
