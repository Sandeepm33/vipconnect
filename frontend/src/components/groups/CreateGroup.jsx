'use client';
import { useState, useRef } from 'react';
import useChatStore from '@/store/chatStore';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateGroup({ onClose }) {
  const { user } = useAuthStore();
  const { searchUsers, searchResults, isSearching, clearSearch, createGroup } = useChatStore();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [groupPicture, setGroupPicture] = useState(null);
  const [groupPicturePreview, setGroupPicturePreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1); // 1: add members, 2: group details
  const fileInputRef = useRef(null);
  const searchTimerRef = useRef(null);

  const handleSearch = (value) => {
    setQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (value.trim()) searchUsers(value);
      else clearSearch();
    }, 400);
  };

  const toggleMember = (member) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m._id === member._id);
      return exists ? prev.filter((m) => m._id !== member._id) : [...prev, member];
    });
  };

  const handleGroupPicture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroupPicture(file);
    const reader = new FileReader();
    reader.onload = (ev) => setGroupPicturePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return toast.error('Group name is required');
    if (selectedMembers.length < 1) return toast.error('Add at least 1 member');

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', groupName.trim());
      formData.append('description', description);
      formData.append('members', JSON.stringify(selectedMembers.map((m) => m._id)));
      if (groupPicture) formData.append('groupPicture', groupPicture);

      await createGroup(formData);
      toast.success('Group created! 🎉');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-chat-border">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-white font-semibold text-lg">
              {step === 1 ? 'Add Members' : 'Group Details'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh] scrollbar-thin">
          {step === 1 ? (
            <>
              {/* Selected members chips */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMembers.map((m) => (
                    <div key={m._id} className="flex items-center gap-1.5 bg-primary-500/20 border border-primary-500/30 rounded-full px-3 py-1">
                      <span className="text-xs text-primary-300 font-medium">{m.name}</span>
                      <button onClick={() => toggleMember(m)} className="text-primary-400 hover:text-white">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-4">
                <input
                  id="group-member-search"
                  type="text"
                  className="input-field pl-10"
                  placeholder="Search contacts..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Results */}
              {isSearching && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
              )}

              {searchResults.map((contact) => {
                const isSelected = selectedMembers.some((m) => m._id === contact._id);
                return (
                  <div
                    key={contact._id}
                    onClick={() => toggleMember(contact)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-600 flex items-center justify-center flex-shrink-0">
                      {contact.avatar?.url ? (
                        <img src={contact.avatar.url} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-400 font-semibold">{contact.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{contact.name}</p>
                      <p className="text-gray-500 text-xs">{contact.email}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-600'}`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => step === 1 && setStep(2)}
                disabled={selectedMembers.length === 0}
                className="btn-primary w-full mt-4"
              >
                Next ({selectedMembers.length} selected)
              </button>
            </>
          ) : (
            <>
              {/* Group picture */}
              <div className="flex flex-col items-center mb-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full overflow-hidden bg-dark-600 border-2 border-dashed border-chat-border flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors relative group"
                >
                  {groupPicturePreview ? (
                    <>
                      <img src={groupPicturePreview} alt="Group" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-1">Add photo</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGroupPicture} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Group Name *</label>
                  <input
                    id="group-name-input"
                    type="text"
                    className="input-field"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Group description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={512}
                  />
                </div>
              </div>

              <button
                id="create-group-submit"
                onClick={handleCreate}
                disabled={isCreating || !groupName.trim()}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
