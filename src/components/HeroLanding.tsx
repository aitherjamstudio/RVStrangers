import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ShieldCheck, Sparkles, Zap, ChevronRight } from 'lucide-react';

export const HeroLanding: React.FC = () => {
  const { setScreen, isDarkMode } = useGameStore();

  return (
    <div className="relative w-full overflow-hidden py-8 px-4 flex flex-col items-center text-center">
      {/* Background Neon Wavy Glows */}
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 blur-3xl pointer-events-none neon-wave" />
      <div className="absolute bottom-10 left-1/4 w-72 h-72 rounded-full bg-gradient-to-tr from-primary/35 to-accent/15 blur-3xl pointer-events-none" />

      {/* Main Title Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/30 border border-accent/40 text-accent-light text-xs font-bold mb-4 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        <span>Welcome to Rvstrangers</span>
      </div>

      {/* Hero Headline from Styleboard */}
      <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight max-w-xl">
        Meet • Talk • Play <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-light via-accent to-primary-light drop-shadow-[0_0_20px_rgba(192,38,211,0.5)]">
          with Strangers
        </span>
      </h1>

      <p className={`text-xs sm:text-sm mt-4 max-w-md mx-auto leading-relaxed ${
        isDarkMode ? 'text-purple-200/80' : 'text-textSecondary'
      }`}>
        A fun and safe space for real conversations, playful cards, and new connections.
      </p>

      {/* CTA Buttons from Styleboard */}
      <div className="flex items-center justify-center gap-3.5 mt-6 z-20">
        <button
          onClick={() => setScreen('dashboard')}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-accent/30 transition-all hover:scale-105 active:scale-95"
        >
          <span>Start Playing</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setScreen('game')}
          className="px-6 py-3 rounded-full border-2 border-accent text-white hover:bg-accent/15 text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95"
        >
          How It Works
        </button>
      </div>

      {/* 3 FLOATING NEON CARDS (Styleboard Centerpiece) */}
      <div className="relative w-full max-w-sm h-64 my-6 flex items-center justify-center z-20">
        {/* Left Card: 💬 Chat */}
        <div 
          onClick={() => setScreen('game')}
          className="absolute left-4 w-28 h-40 rounded-2xl bg-gradient-to-b from-[#2F0E4D] to-[#150324] border border-accent/40 shadow-[0_12px_30px_rgba(0,0,0,0.6)] p-3 flex flex-col items-center justify-center hero-card-1 cursor-pointer hover:border-accent transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-3xl drop-shadow-[0_0_10px_rgba(192,38,211,0.7)]">
            💬
          </div>
          <span className="text-[11px] font-bold text-accent-light mt-3">Talk</span>
        </div>

        {/* Center Card: 💖 Connect */}
        <div 
          onClick={() => setScreen('game')}
          className="absolute w-34 h-48 rounded-2xl bg-gradient-to-b from-[#3D1063] to-[#1E0533] border-2 border-accent shadow-[0_15px_45px_rgba(192,38,211,0.5)] p-3 flex flex-col items-center justify-center hero-card-2 z-10 cursor-pointer hover:scale-110 transition-transform"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/30 flex items-center justify-center text-4xl drop-shadow-[0_0_16px_rgba(232,121,249,0.9)]">
            💖
          </div>
          <span className="text-xs font-bold text-white mt-3 tracking-wide">Connect</span>
          <span className="text-[9px] text-accent-light mt-0.5">Flip & Answer</span>
        </div>

        {/* Right Card: 🔥 Play */}
        <div 
          onClick={() => setScreen('game')}
          className="absolute right-4 w-28 h-40 rounded-2xl bg-gradient-to-b from-[#2F0E4D] to-[#150324] border border-accent/40 shadow-[0_12px_30px_rgba(0,0,0,0.6)] p-3 flex flex-col items-center justify-center hero-card-3 cursor-pointer hover:border-accent transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]">
            🔥
          </div>
          <span className="text-[11px] font-bold text-amber-300 mt-3">Play</span>
        </div>
      </div>

      {/* Feature Pillar Badges */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-4 z-20">
        <div className={`p-3 rounded-2xl border text-center transition-all ${
          isDarkMode 
            ? 'bg-white/5 border-white/5' 
            : 'bg-white border-primary/10 shadow-sm'
        }`}>
          <ShieldCheck className="w-5 h-5 mx-auto text-accent" />
          <h4 className="text-xs font-bold mt-1.5">Safe & Curated</h4>
          <p className="text-[9px] opacity-70 mt-0.5">EULA Protected</p>
        </div>

        <div className={`p-3 rounded-2xl border text-center transition-all ${
          isDarkMode 
            ? 'bg-white/5 border-white/5' 
            : 'bg-white border-primary/10 shadow-sm'
        }`}>
          <Sparkles className="w-5 h-5 mx-auto text-gold" />
          <h4 className="text-xs font-bold mt-1.5">150+ Prompts</h4>
          <p className="text-[9px] opacity-70 mt-0.5">5 Themed Decks</p>
        </div>

        <div className={`p-3 rounded-2xl border text-center transition-all ${
          isDarkMode 
            ? 'bg-white/5 border-white/5' 
            : 'bg-white border-primary/10 shadow-sm'
        }`}>
          <Zap className="w-5 h-5 mx-auto text-diamond" />
          <h4 className="text-xs font-bold mt-1.5">Instant Mesh</h4>
          <p className="text-[9px] opacity-70 mt-0.5">Online & Hotspot</p>
        </div>
      </div>
    </div>
  );
};
