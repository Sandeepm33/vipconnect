'use client';
import { format } from 'date-fns';
import { useState } from 'react';
import useAIStore from '@/store/aiStore';

// WhatsApp-style message tick
function MessageTick({ message }) {
  const isRead = message.readBy?.length > 0;
  const isDelivered = message.deliveredTo?.length > 0;

  if (isRead) {
    return (
      <span className="inline-flex items-center" title="Read">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5L4.5 9L10 2" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5.5L8.5 9L14 2" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }

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
  const [translatedText, setTranslatedText] = useState('');
  const [showLanguages, setShowLanguages] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const { translateText } = useAIStore();

  const timeStr = format(new Date(message.createdAt), 'HH:mm');
  const isDeleted = message.deletedForEveryone;
  const isSystem = message.type === 'system';
  const isOver5Mins = (Date.now() - new Date(message.createdAt).getTime()) > 5 * 60 * 1000;

  const handleTranslate = async (lang) => {
    setIsTranslating(true);
    setShowLanguages(false);
    const res = await translateText(message.content, lang);
    if (res.success) {
      setTranslatedText(res.translatedText);
    }
    setIsTranslating(false);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 bg-dark-700 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }


  // ── CUSTOM RENDER: BUSINESS CATALOG PRODUCT bubble ───────────────────────
  if (message.type === 'product') {
    let product = { name: 'Catalog Product', price: 0, description: '' };
    try {
      product = JSON.parse(message.content);
    } catch {
      product.name = message.content || 'Business Product';
    }

    return (
      <div className={`flex gap-2 mb-1 message-enter ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="p-3 rounded-3xl border bg-[#111827] border-white/5 shadow-2xl w-[250px] space-y-2">
          {message.file?.url && (
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-800 border border-white/5">
              <img src={message.file.url} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-1 px-1">
            <h5 className="text-xs font-extrabold text-white truncate">{product.name}</h5>
            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p>
            <span className="text-xs font-extrabold text-primary-400 block pt-1">₹{parseFloat(product.price).toFixed(2)}</span>
          </div>
          <button
            onClick={() => {
              // Send message inquire
              const inputEl = document.querySelector('textarea');
              if (inputEl) {
                inputEl.value = `Inquiry regarding catalog item: *${product.name}* (₹${product.price})`;
                inputEl.focus();
              }
            }}
            className="w-full py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500 text-primary-400 hover:text-white transition duration-200 text-[10px] font-bold"
          >
            Inquire Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 mb-1 message-enter ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && showAvatar && (
        <div className="w-7 h-7 rounded-full overflow-hidden bg-dark-600 flex-shrink-0 mb-1">
          {message.sender?.avatar?.url ? (
            <img src={message.sender.avatar.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-primary-400 flex items-center justify-center h-full">
              {message.sender?.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-7 flex-shrink-0" />}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-primary-400 font-medium mb-1 px-1">
            {message.sender?.name}
          </span>
        )}

        {message.replyTo && !isDeleted && (
          <div className={`text-xs border-l-2 border-primary-500 pl-2 mb-1 opacity-70 ${isOwn ? 'chat-bubble-out' : 'chat-bubble-in'} rounded-lg py-1 px-2`}>
            <span className="text-primary-400 font-medium">{message.replyTo.sender?.name}</span>
            <p className="truncate text-gray-300">{message.replyTo.content || '📎 Attachment'}</p>
          </div>
        )}

        {/* Normal Bubble */}
        <div
          className={`relative group ${isOwn ? 'chat-bubble-out' : 'chat-bubble-in'}`}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => { setShowReactions(false); setShowLanguages(false); }}
        >
          {showReactions && !isDeleted && (
            <div className={`absolute -top-3.5 ${isOwn ? '-left-20' : '-right-20'} flex items-center gap-1 bg-[#161b22] border border-white/10 rounded-full p-1 shadow-2xl z-20`}>
              {/* Translate button */}
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition"
                title="Translate message"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 11.37 7.37 16.5 3 19" />
                </svg>
              </button>

              {isOwn && !isOver5Mins && message.type === 'text' && (
                <button
                  onClick={() => onEdit?.(message)}
                  className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition"
                  title="Edit message"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => onDelete?.(message._id)}
                className="p-1 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-full transition"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Language selectors */}
              {showLanguages && (
                <div className="absolute left-0 bottom-7 bg-[#161b22] border border-white/10 p-1 rounded-xl shadow-2xl flex flex-col gap-1 w-20">
                  {['Spanish', 'French', 'German', 'Japanese', 'Hindi'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleTranslate(lang)}
                      className="text-[9px] text-left px-2 py-1 hover:bg-white/5 text-gray-300 hover:text-white rounded"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isDeleted ? (
            <p className="text-gray-500 italic text-sm">🚫 This message was deleted</p>
          ) : (
            <>
              {(message.type === 'image' || message.type === 'document' || message.type === 'audio') && message.file?.url && (
                <div className="mb-1">
                  <FilePreview file={message.file} type={message.type} />
                </div>
              )}
              
              {message.content && (
                <div className="space-y-1">
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {translatedText || message.content}
                  </p>
                  {translatedText && (
                    <span className="text-[8px] text-primary-400 font-bold tracking-widest block uppercase">Translated</span>
                  )}
                </div>
              )}
            </>
          )}

          <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.isEdited && (
              <span className="text-[10px] text-gray-400 italic mr-1">Edited</span>
            )}
            <span className="text-[10px] text-gray-400">{timeStr}</span>
            {isOwn && !isDeleted && <MessageTick message={message} />}
          </div>
        </div>

        {/* Reactions */}
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
