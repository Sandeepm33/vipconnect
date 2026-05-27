'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toast.error('Please fill in all required fields');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (form.password !== form.confirm) {
      return toast.error('Passwords do not match');
    }
    const result = await register(form.name, form.email, form.password, form.phone);
    if (result.success) {
      toast.success('Account created! Welcome to VipConnect 🎉');
      router.push('/chat');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080c14] flex overflow-hidden relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
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
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); }
          50% { box-shadow: 0 0 50px rgba(124,58,237,0.7), 0 0 100px rgba(124,58,237,0.3); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.7s ease both; }
        .animate-slideInLeft { animation: slideInLeft 0.8s ease both; }
        .animate-float { animation: float 4s ease-in-out infinite; }
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
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .btn-glow {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          box-shadow: 0 0 20px rgba(124,58,237,0.4);
          transition: all 0.3s ease;
        }
        .btn-glow:hover {
          box-shadow: 0 0 40px rgba(124,58,237,0.7), 0 0 80px rgba(124,58,237,0.2);
          transform: translateY(-1px);
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
        .btn-glow:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 0 20px rgba(124,58,237,0.3);
        }
        .input-field {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s ease;
          color: white;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(124,58,237,0.7);
          background: rgba(124,58,237,0.06);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12), 0 0 20px rgba(124,58,237,0.08);
        }
        .input-field::placeholder { color: rgba(156,163,175,0.5); }
        .feature-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .feature-chip:hover {
          background: rgba(124,58,237,0.08);
          border-color: rgba(124,58,237,0.25);
        }
        .chat-bubble-in {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .chat-bubble-out {
          background: linear-gradient(135deg, rgba(124,58,237,0.5), rgba(109,40,217,0.6));
          border: 1px solid rgba(124,58,237,0.3);
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#080c14]/10 via-[#080c14]/20 to-[#080c14]/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/50 via-transparent to-[#080c14]/60" />

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

      {/* ── RIGHT PANEL: Register Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center relative px-6 sm:px-10 py-12 z-10 overflow-y-auto scrollbar-thin">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[#080c14]" />
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
        <div className="lg:hidden flex flex-col items-center mb-6 animate-fadeInUp relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <span className="text-2xl font-black text-white">Vip<span className="text-violet-400">Connect</span></span>
        </div>

        {/* Form Card */}
        <div className="relative z-10 w-full max-w-[400px]">

          {/* Header */}
          <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
            <h1 className="text-3xl font-black text-white mb-2">Create Account</h1>
            <p className="text-gray-500 text-sm">Join VipConnect today and communicate freely</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'name' ? 'text-violet-400' : 'text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="name-input"
                  type="text"
                  className="input-field w-full rounded-2xl py-3 pl-12 pr-4 text-sm font-medium"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'email' ? 'text-violet-400' : 'text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="register-email"
                  type="email"
                  className="input-field w-full rounded-2xl py-3 pl-12 pr-4 text-sm font-medium"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'phone' ? 'text-violet-400' : 'text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  id="phone-input"
                  type="tel"
                  className="input-field w-full rounded-2xl py-3 pl-12 pr-4 text-sm font-medium"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'password' ? 'text-violet-400' : 'text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field w-full rounded-2xl py-3 pl-12 pr-12 text-sm font-medium"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
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

            {/* Confirm Password Field */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'confirm' ? 'text-violet-400' : 'text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  id="confirm-password"
                  type="password"
                  className="input-field w-full rounded-2xl py-3 pl-12 pr-4 text-sm font-medium"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0.35s' }}>
              <button
                id="register-btn"
                type="submit"
                disabled={isLoading}
                className="btn-glow w-full rounded-2xl py-3.5 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Alternate action */}
          <p className="text-center text-gray-500 mt-6 text-sm animate-fadeInUp animate-pulse-soft" style={{ animationDelay: '0.4s' }}>
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
