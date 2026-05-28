'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back! 👋');
      router.push('/chat');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030508] flex overflow-hidden relative" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.3); }
          50% { box-shadow: 0 0 50px rgba(139,92,246,0.7), 0 0 100px rgba(139,92,246,0.3); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-slideInLeft { animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa, #8b5cf6, #38bdf8, #06b6d4);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-x 4s ease infinite;
        }
        .glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .glass-premium {
          background: rgba(8, 12, 21, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }
        .btn-premium {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-premium:hover {
          box-shadow: 0 4px 30px rgba(139, 92, 246, 0.55), 0 0 40px rgba(6, 182, 212, 0.25);
          transform: translateY(-2px) scale(1.02);
        }
        .btn-premium::after {
          content: '';
          position: absolute;
          top: -50%; left: -75%;
          width: 50%; height: 200%;
          background: rgba(255,255,255,0.15);
          transform: skewX(-20deg);
          animation: shimmer 3s infinite;
        }
        .btn-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 0 20px rgba(139,92,246,0.3);
        }
        .input-field {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.3s ease;
          color: white;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.04);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.05);
        }
        .input-field::placeholder { color: rgba(156,163,175,0.4); }
        .feature-chip {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .feature-chip:hover {
          background: rgba(139,92,246,0.08);
          border-color: rgba(139,92,246,0.25);
        }
        .orbit-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .chat-bubble-in {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .chat-bubble-out {
          background: linear-gradient(135deg, rgba(139,92,246,0.5), rgba(109,40,217,0.6));
          border: 1px solid rgba(139,92,246,0.3);
        }
      `}</style>

      {/* ── LEFT PANEL: Visual Showcase (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] flex-shrink-0 relative overflow-hidden flex-col">
        {/* Background image */}
        <img
          src="/login_side_art.png"
          alt="VipConnect visual"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030508]/10 via-[#030508]/20 to-[#030508]/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030508]/50 via-transparent to-[#030508]/60" />

        {/* Floating UI mockup cards */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">

          {/* Top: Logo + tagline */}
          <div className="animate-slideInLeft" style={{ animationDelay: '0s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </div>
              <span className="text-2xl font-black text-white">Vip<span className="text-violet-400">Connect</span></span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight max-w-xs">
              The future of<br />
              <span className="gradient-text">communication</span><br />
              is here.
            </h2>
          </div>

          {/* Middle: Floating chat mock */}
          <div className="flex flex-col gap-4 max-w-xs animate-float" style={{ animationDelay: '0.2s' }}>
            {/* Incoming message */}
            <div className="animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-cyan-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">S</div>
                <div className="chat-bubble-in rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[200px]">
                  <p className="text-white text-sm">Hey! Ready to connect? 👋</p>
                  <span className="text-[9px] text-gray-400 block text-right mt-0.5">10:42 AM</span>
                </div>
              </div>
            </div>
            {/* Outgoing message */}
            <div className="animate-slideInLeft flex justify-end" style={{ animationDelay: '0.4s' }}>
              <div className="chat-bubble-out rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[200px]">
                <p className="text-white text-sm">Absolutely! VipConnect is 🔥</p>
                <span className="text-[9px] text-violet-300 block text-right mt-0.5">10:43 AM ✓✓</span>
              </div>
            </div>
            {/* Video call indicator */}
            <div className="animate-slideInLeft" style={{ animationDelay: '0.5s' }}>
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 max-w-[220px]">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">HD Video Call</p>
                  <p className="text-gray-400 text-[10px]">E2E Encrypted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Feature chips */}
          <div className="animate-slideInLeft space-y-3" style={{ animationDelay: '0.4s' }}>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-4">Why people love VipConnect</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: '⚡', text: 'Ultra-fast messaging' },
                { icon: '🔒', text: 'E2E Encrypted' },
                { icon: '👥', text: '5K+ Group Support' },
                { icon: '📹', text: 'HD Video Calls' },
                { icon: '📁', text: '50MB File Sharing' },
                { icon: '✏️', text: 'Edit & Delete' },
              ].map(({ icon, text }) => (
                <div key={text} className="feature-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs text-gray-300 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center relative px-6 sm:px-10 py-12 z-10">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[#030508]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Back button */}
        <Link href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs font-medium hidden sm:block">Back to Home</span>
        </Link>

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-10 animate-fadeInUp relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <span className="text-2xl font-black text-white">Vip<span className="text-violet-400">Connect</span></span>
        </div>

        {/* Form Card (Premium glass-premium container) */}
        <div className="relative z-10 w-full max-w-[420px] p-8 sm:p-10 glass-premium squircle shadow-2xl">

          {/* Header */}
          <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Welcome back</h1>
            <p className="text-gray-400 text-xs sm:text-sm">Sign in to continue to VipConnect</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Email or Phone
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'email' ? 'text-violet-400' : 'text-gray-600'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email-input"
                  type="text"
                  className="input-field w-full rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <Link href="#" className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'password' ? 'text-violet-400' : 'text-gray-600'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field w-full rounded-2xl py-3 pl-11 pr-11 text-xs font-semibold"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="animate-fadeInUp pt-1" style={{ animationDelay: '0.2s' }}>
              <button
                id="login-btn"
                type="submit"
                disabled={isLoading}
                className="btn-premium w-full text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="animate-fadeInUp flex items-center gap-4 my-4" style={{ animationDelay: '0.25s' }}>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Social Buttons */}
          <div className="animate-fadeInUp grid grid-cols-2 gap-3 mb-5" style={{ animationDelay: '0.3s' }}>
            {[
              {
                name: 'Google',
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )
              },
              {
                name: 'GitHub',
                icon: (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                )
              },
            ].map(({ name, icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => toast('Coming soon! 🚀')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold text-gray-300 hover:text-white transition-all bg-white/3 border border-white/5 hover:bg-white/8 hover:border-violet-500/30"
              >
                {icon}
                {name}
              </button>
            ))}
          </div>

          {/* Sign up link */}
          <p className="animate-fadeInUp text-center text-gray-400 text-xs" style={{ animationDelay: '0.35s' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign up free →
            </Link>
          </p>

          {/* Trust badges */}
          <div className="animate-fadeInUp mt-6 flex items-center justify-center gap-5" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: '🔒', label: 'E2E Encrypted' },
              { icon: '⚡', label: 'Instant Connect' },
              { icon: '🛡️', label: 'GDPR Compliant' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-xs">{icon}</span>
                <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

