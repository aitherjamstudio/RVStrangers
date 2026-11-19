import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Sun, Moon, MessageSquare, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentScreen, setScreen, isDarkMode, toggleTheme, coins, diamonds } = useGameStore();

  return (
    <header className={`w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between rounded-2xl transition-all duration-300 ${
      isDarkMode 
        ? 'bg-[#230C39]/80 backdrop-blur-xl border border-accent/25 shadow-lg shadow-purple-950/40 text-white' 
        : 'bg-white/90 backdrop-blur-xl border border-primary/20 shadow-md text-textPrimary'
    }`}>
      {/* Brand & Logo */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => setScreen('landing')}
      >
        <img 
          src="/no bg logo.png" 
          alt="Rvstrangers" 
          className="w-9 h-9 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(192,38,211,0.6)]" 
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight">RVStranger?</span>
            <span className="px-1.5 py-0.2 rounded-full bg-accent/20 text-accent text-[9px] font-bold">
              BETA
            </span>
          </div>
          <span className="text-[10px] text-accent font-medium">Meet • Talk • Play</span>
        </div>
      </div>

      {/* Nav Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-1">
        <button
          onClick={() => setScreen('landing')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentScreen === 'landing' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setScreen('dashboard')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentScreen === 'dashboard' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setScreen('game')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentScreen === 'game' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          Play Game
        </button>
        <button
          onClick={() => setScreen('friends')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentScreen === 'friends' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setScreen('store')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentScreen === 'store' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          Store
        </button>
      </nav>

      {/* Wallets & Action Badges */}
      <div className="flex items-center gap-2">
        {/* Coins Pill */}
        <div 
          onClick={() => setScreen('store')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#270E40] border border-gold/40 text-xs font-bold text-gold cursor-pointer hover:border-gold transition-all shadow-sm"
        >
          <span>🪙</span>
          <span>{coins.toLocaleString()}</span>
          <span className="text-gold/70 font-normal">+</span>
        </div>

        {/* Diamonds Pill */}
        <div 
          onClick={() => setScreen('store')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#181F42] border border-diamond/40 text-xs font-bold text-diamond cursor-pointer hover:border-diamond transition-all shadow-sm"
        >
          <span>💎</span>
          <span>{diamonds.toLocaleString()}</span>
          <span className="text-diamond/70 font-normal">+</span>
        </div>

        {/* Quick Actions */}
        <button 
          onClick={() => setScreen('friends')}
          className="relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">2</span>
        </button>

        <button 
          onClick={() => setScreen('friends')}
          className="relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 transition-all"
        >
          <Users className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent text-[9px] font-bold text-white rounded-full flex items-center justify-center">3</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? "Switch to Light Mode (#F6EEFF)" : "Switch to Dark Mode (#1A052B)"}
          className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all ml-1"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
