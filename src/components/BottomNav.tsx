import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Layers, ShoppingBag, User, Gamepad2 } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentScreen, setScreen } = useGameStore();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none pb-2 sm:pb-3 px-3">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl bg-[#140423]/95 backdrop-blur-2xl border border-accent/25 rounded-3xl shadow-2xl shadow-purple-950/80 px-4 sm:px-8 py-2 sm:py-2.5 flex items-center justify-between pointer-events-auto transition-all">
        {/* 1. Play Tab */}
        <button
          onClick={() => setScreen('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentScreen === 'dashboard' ? 'text-white' : 'text-purple-300/60 hover:text-white'
          }`}
        >
          <div className={`px-4 sm:px-5 py-1 sm:py-1.5 rounded-full transition-all ${
            currentScreen === 'dashboard' 
              ? 'bg-accent text-white shadow-md shadow-accent/40 scale-105' 
              : 'hover:bg-white/5'
          }`}>
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Play</span>
        </button>

        {/* 2. My Cards Tab */}
        <button
          onClick={() => setScreen('my-cards')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentScreen === 'my-cards' ? 'text-white' : 'text-purple-300/60 hover:text-white'
          }`}
        >
          <div className={`px-4 sm:px-5 py-1 sm:py-1.5 rounded-full transition-all ${
            currentScreen === 'my-cards' 
              ? 'bg-accent text-white shadow-md shadow-accent/40 scale-105' 
              : 'hover:bg-white/5'
          }`}>
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">My Cards</span>
        </button>

        {/* 3. Store Tab */}
        <button
          onClick={() => setScreen('store')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentScreen === 'store' ? 'text-white' : 'text-purple-300/60 hover:text-white'
          }`}
        >
          <div className={`px-4 sm:px-5 py-1 sm:py-1.5 rounded-full transition-all ${
            currentScreen === 'store' 
              ? 'bg-accent text-white shadow-md shadow-accent/40 scale-105' 
              : 'hover:bg-white/5'
          }`}>
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Store</span>
        </button>

        {/* 4. Profile Tab */}
        <button
          onClick={() => setScreen('friends')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentScreen === 'friends' ? 'text-white' : 'text-purple-300/60 hover:text-white'
          }`}
        >
          <div className={`px-4 sm:px-5 py-1 sm:py-1.5 rounded-full transition-all ${
            currentScreen === 'friends' 
              ? 'bg-accent text-white shadow-md shadow-accent/40 scale-105' 
              : 'hover:bg-white/5'
          }`}>
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Profile</span>
        </button>
      </div>
    </nav>
  );
};
