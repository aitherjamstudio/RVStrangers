import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { MessageSquare, Users, Bell } from 'lucide-react';

export const TopNav: React.FC = () => {
  const { setScreen, coins, diamonds, showToast, currentUser, isGuest } = useGameStore();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#11031D]/90 backdrop-blur-xl border-b border-white/5 py-2.5 sm:py-3 flex items-center justify-between gap-2 select-none transition-all">
      {/* Left: User Avatar (Profile Button, no Hi/Username text) */}
      <button 
        onClick={() => setScreen('friends')}
        className="flex items-center gap-2 cursor-pointer group focus:outline-none shrink-0"
        title={currentUser ? `${currentUser.name} (@${currentUser.handle})` : "View Profile"}
        aria-label="View Profile"
      >
        <div className="relative">
          <img 
            src={currentUser?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=alex"} 
            alt={currentUser?.name || "Player"} 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#351057] p-0.5 border-2 border-accent shadow-md group-hover:scale-105 active:scale-95 transition-all"
          />
          <span className={`absolute bottom-0 right-0 w-3 h-3 ${isGuest ? 'bg-amber-400' : 'bg-emerald-500'} border-2 border-[#1A052B] rounded-full shadow`} />
        </div>
        {isGuest && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold hidden sm:inline">
            GUEST
          </span>
        )}
      </button>

      {/* Right: Currencies & Action Badges in one horizontal line */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Coin Wallet Pill */}
        <button 
          onClick={() => setScreen('store')}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#270E40] border border-amber-400/40 text-xs sm:text-sm font-bold text-amber-300 hover:border-amber-400 transition-all shadow-sm hover:scale-105 active:scale-95 shrink-0"
          title="Store & Coins"
        >
          <span className="text-xs sm:text-sm">🪙</span>
          <span className="font-comfortaa">{coins.toLocaleString()}</span>
          <span className="text-amber-400/80 font-normal text-xs sm:text-sm leading-none">+</span>
        </button>

        {/* Diamond Wallet Pill */}
        <button 
          onClick={() => setScreen('store')}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#181F42] border border-sky-400/40 text-xs sm:text-sm font-bold text-sky-300 hover:border-sky-400 transition-all shadow-sm hover:scale-105 active:scale-95 shrink-0"
          title="Buy Diamonds"
        >
          <span className="text-xs sm:text-sm">💎</span>
          <span className="font-comfortaa">{diamonds.toLocaleString()}</span>
          <span className="text-sky-400/80 font-normal text-xs sm:text-sm leading-none">+</span>
        </button>

        {/* Action Badges Group */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Chat Icon */}
          <button 
            onClick={() => {
              if (isGuest) {
                showToast('Direct chat is reserved for registered players. Continue with Google!');
                return;
              }
              setScreen('friends');
            }}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 shrink-0"
            title="Messages"
            aria-label="Messages"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Friends Icon */}
          <button 
            onClick={() => setScreen('friends')}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 shrink-0"
            title="Friends"
            aria-label="Friends"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Notifications Icon */}
          <button 
            onClick={() => {
              if (isGuest) {
                showToast('Notifications are reserved for registered players.');
                return;
              }
              showToast('No new notifications.');
            }}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 shrink-0"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
