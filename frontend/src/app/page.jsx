'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import { initSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

/* ─── Floating Particle Component ─── */
function Particle({ style }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    width: `${Math.random() * 6 + 2}px`,
    height: `${Math.random() * 6 + 2}px`,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    background: i % 3 === 0
      ? 'rgba(139,92,246,0.6)'
      : i % 3 === 1
      ? 'rgba(6,182,212,0.5)'
      : 'rgba(52,211,153,0.4)',
    filter: 'blur(1px)',
    animation: `float-particle ${6 + Math.random() * 10}s ease-in-out ${Math.random() * 5}s infinite alternate`,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => <Particle key={i} style={p} />)}
    </div>
  );
}

/* ─── Animated Counter ─── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Have you tried the new VipConnect? 🔥", sender: "sarah", time: "10:42 AM" },
    { id: 2, text: "Yes! The UI is absolutely stunning! Love it ✨", sender: "me", time: "10:43 AM" },
    { id: 3, text: "Type a message below to try the real-time feel!", sender: "sarah", time: "10:43 AM" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const localToken = localStorage.getItem('vipconnect_token');
    if ((isAuthenticated && token) || localToken) {
      if (token || localToken) initSocket(token || localToken);
      router.replace('/chat');
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      color: 'from-violet-500 to-purple-600',
      glow: 'rgba(139,92,246,0.25)',
      title: 'Real-Time Messaging',
      desc: 'Lightning-fast encrypted messages with typing indicators, read receipts, and instant reactions.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-600',
      glow: 'rgba(6,182,212,0.25)',
      title: 'Crystal HD Calls',
      desc: 'Ultra-low latency HD video and audio calls with end-to-end encryption keeping you safe.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-600',
      glow: 'rgba(52,211,153,0.25)',
      title: 'Supercharged Groups',
      desc: 'Up to 5,000 members with advanced admin controls, invite links, and moderation tools.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'from-pink-500 to-rose-600',
      glow: 'rgba(236,72,153,0.25)',
      title: 'Bank-Grade Security',
      desc: 'E2E encryption on all calls and messages. Your data, your rules — always private.',
    },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newMsg = { id: Date.now(), text: inputValue, sender: 'me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    const userMsg = inputValue;
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let reply = "That's awesome! ⚡";
      if (userMsg.toLowerCase().includes('hello') || userMsg.toLowerCase().includes('hi')) reply = "Hello! Welcome to VipConnect! 👋 You're going to love it here!";
      else if (userMsg.toLowerCase().includes('call') || userMsg.toLowerCase().includes('video')) reply = "Our video calls are HD quality with E2E encryption — zero compromise!";
      else if (userMsg.toLowerCase().includes('group')) reply = "Groups support up to 5,000 members with powerful admin tools!";
      else {
        const replies = [
          "VipConnect is blazing fast — built on real-time socket infrastructure! 🚀",
          "You can share files up to 50MB, react to messages, and so much more!",
          "Sign up for free and experience the future of messaging today!",
          "We support voice messages, file sharing, and group video calls! 🎉",
        ];
        reply = replies[Math.floor(Math.random() * replies.length)];
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'sarah', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1400);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes float-particle {
          0% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.4; }
          100% { transform: translateY(-40px) translateX(20px) scale(1.3); opacity: 0.9; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(140px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(120deg) translateX(100px) rotate(-120deg); }
          to { transform: rotate(480deg) translateX(100px) rotate(-480deg); }
        }
        @keyframes orbit3 {
          from { transform: rotate(240deg) translateX(170px) rotate(-240deg); }
          to { transform: rotate(600deg) translateX(170px) rotate(-600deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease both; }
        .animate-fadeIn { animation: fadeIn 0.8s ease both; }
        .animate-scaleIn { animation: scaleIn 0.8s ease both; }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa, #38bdf8, #34d399);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-x 4s ease infinite;
        }
        .glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .glass-hover:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(139,92,246,0.3);
        }
        .btn-glow {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(124,58,237,0.4);
        }
        .btn-glow:hover {
          box-shadow: 0 0 35px rgba(124,58,237,0.6), 0 0 70px rgba(124,58,237,0.2);
          transform: translateY(-2px) scale(1.02);
        }
        .btn-glow::after {
          content: '';
          position: absolute;
          top: -50%; left: -75%;
          width: 50%; height: 200%;
          background: rgba(255,255,255,0.15);
          transform: skewX(-20deg);
          animation: shimmer 3s infinite;
        }
        .feature-card { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .feature-card:hover { transform: translateY(-8px); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hero-bg { background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.15), transparent 70%), radial-gradient(ellipse 50% 50% at 80% 50%, rgba(6,182,212,0.08), transparent 60%), #080c14; }
      `}</style>

      {/* Hero Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/home_hero_bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/30 via-transparent to-[#080c14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080c14]/60 via-transparent to-[#080c14]/60" />
      </div>

      <FloatingParticles />

      {/* ── NAVBAR ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/40" />
            <svg className="relative w-10 h-10 p-2 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">Vip<span className="text-violet-400">Connect</span></span>
        </div>

        {/* Nav Links (desktop) */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#preview" className="hover:text-white transition-colors">Preview</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/chat" className="btn-glow text-white font-semibold px-5 py-2.5 rounded-full text-sm">
              Open App
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-glow text-white font-semibold px-5 py-2.5 rounded-full text-sm">
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10">
        <section className="pt-16 sm:pt-24 pb-20 sm:pb-32 flex flex-col items-center text-center">

          {/* Badge */}
          <div className="animate-fadeInUp inline-flex items-center gap-2 glass px-5 py-2 rounded-full mb-8 shadow-lg" style={{ animationDelay: '0s' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-200">✨ Now with Advanced Group Admin Controls & Real-time Editing</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fadeInUp text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-6" style={{ animationDelay: '0.1s' }}>
            Connect Beyond
            <br />
            <span className="gradient-text">Boundaries</span>
          </h1>

          {/* Sub */}
          <p className="animate-fadeInUp text-base sm:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Experience real-time messaging, crystal-clear HD calls, and powerful group management — all wrapped in a breathtakingly beautiful interface.
          </p>

          {/* CTAs */}
          <div className="animate-fadeInUp flex flex-col sm:flex-row items-center gap-4 mb-16" style={{ animationDelay: '0.3s' }}>
            {isAuthenticated ? (
              <Link href="/chat" className="btn-glow text-white font-bold px-8 py-4 rounded-full text-base flex items-center gap-2">
                Go to Chats
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-glow text-white font-bold px-8 py-4 rounded-full text-base flex items-center gap-2">
                  Start for Free
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link href="/login" className="glass glass-hover text-white font-semibold px-8 py-4 rounded-full text-base transition-all hover:scale-105">
                  Sign In →
                </Link>
              </>
            )}
          </div>

          {/* ── Orbit / Visual ── */}
          <div className="animate-scaleIn relative w-72 h-72 sm:w-96 sm:h-96 mx-auto mb-8 sm:mb-0" style={{ animationDelay: '0.4s' }}>
            {/* Center circle */}
            <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 shadow-[0_0_40px_rgba(124,58,237,0.6)] flex items-center justify-center z-10">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" /></svg>
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-violet-500/40" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
            <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-violet-500/30" style={{ animation: 'pulse-ring 2s ease-out 0.7s infinite' }} />
            {/* Orbit tracks */}
            <div className="absolute inset-0 rounded-full border border-white/5" />
            <div className="absolute top-[15%] left-[15%] right-[15%] bottom-[15%] rounded-full border border-white/5" />
            {/* Orbiting items */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'orbit 8s linear infinite' }}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-400/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'orbit2 12s linear infinite' }}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-400/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'orbit3 10s linear infinite' }}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 shadow-lg shadow-pink-400/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="relative z-10 mb-28">
          <div className="glass rounded-3xl px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: 99, suffix: '.9%', label: 'Uptime SLA', color: 'from-violet-400 to-purple-400' },
              { val: 50, suffix: 'ms', label: 'Avg Latency', color: 'from-cyan-400 to-blue-400' },
              { val: 5000, suffix: '+', label: 'Max Group Size', color: 'from-emerald-400 to-teal-400' },
              { val: 256, suffix: '-bit', label: 'Encryption', color: 'from-pink-400 to-rose-400' },
            ].map(({ val, suffix, label, color }) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                  <Counter target={val} suffix={suffix} />
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES SECTION ── */}
        <section id="features" className="mb-32">
          <div className="text-center mb-16">
            <p className="text-violet-400 font-semibold text-sm uppercase tracking-widest mb-3">Why VipConnect</p>
            <h2 className="text-4xl sm:text-5xl font-black">Everything you need,<br /><span className="gradient-text">nothing you don't</span></h2>
          </div>

          {/* Feature Selector (tabs) */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveFeature(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeFeature === i
                    ? `bg-gradient-to-r ${f.color} text-white shadow-lg`
                    : 'glass text-gray-400 hover:text-white'
                }`}
              >
                <span className="w-4 h-4">{f.icon}</span>
                {f.title}
              </button>
            ))}
          </div>

          {/* Active Feature Spotlight */}
          <div className="glass rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-10 transition-all duration-500"
            style={{ boxShadow: `0 0 60px ${features[activeFeature].glow}` }}>
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${features[activeFeature].color} flex items-center justify-center shadow-2xl flex-shrink-0`}>
              <span className="text-white scale-150">{features[activeFeature].icon}</span>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black mb-3">{features[activeFeature].title}</h3>
              <p className="text-lg text-gray-400 max-w-xl leading-relaxed">{features[activeFeature].desc}</p>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {features.map((f, i) => (
              <div
                key={i}
                className={`feature-card glass glass-hover rounded-2xl p-6 cursor-pointer ${activeFeature === i ? 'border-violet-500/40' : ''}`}
                onClick={() => setActiveFeature(i)}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <span className="text-white">{f.icon}</span>
                </div>
                <h4 className="font-bold text-base mb-2">{f.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── LIVE CHAT PREVIEW ── */}
        <section id="preview" className="mb-32">
          <div className="text-center mb-12">
            <p className="text-cyan-400 font-semibold text-sm uppercase tracking-widest mb-3">Interactive Demo</p>
            <h2 className="text-4xl sm:text-5xl font-black">Try it <span className="gradient-text">right now</span></h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">Send a message and experience how VipConnect feels — live, instant, beautiful.</p>
          </div>

          {/* Chat Preview Widget */}
          <div className="glass rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[520px]"
            style={{ boxShadow: '0 0 80px rgba(124,58,237,0.12)' }}>

            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-72 border-r border-white/5 bg-white/[0.02] flex-shrink-0">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <span className="font-bold text-sm text-gray-200">Messages</span>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-semibold">● Live</span>
              </div>
              <div className="p-3 space-y-1 overflow-y-auto no-scrollbar">
                {[
                  { name: 'Sarah Jenkins', preview: 'typing...', color: 'from-green-400 to-cyan-500', active: true, initial: 'S' },
                  { name: 'David Chen', preview: "Let's connect tomorrow!", color: 'from-purple-400 to-pink-500', active: false, initial: 'D' },
                  { name: 'Project Alpha', preview: 'New designs uploaded ✅', color: 'from-orange-400 to-red-500', active: false, initial: 'P' },
                  { name: 'Elena Rodriguez', preview: 'Voice message — 0:42', color: 'from-blue-400 to-indigo-500', active: false, initial: 'E' },
                ].map((c) => (
                  <div key={c.name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${c.active ? 'bg-violet-500/10 border border-violet-500/20' : 'opacity-60 hover:opacity-90 hover:bg-white/3'}`}>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center font-bold text-sm flex-shrink-0 relative`}>
                      {c.initial}
                      {c.active && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d111a]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-white truncate">{c.name}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${c.active ? 'text-violet-400' : 'text-gray-500'}`}>{c.preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 flex flex-col bg-black/10">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between backdrop-blur-sm bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center font-bold text-sm relative">
                    S
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d111a]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Sarah Jenkins</h4>
                    <span className="text-xs text-emerald-400 font-medium">● Online</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  {[
                    <path key="phone" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
                    <path key="video" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
                  ].map((d, i) => (
                    <button key={i} type="button" className="hover:text-violet-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{d}</svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 no-scrollbar flex flex-col">
                <div className="flex-1" />
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-lg ${
                      msg.sender === 'me'
                        ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-tr-sm'
                        : 'glass text-gray-200 rounded-tl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="block text-[9px] opacity-60 text-right mt-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/[0.02] flex gap-3">
                <input
                  type="text"
                  className="flex-1 bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-all focus:ring-2 focus:ring-violet-500/20 outline-none"
                  placeholder="Type to Sarah..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-glow w-10 h-10 rounded-xl text-white flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="mb-32">
          <div className="text-center mb-12">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl sm:text-5xl font-black">Loved by <span className="gradient-text">communities</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "The group admin controls are exactly what we needed. Managing our 500+ member community is effortless now.", name: "Sarah Jenkins", role: "Community Manager", color: 'from-green-400 to-cyan-500' },
              { quote: "Video calls are incredibly smooth and the UI is gorgeous. A truly premium app that respects user privacy.", name: "David Chen", role: "Tech Entrepreneur", color: 'from-purple-400 to-pink-500', raised: true },
              { quote: "The ability to edit and delete messages instantly is a game changer. Best messaging platform by far!", name: "Elena Rodriguez", role: "Freelance Designer", color: 'from-orange-400 to-red-500' },
            ].map(({ quote, name, role, color, raised }) => (
              <div key={name} className={`glass glass-hover rounded-3xl p-8 transition-all ${raised ? 'md:-translate-y-4' : ''}`}>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex-shrink-0`} />
                  <div>
                    <div className="font-bold text-sm">{name}</div>
                    <div className="text-xs text-gray-500">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mb-32 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-pink-400 font-semibold text-sm uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl sm:text-5xl font-black">Got <span className="gradient-text">questions?</span></h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "How secure is VipConnect?", a: "Security is our foundation. All voice/video calls are end-to-end encrypted. Messages are transmitted over secure, encrypted protocols keeping your data completely confidential." },
              { q: "Can I use VipConnect on multiple devices?", a: "Yes! VipConnect is fully cloud-synced. Use it in your browser on any device — conversations sync in real-time." },
              { q: "What is the maximum group size?", a: "Groups support up to 5,000 members with supercharged admin controls: restricted posting, invite links, and granular member management." },
              { q: "Are there file sharing limits?", a: "Share media, documents, and archives up to 50MB directly within any chat. Large files are optimized for fast transfer speeds." },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`glass rounded-2xl overflow-hidden transition-all ${openFaq === idx ? 'border-violet-500/30' : 'glass-hover'}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-sm sm:text-base text-white">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4 ${openFaq === idx ? 'rotate-180 text-violet-400' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === idx ? 'max-h-40' : 'max-h-0'}`}>
                  <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="mb-32 relative overflow-hidden">
          <div className="glass rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.08))', boxShadow: '0 0 80px rgba(124,58,237,0.15)' }}>
            {/* Glow blobs */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-black mb-4">Ready to <span className="gradient-text">upgrade</span> your communication?</h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-8 text-base sm:text-lg">
                Join thousands of users who have switched to VipConnect for a faster, more secure, and stunning messaging experience.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {isAuthenticated ? (
                  <Link href="/chat" className="btn-glow text-white font-bold px-8 py-4 rounded-full text-base">Enter App →</Link>
                ) : (
                  <>
                    <Link href="/register" className="btn-glow text-white font-bold px-8 py-4 rounded-full text-base">Create Free Account</Link>
                    <Link href="/login" className="glass glass-hover text-white font-semibold px-8 py-4 rounded-full text-base transition-all">Sign In</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/5 pt-14 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-6xl mx-auto mb-12">
            <div className="space-y-4 col-span-1 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" /></svg>
                </div>
                <span className="font-bold text-lg">Vip<span className="text-violet-400">Connect</span></span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Connecting people across boundaries. Fast, secure, and beautiful real-time conversations.</p>
              <div className="flex gap-3">
                {['twitter', 'github', 'linkedin'].map(s => (
                  <a key={s} href="#" className="w-8 h-8 rounded-lg glass flex items-center justify-center text-gray-500 hover:text-violet-400 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      {s === 'twitter' && <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />}
                      {s === 'github' && <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />}
                      {s === 'linkedin' && <path d="M20.3 3H3.7C3.3 3 3 3.3 3 3.7v16.7c0 .4.3.7.7.7h16.6c.4 0 .7-.3.7-.7V3.7c0-.4-.3-.7-.7-.7zM8.5 17.5H5.8V9h2.7v8.5zM7.2 7.8c-.8 0-1.5-.7-1.5-1.5S6.4 4.8 7.2 4.8s1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm10.3 9.7h-2.7V13c0-1.1-.9-2-2-2s-2 .9-2 2v4.5H8.1V9h2.7v1.2c.5-.8 1.6-1.4 2.7-1.4 2.2 0 4 1.8 4 4v4.7z" />}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Download', 'Release Notes'] },
              { title: 'Security', links: ['Encryption', 'Privacy Policy', 'Terms of Service', 'GDPR'] },
              { title: 'Stay Tuned', isNewsletter: true },
            ].map((col) => (
              <div key={col.title}>
                <h5 className="font-bold text-xs text-gray-300 uppercase tracking-widest mb-4">{col.title}</h5>
                {col.isNewsletter ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Subscribe to product updates and newsletters.</p>
                    <form onSubmit={(e) => { e.preventDefault(); toast.success('Thanks for subscribing! 📬'); }} className="flex gap-2">
                      <input type="email" required placeholder="your@email.com" className="flex-1 bg-white/5 border border-white/10 focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none transition-all" />
                      <button type="submit" className="btn-glow text-white font-bold px-3 py-2 rounded-xl text-xs">→</button>
                    </form>
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm text-gray-500">
                    {col.links.map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2">
            <p>© {new Date().getFullYear()} VipConnect. All rights reserved.</p>
            <p>Made with <span className="text-rose-500">♥</span> for communities worldwide.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
