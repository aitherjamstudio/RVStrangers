import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { LogIn, ArrowRight, X, Sparkles, User, ChevronRight } from 'lucide-react';
import { DeckBox3D } from './DeckBox3D';

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
    <div className="w-full min-h-[100dvh] sm:min-h-[92vh] flex flex-col items-center justify-center py-2 sm:py-6 px-2 sm:px-4 select-none font-comfortaa">
      
      {/* Mobile Card Frame Container */}
      <div className="relative w-full max-w-[430px] min-h-[680px] sm:min-h-[760px] sm:max-h-[840px] bg-gradient-to-b from-[#130222] via-[#0D011A] to-[#07000E] rounded-[36px] sm:rounded-[44px] overflow-hidden flex flex-col justify-between items-center px-5 sm:px-6 py-7 sm:py-9 shadow-2xl border border-white/10 sm:border-purple-800/30">

        {/* Top-Left Ambient Aurora Glow Wave */}
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF2E93]/40 via-[#8A2BE2]/20 to-transparent blur-[75px] pointer-events-none" />

        {/* Top-Left Floating Card with Heart */}
        <div className="absolute -top-4 -left-6 w-28 h-40 rounded-2xl bg-[#230938]/40 border border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.2)] -rotate-[26deg] flex items-center justify-center pointer-events-none opacity-75 backdrop-blur-[2px]">
          <svg className="w-8 h-8 text-fuchsia-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.9)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        {/* Top-Right Floating Card with Star */}
        <div className="absolute -top-4 -right-6 w-28 h-40 rounded-2xl bg-[#230938]/40 border border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.2)] rotate-[26deg] flex items-center justify-center pointer-events-none opacity-75 backdrop-blur-[2px]">
          <svg className="w-8 h-8 text-fuchsia-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.9)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
          </svg>
        </div>

        {/* ======================================================== */}
        {/* WELCOME SCREEN DISPLAY                                   */}
        {/* ======================================================== */}
        {authMode === 'welcome' && (
          <div className="w-full flex-1 flex flex-col justify-between items-center z-10 py-1">
            
            {/* Center Branding & Feature Highlights */}
            <div className="w-full flex flex-col items-center my-auto">
              
              {/* Central 3D Deck Box Hero (Direct radiant glow, prominent size, no box container) */}
              <div className="relative w-44 h-56 sm:w-52 sm:h-64 flex items-center justify-center -mt-2 mb-1">
                {/* Layer 1: Core Intense Neon Glow directly behind the 3D Box */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#FF2E93] via-[#D946EF] to-[#8B5CF6] blur-2xl opacity-90 animate-pulse pointer-events-none" />
                
                {/* Layer 2: Wide Ambient Radiance */}
                <div className="absolute -inset-2 rounded-full bg-gradient-to-b from-[#EC4899]/60 via-[#C026D3]/35 to-transparent blur-[50px] pointer-events-none" />

                {/* Ground Contact Shadow under the floating box */}
                <div className="absolute -bottom-2 w-36 sm:w-44 h-5 rounded-[100%] bg-black/85 blur-md pointer-events-none" />
                <div className="absolute -bottom-1 w-28 sm:w-36 h-3 rounded-[100%] bg-fuchsia-950/70 blur-sm pointer-events-none" />

                {/* 3D Interactive Card Deck Box */}
                <DeckBox3D className="relative z-10 w-full h-full" />
              </div>

              {/* Title & Tagline */}
              <div className="text-center mt-2 sm:mt-3">
                <h1 className="text-3xl sm:text-4xl font-black italic tracking-tight">
                  <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">RV</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3EA5] via-[#F43F9E] to-[#E026D8] drop-shadow-[0_0_20px_rgba(244,63,158,0.6)]">Strangers</span>
                </h1>
                <p className="text-purple-100/85 text-xs sm:text-sm font-medium tracking-wide mt-1.5">
                  Built for meaningful connections.
                </p>

                {/* Glowing Heart Divider matching reference mockup */}
                <div className="flex items-center justify-center gap-2.5 mt-2.5 opacity-90 pointer-events-none">
                  <div className="w-12 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent via-pink-500/70 to-pink-500" />
                  <svg className="w-3.5 h-3.5 text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.95)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <div className="w-12 sm:w-16 h-[1.5px] bg-gradient-to-l from-transparent via-pink-500/70 to-pink-500" />
                </div>
              </div>

              {/* 3 Feature Pillars */}
              <div className="flex items-center justify-between w-full max-w-[340px] px-2 mt-6 sm:mt-7 mb-2">
                
                {/* Pillar 1: Meet New People */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner">
                    <svg className="w-5 h-5 text-purple-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-200 text-center leading-tight mt-2">
                    Meet<br/>New People
                  </span>
                </div>

                {/* Vertical Divider 1 */}
                <div className="h-8 w-[1px] bg-white/10" />

                {/* Pillar 2: Play Card Games */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner">
                    <svg className="w-5 h-5 text-purple-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="13" height="15" rx="2" transform="rotate(-6 3 5)" />
                      <rect x="8" y="3" width="13" height="15" rx="2" transform="rotate(6 8 3)" />
                      <path d="M14.5 9.5l.6 1.2 1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6 1.2-.6z" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-200 text-center leading-tight mt-2">
                    Play<br/>Card Games
                  </span>
                </div>

                {/* Vertical Divider 2 */}
                <div className="h-8 w-[1px] bg-white/10" />

                {/* Pillar 3: Chat & Connect */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner">
                    <svg className="w-5 h-5 text-purple-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <circle cx="8" cy="10" r="0.8" fill="currentColor" stroke="none" />
                      <circle cx="12" cy="10" r="0.8" fill="currentColor" stroke="none" />
                      <circle cx="16" cy="10" r="0.8" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-200 text-center leading-tight mt-2">
                    Chat<br/>& Connect
                  </span>
                </div>

              </div>

            </div>

            {/* Bottom Action Buttons (Clean Mobile App Style) */}
            <div className="w-full max-w-[360px] space-y-3.5 z-20 pb-2 sm:pb-3">
              
              {/* 1. Continue to Login */}
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="w-full h-14 px-6 rounded-full bg-white text-[#150325] font-bold text-sm sm:text-base flex items-center justify-between shadow-[0_0_35px_rgba(236,72,153,0.5)] hover:shadow-[0_0_45px_rgba(236,72,153,0.7)] hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 group border border-white"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <LogIn className="w-5 h-5 text-[#140224]" />
                </div>
                <span className="flex-1 text-center font-bold text-[#140224] text-sm sm:text-base">
                  Continue to Login
                </span>
                <div className="w-6 h-6 flex items-center justify-end shrink-0">
                  <ChevronRight className="w-5 h-5 text-[#140224] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* 2. Continue as a guest */}
              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full h-14 px-6 rounded-full bg-[#180429]/80 border-2 border-[#D946EF]/80 hover:border-[#D946EF] text-white font-bold text-sm sm:text-base flex items-center justify-between shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] active:scale-[0.98] transition-all duration-200 backdrop-blur-md group"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors" />
                </div>
                <span className="flex-1 text-center font-bold text-white text-sm sm:text-base">
                  Continue as a guest
                </span>
                <div className="shrink-0">
                  <span className="px-3.5 py-1.5 rounded-full bg-[#8E1A8B] text-purple-100 text-xs font-semibold tracking-wide border border-pink-400/30">
                    Quick Play
                  </span>
                </div>
              </button>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* LOGIN MODAL / FORM                                       */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <div className="w-full space-y-5 relative z-10 animate-fade-in py-4 px-2">
            <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/30">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-fuchsia-400" />
                <span>Sign In with Email</span>
              </h2>
              <button 
                onClick={() => setAuthMode('welcome')}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-300 hover:text-white hover:bg-white/10 transition-colors"
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
                  className="w-full py-3 px-4 rounded-2xl bg-[#150424] border border-fuchsia-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
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
                  className="w-full py-3 px-4 rounded-2xl bg-[#150424] border border-fuchsia-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#8A2BE2] text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-3 border-t border-white/5">
              <span className="text-xs text-purple-300/70">Don't have an account yet? </span>
              <button 
                onClick={() => setAuthMode('register')}
                className="text-xs font-bold text-pink-400 hover:text-pink-300 hover:underline ml-1"
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
          <div className="w-full space-y-4 relative z-10 animate-fade-in py-3 px-2">
            <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/30">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
                <span>Create Your Account</span>
              </h2>
              <button 
                onClick={() => setAuthMode('welcome')}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-300 hover:text-white hover:bg-white/10 transition-colors"
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
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#150424] border border-fuchsia-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
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
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#150424] border border-fuchsia-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-200 block mb-1">
                  Choose Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400 text-xs font-bold">@</span>
                  <input
                    type="text"
                    placeholder="alex_92"
                    value={regHandle}
                    onChange={(e) => setRegHandle(e.target.value)}
                    className="w-full py-2.5 pl-8 pr-4 rounded-2xl bg-[#150424] border border-fuchsia-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
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
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#150424] border border-fuchsia-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#8A2BE2] text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-3 border-t border-white/5">
              <span className="text-xs text-purple-300/70">Already have an account? </span>
              <button 
                onClick={() => setAuthMode('login')}
                className="text-xs font-bold text-pink-400 hover:text-pink-300 hover:underline ml-1"
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
