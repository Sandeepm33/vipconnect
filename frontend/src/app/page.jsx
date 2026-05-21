'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import { initSocket } from '@/lib/socket';

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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-chat-bg text-white selection:bg-primary-500/30 overflow-x-hidden relative">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/home_hero_bg.png" alt="Hero Background" className="w-full h-full object-cover opacity-20 blur-sm mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-chat-bg/80 via-chat-bg/50 to-chat-bg" />
        </div>
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-[120px] animate-pulse-soft z-0" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] z-0" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] rounded-full bg-primary-500/5 blur-[150px] pointer-events-none z-0" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">VipConnect</span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link href="/chat" className="btn-primary px-6 py-2 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/25">
              Open WebApp
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white px-4 py-2 font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary px-6 py-2 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/25">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-xl animate-fade-in shadow-xl shadow-black/50">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-sm font-medium text-white">New features: Advanced Group Admin Controls & Real-time Editing</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-slide-in-right">
          Connect Seamlessly <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">
            Without Boundaries
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Experience real-time messaging, high-quality audio and video calls, and comprehensive group management all in one place. Fast, secure, and beautiful.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          {isAuthenticated ? (
            <Link href="/chat" className="btn-primary px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/20 flex items-center gap-2">
              Go to Chats
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : (
            <Link href="/register" className="btn-primary px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/20 flex items-center gap-2">
              Start Chatting Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full max-w-5xl">
          <div className="bg-chat-panel/50 backdrop-blur-sm border border-chat-border p-8 rounded-3xl text-left hover:border-primary-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Crystal Clear Calls</h3>
            <p className="text-gray-400">Enjoy high-definition video and audio calls with your contacts. Stay closer no matter the distance.</p>
          </div>

          <div className="bg-chat-panel/50 backdrop-blur-sm border border-chat-border p-8 rounded-3xl text-left hover:border-primary-500/30 transition-colors transform md:-translate-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 text-primary-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Supercharged Groups</h3>
            <p className="text-gray-400">Robust admin controls, invite links, restricted messaging, and comprehensive moderation tools.</p>
          </div>

          <div className="bg-chat-panel/50 backdrop-blur-sm border border-chat-border p-8 rounded-3xl text-left hover:border-primary-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
            <p className="text-gray-400">Your data is safe. Enjoy a fast, responsive interface built with privacy in mind.</p>
          </div>
        </div>

        {/* New Feature Section: Why Choose VipConnect */}
        <div className="mt-40 w-full max-w-6xl text-left">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 animate-slide-in-left">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Built for teams, <br />
                <span className="text-primary-400">designed for you.</span>
              </h2>
              <p className="text-lg text-gray-400">
                Whether you're coordinating with colleagues, managing a large community, or just chatting with friends, VipConnect offers unparalleled flexibility and control. 
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Real-time typing indicators & read receipts
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Edit and delete messages instantly
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  File sharing up to 50MB
                </li>
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-500 blur-3xl opacity-20 rounded-full" />
              <div className="relative glass-card border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl">
                {/* Mock UI for visual appeal */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
                  <div>
                    <div className="h-4 w-32 bg-white/20 rounded-full mb-2" />
                    <div className="h-3 w-20 bg-white/10 rounded-full" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                    <div className="h-10 w-48 bg-white/10 rounded-2xl rounded-bl-none" />
                  </div>
                  <div className="flex items-end justify-end gap-2">
                    <div className="h-10 w-64 bg-primary-500/40 rounded-2xl rounded-br-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-40 w-full max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400 mb-2">99.9%</div>
              <div className="text-gray-400 font-medium">Uptime Guarantee</div>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">50ms</div>
              <div className="text-gray-400 font-medium">Ultra-low Latency</div>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">E2E</div>
              <div className="text-gray-400 font-medium">Encrypted Calls</div>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">24/7</div>
              <div className="text-gray-400 font-medium">Support Team</div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-40 w-full max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">Loved by communities worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-chat-panel/40 p-8 rounded-3xl border border-chat-border relative">
              <div className="text-primary-500 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <p className="text-gray-300 mb-6 italic">"The group admin controls are exactly what we needed. Managing our large community of over 500 members is a breeze now."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500" />
                <div>
                  <div className="font-bold">Sarah Jenkins</div>
                  <div className="text-sm text-gray-500">Community Manager</div>
                </div>
              </div>
            </div>
            
            <div className="bg-chat-panel/40 p-8 rounded-3xl border border-chat-border relative transform md:-translate-y-4">
              <div className="text-blue-500 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <p className="text-gray-300 mb-6 italic">"Video calls are incredibly smooth and the UI is just gorgeous. It feels like a truly premium app that respects user privacy."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500" />
                <div>
                  <div className="font-bold">David Chen</div>
                  <div className="text-sm text-gray-500">Tech Entrepreneur</div>
                </div>
              </div>
            </div>

            <div className="bg-chat-panel/40 p-8 rounded-3xl border border-chat-border relative">
              <div className="text-emerald-500 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <p className="text-gray-300 mb-6 italic">"The ability to edit and delete messages instantly saves me so much embarrassment. Best messaging platform out there."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                <div>
                  <div className="font-bold">Elena Rodriguez</div>
                  <div className="text-sm text-gray-500">Freelance Designer</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-40 w-full max-w-4xl bg-gradient-to-r from-primary-600/20 to-blue-600/20 border border-primary-500/30 rounded-3xl p-12 text-center backdrop-blur-md">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to upgrade your communication?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already switched to VipConnect for a faster, more secure, and feature-rich messaging experience.
          </p>
          <div className="flex justify-center">
            {isAuthenticated ? (
              <Link href="/chat" className="btn-primary px-8 py-3 rounded-full text-lg font-semibold shadow-lg shadow-primary-500/30">
                Enter WebApp
              </Link>
            ) : (
              <Link href="/register" className="btn-primary px-8 py-3 rounded-full text-lg font-semibold shadow-lg shadow-primary-500/30">
                Create Free Account
              </Link>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
