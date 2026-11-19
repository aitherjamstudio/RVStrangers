import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { LogIn, ArrowRight, X, Sparkles, User, ChevronRight } from 'lucide-react';

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
    <div className="w-full min-h-[92vh] flex flex-col items-center justify-center py-4 px-2 sm:px-4 select-none font-comfortaa">
      
      {/* Mobile Card Frame Container */}
      <div className="relative w-full max-w-[430px] min-h-[850px] sm:min-h-[890px] bg-gradient-to-b from-[#130222] via-[#0D011A] to-[#07000E] rounded-[36px] sm:rounded-[44px] overflow-hidden flex flex-col justify-between items-center px-5 sm:px-6 pt-8 pb-5 shadow-2xl border border-white/10 sm:border-purple-800/30">

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
          <>
            {/* Top & Middle Section */}
            <div className="w-full flex flex-col items-center z-10 pt-2">
              
              {/* App Icon / Central Hero Badge */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mt-3">
                {/* Intense Outer Neon Blur Glow */}
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-[#FF2E93] via-[#D946EF] to-[#8B5CF6] blur-xl opacity-80 animate-pulse" />
                
                {/* Dark Glass Squircle Icon Container */}
                <div className="relative w-full h-full rounded-[28px] sm:rounded-[30px] bg-gradient-to-b from-[#2B0B47]/95 via-[#18042B]/95 to-[#120220] border-2 border-fuchsia-400/60 shadow-[0_0_35px_rgba(236,72,153,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-center overflow-hidden backdrop-blur-2xl">
                  
                  {/* Glass Top Highlight */}
                  <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-white/15 blur-md pointer-events-none" />

                  {/* Back Playing Card (Angled Left, Purple Gradient) */}
                  <div className="absolute w-[50px] h-[72px] sm:w-[54px] sm:h-[76px] rounded-xl bg-gradient-to-br from-[#8A2BE2] via-[#9B30FF] to-[#6A0DAD] border border-fuchsia-300/50 shadow-[0_0_14px_rgba(168,85,247,0.6)] -rotate-[16deg] -translate-x-2.5 -translate-y-0.5" />

                  {/* Front Playing Card (Angled Right with Golden Star) */}
                  <div className="absolute w-[50px] h-[72px] sm:w-[54px] sm:h-[76px] rounded-xl bg-gradient-to-br from-[#E026D8] via-[#FF2E93] to-[#C026D3] border-2 border-pink-200/80 shadow-[0_0_20px_rgba(236,72,153,0.8)] rotate-[15deg] translate-x-2.5 translate-y-0.5 flex items-center justify-center">
                    {/* Golden 4-point star */}
                    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)]" fill="currentColor">
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
                    </svg>
                  </div>

                </div>
              </div>

              {/* Title & Tagline */}
              <div className="text-center mt-5 sm:mt-6">
                <h1 className="text-3xl sm:text-4xl font-black italic tracking-tight">
                  <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">RV</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3EA5] via-[#F43F9E] to-[#E026D8] drop-shadow-[0_0_20px_rgba(244,63,158,0.6)]">Strangers</span>
                </h1>
                <p className="text-purple-100/85 text-xs sm:text-sm font-medium tracking-wide mt-2">
                  Built for meaningful connections.
                </p>

                {/* Delicate Glowing Curved Line / Arc */}
                <div className="relative w-36 h-3 mx-auto mt-2 flex items-center justify-center overflow-hidden pointer-events-none">
                  <div className="w-32 h-6 rounded-full border-t-2 border-fuchsia-500/80 shadow-[0_0_12px_#D946EF] blur-[0.5px]" />
                </div>
              </div>

              {/* 3 Feature Pillars */}
              <div className="flex items-center justify-between w-full max-w-[340px] px-2 mt-6 mb-7">
                
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

              {/* Main Action Buttons */}
              <div className="w-full max-w-[360px] space-y-3.5">
                
                {/* 1. Continue with Google */}
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full h-14 px-6 rounded-full bg-white text-[#150325] font-bold text-sm sm:text-base flex items-center justify-between shadow-[0_0_35px_rgba(236,72,153,0.5)] hover:shadow-[0_0_45px_rgba(236,72,153,0.7)] hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 group border border-white"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                  </div>
                  <span className="flex-1 text-center font-bold text-[#140224] text-sm sm:text-base">
                    Continue with Google
                  </span>
                  <div className="w-6 h-6 flex items-center justify-end shrink-0">
                    <ChevronRight className="w-5 h-5 text-[#140224] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 2. Continue as Guest */}
                <button
                  type="button"
                  onClick={continueAsGuest}
                  className="w-full h-14 px-6 rounded-full bg-[#180429]/80 border-2 border-[#D946EF]/80 hover:border-[#D946EF] text-white font-bold text-sm sm:text-base flex items-center justify-between shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] active:scale-[0.98] transition-all duration-200 backdrop-blur-md group"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors" />
                  </div>
                  <span className="flex-1 text-center font-bold text-white text-sm sm:text-base">
                    Continue as Guest
                  </span>
                  <div className="shrink-0">
                    <span className="px-3.5 py-1.5 rounded-full bg-[#8E1A8B] text-purple-100 text-xs font-semibold tracking-wide border border-pink-400/30">
                      Quick Play
                    </span>
                  </div>
                </button>

              </div>

              {/* Discreet Email Sign-in Options (Preserving Functionality) */}
              <div className="pt-2 text-[11px] text-purple-300/60 flex items-center justify-center gap-1.5 font-medium">
                <span>Prefer email?</span>
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-pink-400 hover:text-pink-300 font-semibold underline underline-offset-2 transition-colors"
                >
                  Log In
                </button>
                <span>•</span>
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-pink-400 hover:text-pink-300 font-semibold underline underline-offset-2 transition-colors"
                >
                  Sign Up
                </button>
              </div>

            </div>

            {/* Bottom Landscape Decoration & Pagination */}
            <div className="relative w-full max-w-[380px] flex flex-col items-center mt-5">
              
              {/* Backlight Glow Behind Hills */}
              <div className="absolute top-1 w-56 h-20 bg-gradient-to-t from-[#FF2E93] via-[#D946EF]/50 to-transparent rounded-full blur-2xl opacity-70 pointer-events-none" />

              {/* Two Mini Cards on Hill Crest */}
              <div className="relative z-10 flex items-center justify-center -space-x-2 pt-2 mb-1">
                {/* Radiating Energy Rays above Left Card */}
                <div className="absolute -top-3.5 left-4 flex gap-1 items-end pointer-events-none">
                  <span className="w-0.5 h-2 bg-pink-300 rounded-full -rotate-45 transform" />
                  <span className="w-0.5 h-2.5 bg-pink-300 rounded-full" />
                  <span className="w-0.5 h-2 bg-pink-300 rounded-full rotate-45 transform" />
                </div>

                {/* Left Mini Card (Star) */}
                <div className="w-8 h-11 rounded-lg bg-gradient-to-br from-[#8A2BE2] to-[#B026FF] border border-pink-300/40 shadow-[0_0_14px_rgba(217,70,239,0.6)] -rotate-12 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-pink-100" fill="currentColor">
                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
                  </svg>
                </div>

                {/* Right Mini Card (Heart) */}
                <div className="w-8 h-11 rounded-lg bg-gradient-to-br from-[#D946EF] to-[#FF007A] border border-pink-200/60 shadow-[0_0_14px_rgba(236,72,153,0.7)] rotate-12 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-white" stroke="none">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>

              {/* Rolling Dunes Silhouette SVG */}
              <div className="w-full overflow-hidden leading-none relative z-10">
                <svg viewBox="0 0 400 70" className="w-full h-14" preserveAspectRatio="none">
                  {/* Back Dune Layer */}
                  <path d="M0,45 Q120,15 200,30 T400,35 L400,70 L0,70 Z" fill="#18042B" opacity="0.85" />
                  {/* Front Dune Layer */}
                  <path d="M0,52 Q150,25 240,40 T400,48 L400,70 L0,70 Z" fill="#07000E" />
                </svg>
              </div>

              {/* 3 Pagination Dots */}
              <div className="flex items-center justify-center gap-2 pt-2 pb-1 z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] shadow-[0_0_8px_#FF2E93]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/40" />
              </div>

            </div>
          </>
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
