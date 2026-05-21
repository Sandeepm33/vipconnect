'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import { initSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const localToken = localStorage.getItem('vipconnect_token');
    if ((isAuthenticated && token) || localToken) {
      if (token || localToken) initSocket(token || localToken);
      router.replace('/chat');
    }
  }, [isAuthenticated, token]);

  // Interactive Chat Preview Mock State
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Have you checked out the new VipConnect layout?", sender: "sarah", time: "10:42 AM" },
    { id: 2, text: "Yes, it looks absolutely stunning and responsive! 🚀", sender: "me", time: "10:43 AM" },
    { id: 3, text: "Awesome! Try typing a message below to see how fast it responds.", sender: "sarah", time: "10:43 AM" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: inputValue,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    const userMsg = inputValue;
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = "That's super cool! ⚡";
      if (userMsg.toLowerCase().includes("hello") || userMsg.toLowerCase().includes("hi")) {
        replyText = "Hello there! Glad you are testing out VipConnect! 👋";
      } else if (userMsg.toLowerCase().includes("call") || userMsg.toLowerCase().includes("video")) {
        replyText = "Our video/audio calls are 100% encrypted and ultra-low latency!";
      } else if (userMsg.toLowerCase().includes("group")) {
        replyText = "Groups support up to 5,000 members with advanced admin controls!";
      } else {
        const replies = [
          "VipConnect is built with Next.js and Tailwind CSS for max performance!",
          "Yes! Messaging is real-time using Socket.io under the hood.",
          "Check out the video calling features by signing up today!",
          "We also support file sharing up to 50MB. Check it out!"
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: replyText,
        sender: "sarah",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1200);
  };

  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-chat-bg text-white selection:bg-primary-500/30 overflow-x-hidden relative">
      {/* ── Full-bleed hero background — your group photo (Desktop Only) ── */}
      <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="/main.jpg"
          alt="VipConnect Community"
          className="w-full h-[100dvh] object-cover object-center"
          style={{ objectPosition: 'center 30%' }}
        />
        {/* Vignette gradient at top, smooth dark blend to base bg color at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0d1117]" />
      </div>

      {/* Background gradient orbs for mobile */}
      <div className="md:hidden absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-72 h-72 bg-primary-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-[20%] right-[10%] w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>


      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">VipConnect</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <Link href="/chat" className="btn-primary px-4 py-2 sm:px-6 rounded-full text-sm sm:text-base font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/25">
              Open WebApplication
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2 sm:px-6 rounded-full text-sm sm:text-base font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/25">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-20 sm:pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 mb-6 sm:mb-8 backdrop-blur-md animate-fade-in shadow-xl shadow-black/50">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-white">New features: Advanced Group Admin Controls & Real-time Editing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 leading-tight animate-slide-in-right drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
          Connect Seamlessly <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">
            Without Boundaries
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mb-8 sm:mb-12 animate-fade-in drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]" style={{ animationDelay: '0.2s' }}>
          Experience real-time messaging, high-quality audio and video calls, and comprehensive group management all in one place. Fast, secure, and beautiful.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          {isAuthenticated ? (
            <Link href="/chat" className="btn-primary px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/20 flex items-center gap-2">
              Go to Chats
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : (
            <Link href="/register" className="btn-primary px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/20 flex items-center gap-2">
              Start Chatting Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Showcase Image for Mobile (shows full group photo without overlapping text) */}
        <div className="md:hidden w-full max-w-md mt-10 px-2 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-primary-500/10">
            <img
              src="/main.jpg"
              alt="VipConnect Community"
              className="w-full h-auto object-cover"
            />
            {/* Subtle overlay on the image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-16 sm:mt-32 w-full max-w-5xl">
          <div className="bg-chat-panel/50 backdrop-blur-sm border border-chat-border p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-left hover:border-primary-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3">Crystal Clear Calls</h3>
            <p className="text-sm sm:text-base text-gray-400">Enjoy high-definition video and audio calls with your contacts. Stay closer no matter the distance.</p>
          </div>

          <div className="bg-chat-panel/50 backdrop-blur-sm border border-chat-border p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-left hover:border-primary-500/30 transition-colors transform md:-translate-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 text-primary-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3">Supercharged Groups</h3>
            <p className="text-sm sm:text-base text-gray-400">Robust admin controls, invite links, restricted messaging, and comprehensive moderation tools.</p>
          </div>

          <div className="bg-chat-panel/50 backdrop-blur-sm border border-chat-border p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-left hover:border-primary-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3">Secure & Private</h3>
            <p className="text-sm sm:text-base text-gray-400">Your data is safe. Enjoy a fast, responsive interface built with privacy in mind.</p>
          </div>
        </div>

        {/* Why Choose VipConnect */}
        <div className="mt-20 sm:mt-40 w-full max-w-6xl text-left">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Built for teams, <br />
                <span className="text-primary-400">designed for you.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-400">
                Whether you're coordinating with colleagues, managing a large community, or just chatting with friends, VipConnect offers unparalleled flexibility and control.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm sm:text-base text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Real-time typing indicators & read receipts
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Edit and delete messages instantly
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  File sharing up to 50MB
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-500 blur-3xl opacity-20 rounded-full" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="/main.jpg"
                  alt="VipConnect community — friends connecting"
                  className="w-full h-56 sm:h-72 object-cover"
                  style={{ objectPosition: 'center 40%' }}
                />
                {/* Caption overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-4">
                  <p className="text-white font-semibold text-xs sm:text-sm">Stay connected with your crew 🤝</p>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">VipConnect brings your people together</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 sm:mt-40 w-full max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400 mb-2">99.9%</div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Uptime Guarantee</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">50ms</div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Ultra-low Latency</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">E2E</div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Encrypted Calls</div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">24/7</div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Support Team</div>
            </div>
          </div>
        </div>

        {/* Interactive App Preview Widget */}
        <div className="mt-20 sm:mt-40 w-full max-w-5xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center">Experience VipConnect in Action</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-12 text-center max-w-2xl mx-auto">
            Try our interactive mockup below. Type a message and see how the chat interface reacts in real-time.
          </p>

          <div className="bg-chat-panel/40 border border-chat-border/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col md:flex-row h-[500px] text-left w-full">
            {/* Mock Sidebar */}
            <div className="hidden md:flex flex-col w-64 border-r border-chat-border/30 bg-chat-sidebar/35 flex-shrink-0">
              <div className="p-4 border-b border-chat-border/20 flex items-center justify-between">
                <span className="font-bold text-sm text-gray-300">Conversations</span>
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full font-medium">Live</span>
              </div>
              <div className="p-2 space-y-1">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center font-bold text-sm relative">
                    S
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full border-2 border-chat-sidebar" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-white block truncate">Sarah Jenkins</span>
                      <span className="text-[10px] text-gray-500">10:43 AM</span>
                    </div>
                    <p className="text-xs text-primary-400 truncate mt-0.5">typing...</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-bold text-sm">
                    D
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-white truncate">David Chen</span>
                      <span className="text-[10px] text-gray-500">Yesterday</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">Sounds good! Let's connect.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-bold text-sm">
                    G
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-white truncate">Project Group</span>
                      <span className="text-[10px] text-gray-500">2 days ago</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">New designs are uploaded!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Chat View */}
            <div className="flex-1 flex flex-col h-full bg-black/10">
              {/* Mock Chat Header */}
              <div className="px-6 py-4 border-b border-chat-border/20 flex items-center justify-between bg-chat-panel/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center font-bold text-sm">
                    S
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white leading-none">Sarah Jenkins</h4>
                    <span className="text-xs text-primary-400 font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <button type="button" className="hover:text-primary-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </button>
                  <button type="button" className="hover:text-primary-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>

              {/* Mock Messages Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin flex flex-col justify-end">
                <div className="space-y-4 overflow-y-auto max-h-full no-scrollbar">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-md border ${msg.sender === 'me'
                          ? 'bg-primary-900/60 border-primary-800/40 text-white rounded-tr-none'
                          : 'bg-chat-bubble_in border-white/5 text-gray-200 rounded-tl-none'
                        }`}>
                        <p className="leading-relaxed break-words">{msg.text}</p>
                        <span className="block text-[9px] text-gray-400 text-right mt-1">{msg.time}</span>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-chat-bubble_in border border-white/5 text-gray-200 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center shadow-md">
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mock Input Bar */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-chat-border/20 bg-chat-panel/20 backdrop-blur-sm flex gap-3">
                <input
                  type="text"
                  className="flex-1 bg-chat-input/50 border border-chat-border focus:border-primary-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 transition-all focus:ring-1 focus:ring-primary-500/30 outline-none"
                  placeholder="Type a message to Sarah..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-20 sm:mt-40 w-full max-w-6xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-10 sm:mb-16 text-center">Loved by communities worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-chat-panel/40 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-chat-border relative text-left">
              <div className="text-primary-500 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <p className="text-sm sm:text-base text-gray-300 mb-6 italic">"The group admin controls are exactly what we needed. Managing our large community of over 500 members is a breeze now."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm sm:text-base">Sarah Jenkins</div>
                  <div className="text-xs sm:text-sm text-gray-500">Community Manager</div>
                </div>
              </div>
            </div>

            <div className="bg-chat-panel/40 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-chat-border relative text-left transform md:-translate-y-4">
              <div className="text-blue-500 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <p className="text-sm sm:text-base text-gray-300 mb-6 italic">"Video calls are incredibly smooth and the UI is just gorgeous. It feels like a truly premium app that respects user privacy."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm sm:text-base">David Chen</div>
                  <div className="text-xs sm:text-sm text-gray-500">Tech Entrepreneur</div>
                </div>
              </div>
            </div>

            <div className="bg-chat-panel/40 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-chat-border relative text-left">
              <div className="text-emerald-500 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <p className="text-sm sm:text-base text-gray-300 mb-6 italic">"The ability to edit and delete messages instantly saves me so much embarrassment. Best messaging platform out there."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm sm:text-base">Elena Rodriguez</div>
                  <div className="text-xs sm:text-sm text-gray-500">Freelance Designer</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-20 sm:mt-40 w-full max-w-4xl text-left">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-12 text-center max-w-2xl mx-auto">
            Got questions? We've got answers. Explore how VipConnect ensures security, performance, and flexibility.
          </p>

          <div className="space-y-4">
            {[
              {
                q: "How secure is VipConnect?",
                a: "Security is our cornerstone. All one-on-one and group voice/video calls are end-to-end encrypted. Your personal messages are transmitted over secure, encrypted protocols, keeping your data confidential."
              },
              {
                q: "Can I use VipConnect on multiple devices?",
                a: "Yes! VipConnect is fully cloud-synced. You can use it in your browser or as an installed web app on your laptop, tablet, or smartphone. Your conversations sync in real-time."
              },
              {
                q: "What is the maximum group size and admin capability?",
                a: "VipConnect supports community groups of up to 5,000 members. Admins gain supercharged moderation privileges, including restricted posting rights, invite links, and granular member management tools."
              },
              {
                q: "Are there file sharing limits?",
                a: "You can share media, documents, and archives up to 50MB in size directly within any chat window. Large files are optimized for fast upload and download speeds."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-chat-panel/40 border border-chat-border rounded-2xl overflow-hidden hover:border-primary-500/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-semibold text-sm sm:text-base text-white">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary-400' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === idx ? 'max-h-40 border-t border-chat-border/20' : 'max-h-0'
                    }`}
                >
                  <p className="px-6 py-5 text-xs sm:text-sm text-gray-400 leading-relaxed bg-[#0d1117]/30">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 sm:mt-40 w-full max-w-4xl bg-gradient-to-r from-primary-600/20 to-blue-600/20 border border-primary-500/30 rounded-3xl p-6 sm:p-12 text-center backdrop-blur-md">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready to upgrade your communication?</h2>
          <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already switched to VipConnect for a faster, more secure, and feature-rich messaging experience.
          </p>
          <div className="flex justify-center">
            {isAuthenticated ? (
              <Link href="/chat" className="btn-primary px-6 py-3 sm:px-8 rounded-full text-sm sm:text-base font-semibold shadow-lg shadow-primary-500/30">
                Enter WebApp
              </Link>
            ) : (
              <Link href="/register" className="btn-primary px-6 py-3 sm:px-8 rounded-full text-sm sm:text-base font-semibold shadow-lg shadow-primary-500/30">
                Create Free Account
              </Link>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <footer className="mt-28 sm:mt-40 w-full pt-16 pb-8 border-t border-chat-border/30 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 max-w-6xl mx-auto px-4">
            {/* Branding column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                </div>
                <span className="font-bold text-lg text-white">VipConnect</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                Connecting people across boundaries. Fast, secure, and beautiful real-time conversations.
              </p>
              <div className="flex gap-4">
                {/* Social links */}
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.3 3H3.7C3.3 3 3 3.3 3 3.7v16.7c0 .4.3.7.7.7h16.6c.4 0 .7-.3.7-.7V3.7c0-.4-.3-.7-.7-.7zM8.5 17.5H5.8V9h2.7v8.5zM7.2 7.8c-.8 0-1.5-.7-1.5-1.5S6.4 4.8 7.2 4.8s1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm10.3 9.7h-2.7V13c0-1.1-.9-2-2-2s-2 .9-2 2v4.5H8.1V9h2.7v1.2c.5-.8 1.6-1.4 2.7-1.4 2.2 0 4 1.8 4 4v4.7z" /></svg>
                </a>
              </div>
            </div>

            {/* Links columns */}
            <div>
              <h5 className="font-bold text-sm text-gray-200 mb-4 uppercase tracking-wider">Product</h5>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400 font-normal">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Download App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Release Notes</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-sm text-gray-200 mb-4 uppercase tracking-wider">Security</h5>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400 font-normal">
                <li><a href="#" className="hover:text-white transition-colors">Encryption</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR Compliance</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-4">
              <h5 className="font-bold text-sm text-gray-200 mb-4 uppercase tracking-wider font-semibold">Stay Tuned</h5>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
                Subscribe to receive product updates and community newsletters.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); toast.success("Thanks for subscribing! 📬"); }} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email"
                  className="w-full bg-chat-input/50 border border-chat-border focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all focus:ring-1 focus:ring-primary-500/30"
                />
                <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all">
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Bottom info */}
          <div className="mt-16 pt-8 border-t border-chat-border/10 max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <p>&copy; {new Date().getFullYear()} VipConnect. All rights reserved.</p>
            <p className="flex items-center gap-1 font-normal">Made with <span className="text-red-500">❤️</span> for communities worldwide.</p>
          </div>
        </footer>

      </main>
    </div>
  );
}
