'use client';
import { format } from 'date-fns';
import { useState } from 'react';

// WhatsApp-style message tick:
// single grey  = sent (on server)
// double grey  = delivered (recipient received)
// double blue  = read (recipient opened the chat)
function MessageTick({ message }) {
  const isRead = message.readBy?.length > 0;
  const isDelivered = message.deliveredTo?.length > 0;

  // Blue double tick — read
  if (isRead) {
    return (
      <span className="inline-flex items-center" title="Read">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          {/* Left tick */}
          <path d="M1 5.5L4.5 9L10 2" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Right tick (offset) */}
          <path d="M5 5.5L8.5 9L14 2" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }

  // Grey double tick — delivered
  if (isDelivered) {
    return (
      <span className="inline-flex items-center" title="Delivered">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5L4.5 9L10 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5.5L8.5 9L14 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }

  // Single grey tick — sent
  return (
    <span className="inline-flex items-center" title="Sent">
      <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
        <path d="M1 5.5L4.5 9L11 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function FilePreview({ file, type }) {
  if (type === 'image') {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={file.url}
          alt={file.originalName || 'Image'}
          className="rounded-xl max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => { e.target.src = ''; e.target.alt = 'Image not found'; }}
        />
      </a>
    );
  }

  if (type === 'document') {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 bg-black/20 rounded-xl hover:bg-black/30 transition-colors group"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.originalName || 'Document'}</p>
          <p className="text-xs text-gray-400">
            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
          </p>
        </div>
        <svg className="w-4 h-4 text-gray-400 group-hover:text-white ml-auto flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
    );
  }

  if (type === 'audio') {
    return (
      <audio controls className="max-w-[240px]">
        <source src={file.url} type={file.mimeType || 'audio/mpeg'} />
      </audio>
    );
  }

  return null;
}

export default function MessageBubble({ message, isOwn, showAvatar, isAdmin, onDelete, onEdit }) {
  const [showReactions, setShowReactions] = useState(false);

  const timeStr = format(new Date(message.createdAt), 'HH:mm');
  const isDeleted = message.deletedForEveryone;
  const isSystem = message.type === 'system';
  const isOver5Mins = (Date.now() - new Date(message.createdAt).getTime()) > 5 * 60 * 1000;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 bg-dark-700 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 mb-1 message-enter ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (for group non-own messages) */}
      {!isOwn && showAvatar && (
        <div className="w-7 h-7 rounded-full overflow-hidden bg-dark-600 flex-shrink-0 mb-1">
          {message.sender?.avatar?.url ? (
            <img src={message.sender.avatar.url} alt={message.sender.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-primary-400 flex items-center justify-center h-full">
              {message.sender?.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-7 flex-shrink-0" />}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name in groups */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-primary-400 font-medium mb-1 px-1">
            {message.sender?.name}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && !isDeleted && (
          <div className={`text-xs border-l-2 border-primary-500 pl-2 mb-1 opacity-70 ${isOwn ? 'chat-bubble-out' : 'chat-bubble-in'} rounded-lg py-1 px-2`}>
            <span className="text-primary-400 font-medium">{message.replyTo.sender?.name}</span>
            <p className="truncate text-gray-300">{message.replyTo.content || '📎 Attachment'}</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative group ${isOwn ? 'chat-bubble-out' : 'chat-bubble-in'}`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {showReactions && !isDeleted && (isOwn || isAdmin) && (!isOver5Mins || isAdmin) && (
            <div className={`absolute -top-3 ${isOwn ? '-left-14' : '-right-14'} flex items-center gap-1 bg-dark-600 rounded-full border border-chat-border p-1 shadow-lg z-10 transition-opacity`}>
              {isOwn && !isOver5Mins && message.type === 'text' && (
                <button
                  onClick={() => onEdit?.(message)}
                  className="p-1 hover:bg-white/10 hover:text-white text-gray-400 rounded-full transition-colors"
                  title="Edit message"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onDelete?.(message._id)}
                className="p-1 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-full transition-colors"
                title="Delete for everyone"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
          {isDeleted ? (
            <p className="text-gray-500 italic text-sm">🚫 This message was deleted</p>
          ) : (
            <>
              {/* File content */}
              {(message.type === 'image' || message.type === 'document' || message.type === 'audio') && message.file?.url && (
                <div className="mb-1">
                  <FilePreview file={message.file} type={message.type} />
                </div>
              )}
              {/* Text content */}
              {message.content && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
              )}
            </>
          )}

          {/* Time + read receipt */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.isEdited && (
              <span className="text-[10px] text-gray-400 italic mr-1">Edited</span>
            )}
            <span className="text-[10px] text-gray-400">{timeStr}</span>
            {isOwn && !isDeleted && <MessageTick message={message} />}
          </div>
        </div>

        {/* Reactions display */}
        {message.reactions?.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <span key={emoji} className="text-xs bg-dark-600 border border-chat-border rounded-full px-2 py-0.5">
                {emoji} {count > 1 && count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
