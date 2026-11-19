import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Sparkles, Shield, LogIn, ArrowRight, X, Globe, Lock } from 'lucide-react';

export const WelcomeAuthView: React.FC = () => {
  const { 
    loginWithGoogle, 
    loginWithCredentials, 
    registerWithCredentials, 
    continueAsGuest 
  } = useGameStore();

  const [authMode, setAuthMode] = useState<'welcome' | 'login' | 'register'>('welcome');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithCredentials(loginEmail, loginPassword);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerWithCredentials(regEmail, regPassword, regName, regHandle);
  };

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center py-6 px-3 sm:px-6 select-none font-comfortaa">
      
      {/* Centered Auth Card Container */}
      <div className="w-full max-w-md bg-[#180529]/90 border border-accent/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/25 rounded-full blur-3xl pointer-events-none" />

        {authMode === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-6 relative z-10">
            
            {/* Logo & Brand Header */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <img 
                  src="/no bg logo.png" 
                  alt="Rvstrangers" 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_20px_rgba(192,38,211,0.6)] animate-pulse"
                  onError={(e) => {
                    // Fallback to stylized dicebear avatar if local image not found
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                Rvstrangers
              </h1>
              <p className="text-xs sm:text-sm text-accent-light font-medium">
                Deep questions. Real connections.
              </p>
            </div>

            {/* Visual Mini 3D Card Preview */}
            <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#290847] to-[#17052A] border border-accent/25 flex items-center gap-3.5 shadow-inner">
              <div className="w-11 h-11 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-2xl shrink-0 shadow-md">
                🎴
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-accent-light font-bold uppercase tracking-wider">Conversation Game</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-xs text-purple-200 mt-0.5 line-clamp-1 italic font-medium">
                  "What's a truth about yourself few people know?"
                </p>
              </div>
            </div>

            {/* Main Authentication Onboarding Actions */}
            <div className="w-full space-y-3 pt-1">
              
              {/* 1. Continue with Google (Full Access) */}
              <button
                onClick={() => loginWithGoogle()}
                className="w-full py-4 px-4 rounded-2xl bg-white text-[#1F1726] font-extrabold text-xs sm:text-sm shadow-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 group border border-white/40"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
                <span className="text-[10px] text-purple-900/80 font-semibold tracking-normal">
                  Secure Google sign-in • Friends, chat & cloud saves
                </span>
              </button>

              {/* 2. Continue as Guest (Local Mode) */}
              <button
                onClick={continueAsGuest}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#3A1054] to-[#250938] hover:from-[#4D1570] hover:to-[#310C4A] border border-accent/40 hover:border-accent text-white font-bold text-xs sm:text-sm shadow-lg active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5 group"
              >
                <div className="flex items-center gap-2">
                  <span>Continue as Guest</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/25 text-accent-light font-bold">
                    Local Play
                  </span>
                </div>
                <span className="text-[10px] text-purple-300/80 font-medium">
                  Join nearby game tables • Zero sign-up required
                </span>
              </button>

              {/* Discreet Alternative Auth Links */}
              <div className="pt-2 text-[11px] text-purple-300/70 flex items-center justify-center gap-1.5 font-medium">
                <span>Prefer email?</span>
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-accent-light hover:text-white font-bold underline"
                >
                  Log In
                </button>
                <span>or</span>
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-accent-light hover:text-white font-bold underline"
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Trust Badges Footer */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-purple-300/60 pt-2 border-t border-white/5 w-full">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" /> Secure Sessions
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-accent" /> Privacy First
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-400" /> Cloudflare Edge
              </span>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* LOGIN MODAL / FORM                                       */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <div className="space-y-5 relative z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-accent/20">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <LogIn className="w-4 h-4 text-accent" />
                <span>Welcome Back</span>
              </h2>
              <button 
                onClick={() => setAuthMode('welcome')}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-[#120320] border border-accent/30 text-white text-xs sm:text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-[#120320] border border-accent/30 text-white text-xs sm:text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-lg shadow-accent/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <span className="text-xs text-purple-300/70">Don't have an account yet? </span>
              <button 
                onClick={() => setAuthMode('register')}
                className="text-xs font-bold text-accent-light hover:underline ml-1"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* REGISTER MODAL / FORM                                    */}
        {/* ======================================================== */}
        {authMode === 'register' && (
          <div className="space-y-4 relative z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-accent/20">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Create Your Account</span>
              </h2>
              <button 
                onClick={() => setAuthMode('welcome')}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Vance"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full py-2 px-3.5 rounded-2xl bg-[#120320] border border-accent/30 text-white text-xs sm:text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full py-2 px-3.5 rounded-2xl bg-[#120320] border border-accent/30 text-white text-xs sm:text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1">
                  Choose Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent text-xs font-bold">@</span>
                  <input
                    type="text"
                    placeholder="alex_92"
                    value={regHandle}
                    onChange={(e) => setRegHandle(e.target.value)}
                    className="w-full py-2 pl-8 pr-3.5 rounded-2xl bg-[#120320] border border-accent/30 text-white text-xs sm:text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full py-2 px-3.5 rounded-2xl bg-[#120320] border border-accent/30 text-white text-xs sm:text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-lg shadow-accent/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-1"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-1">
              <span className="text-xs text-purple-300/70">Already have an account? </span>
              <button 
                onClick={() => setAuthMode('login')}
                className="text-xs font-bold text-accent-light hover:underline ml-1"
              >
                Log In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
