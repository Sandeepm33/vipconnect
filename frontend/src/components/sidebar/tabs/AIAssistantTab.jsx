'use client';
import { useState, useRef, useEffect } from 'react';
import useAIStore from '@/store/aiStore';
import useChatStore from '@/store/chatStore';
import useBusinessStore from '@/store/businessStore';

export default function AIAssistantTab() {
  const { aiMessages, isLoading, sendAIMessage, translateText, generateAIImage, summarizeConversation } = useAIStore();
  const { activeChat, messages } = useChatStore();
  const { updateBusinessProfile } = useBusinessStore();

  const [activeSubTab, setActiveSubTab] = useState('chat'); // 'chat' | 'translate' | 'generate' | 'summary'
  const [chatInput, setChatInput] = useState('');
  
  // Translation state
  const [transText, setTransText] = useState('');
  const [transLang, setTransLang] = useState('spanish');
  const [transResult, setTransResult] = useState('');
  
  // Image generation state
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgResult, setImgResult] = useState('');

  // Summary state
  const [summaryResult, setSummaryResult] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isLoading]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    const txt = chatInput;
    setChatInput('');
    await sendAIMessage(txt);
  };

  const handleTranslate = async (e) => {
    e.preventDefault();
    if (!transText.trim()) return;
    const res = await translateText(transText, transLang);
    if (res.success) {
      setTransResult(res.translatedText);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!imgPrompt.trim() || isLoading) return;
    const res = await generateAIImage(imgPrompt);
    if (res.success) {
      setImgResult(res.imageUrl);
    }
  };

  const handleApplyAvatar = async () => {
    if (!imgResult) return;
    // Set generated S3/Unsplash image as avatar via businessProfile update
    // For convenience we can call api.put('/users/profile') or profile update. Let's do it directly.
    const api = (await import('@/lib/api')).default;
    const authStore = (await import('@/store/authStore')).default;
    try {
      // Put direct update to avatar
      const data = await api.put('/users/profile', { avatar: { url: imgResult } });
      if (data.success) {
        authStore.getState().updateUser({ avatar: { url: imgResult } });
        alert('AI Avatar set as profile picture successfully! ✨');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSummarize = async () => {
    if (!activeChat) {
      setSummaryResult('Please select a conversation in the Chats tab first to summarize.');
      return;
    }
    const chatMsgs = messages[activeChat._id] || [];
    if (chatMsgs.length === 0) {
      setSummaryResult('No messages in the active chat to summarize.');
      return;
    }

    const textArray = chatMsgs.slice(-15).map(m => `${m.sender?.name || 'User'}: ${m.content}`);
    const res = await summarizeConversation(textArray);
    if (res.success) {
      setSummaryResult(res.summary);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sub Navigation Header ──────────────────────────────────────── */}
      <div className="flex border-b border-white/5 bg-white/2 p-1.5 gap-1.5 flex-shrink-0">
        {['chat', 'translate', 'generate', 'summary'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition duration-200 ${
              activeSubTab === tab
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content Panel ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {activeSubTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin min-h-0">
              {aiMessages.map((m, idx) => {
                const isAI = m.sender === 'ai';
                return (
                  <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed border ${
                        isAI
                          ? 'bg-white/5 border-white/10 text-gray-200'
                          : 'bg-primary-500 border-primary-600 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.content}</p>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Composer */}
            <form onSubmit={handleSendChat} className="p-3 bg-white/2 border-t border-white/5 flex gap-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Ask ConnectX AI..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-white/5 hover:bg-white/8 text-white placeholder-white/55 text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 transition-all"
              />
              <button
                type="submit"
                className="p-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white rounded-xl transition-all"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {activeSubTab === 'translate' && (
          <form onSubmit={handleTranslate} className="p-4 space-y-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Translate Text</span>
            
            <textarea
              required
              placeholder="Type or paste message to translate..."
              value={transText}
              onChange={(e) => setTransText(e.target.value)}
              className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-xs transition resize-none h-24"
            />

            <div className="flex gap-2">
              <select
                value={transLang}
                onChange={(e) => setTransLang(e.target.value)}
                className="flex-1 bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 text-xs focus:outline-none"
              >
                <option value="spanish" className="bg-[#0f172a]">Spanish 🇪🇸</option>
                <option value="french" className="bg-[#0f172a]">French 🇫🇷</option>
                <option value="german" className="bg-[#0f172a]">German 🇩🇪</option>
                <option value="japanese" className="bg-[#0f172a]">Japanese 🇯🇵</option>
                <option value="hindi" className="bg-[#0f172a]">Hindi 🇮🇳</option>
              </select>
              
              <button type="submit" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-xl transition">
                Translate
              </button>
            </div>

            {transResult && (
              <div className="p-3.5 rounded-2xl bg-primary-500/5 border border-primary-500/10 space-y-1.5 mt-2">
                <span className="text-[9px] uppercase tracking-wider font-bold text-primary-400">Translation result ({transLang})</span>
                <p className="text-xs text-white leading-relaxed">{transResult}</p>
              </div>
            )}
          </form>
        )}

        {activeSubTab === 'generate' && (
          <form onSubmit={handleGenerate} className="p-4 space-y-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">AI Avatar Generator</span>
            
            <input
              type="text"
              required
              placeholder="e.g. Glowing glass spheres, vibrant violet colors"
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
              className="w-full bg-white/5 hover:bg-white/8 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-primary-500/50 text-xs transition"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Generate Image'
              )}
            </button>

            {imgResult && (
              <div className="space-y-3 pt-2 text-center">
                <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                  <img src={imgResult} alt="AI Generated Graphic" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold bg-primary-500 px-2 py-1 rounded-full shadow-lg">diffusion-v2.5</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleApplyAvatar}
                  className="px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-md border border-emerald-500/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Set as Profile Avatar
                </button>
              </div>
            )}
          </form>
        )}

        {activeSubTab === 'summary' && (
          <div className="p-4 space-y-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">AI Chat Summary</span>
            <p className="text-[10.5px] text-gray-400 leading-normal">
              Click the button below to get an AI summary of the active chat conversation history.
            </p>

            <button
              onClick={handleSummarize}
              className="w-full py-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              Summarize Selected Chat
            </button>

            {summaryResult && (
              <div className="p-3.5 rounded-2xl bg-primary-500/5 border border-primary-500/10 space-y-1.5 mt-2">
                <span className="text-[9px] uppercase tracking-wider font-bold text-primary-400">AI Summary</span>
                <p className="text-xs text-white leading-relaxed font-medium whitespace-pre-line">{summaryResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
