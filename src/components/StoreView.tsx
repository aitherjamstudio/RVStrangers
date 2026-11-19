import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ArrowLeft, Video, ShieldAlert } from 'lucide-react';

export const StoreView: React.FC = () => {
  const { 
    setScreen, 
    coins, 
    diamonds, 
    addCoins, 
    addDiamonds, 
    spendCoins, 
    spendDiamonds, 
    unlockDeckInD1,
    showToast,
    isDarkMode,
    isGuest,
    loginWithGoogle 
  } = useGameStore();

  const handleWatchAd = async () => {
    if (isGuest) {
      showToast("Rewarded ads & coin earnings are reserved for registered accounts. Please sign in with Google.");
      return;
    }
    await addCoins(50);
  };

  const handleBuyDiamonds = async (amount: number, price: string) => {
    if (isGuest) {
      showToast("In-app purchases are reserved for registered accounts. Please sign in with Google.");
      return;
    }
    await addDiamonds(amount, price);
  };

  const handleUnlockCoinDeck = async (deckId: string, title: string, cost: number) => {
    const success = await unlockDeckInD1(deckId);
    if (!success) {
      if (spendCoins(cost)) {
        showToast(`Deck Unlocked: ${title} (-${cost} Coins)`);
      } else {
        showToast("Not enough coins! Watch an ad or play matches.");
      }
    }
  };

  const handleUnlockDiamondDeck = async (deckId: string, title: string, cost: number) => {
    const success = await unlockDeckInD1(deckId);
    if (!success) {
      if (spendDiamonds(cost)) {
        showToast(`Premium Deck Unlocked: ${title} (-${cost} Diamonds)`);
      } else {
        showToast("Not enough diamonds! Buy a diamond pack below.");
      }
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-3xl lg:max-w-5xl mx-auto space-y-6 pb-28 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-accent/20">
        <button
          onClick={() => setScreen('dashboard')}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">Store & Currencies</h2>
        <div className="w-9" />
      </div>

      {/* Guest Lock Banner */}
      {isGuest && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-300">Guest Mode (Purchases Disabled)</h4>
              <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                In-app diamond purchases and rewarded coin bonuses require a registered account. Sign in with Google to enable purchases and save across devices.
              </p>
            </div>
          </div>
          <button
            onClick={() => loginWithGoogle()}
            className="px-4 py-2 rounded-full bg-white hover:bg-gray-100 text-[#1F1726] text-xs font-bold shrink-0 shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>
        </div>
      )}

      {/* Wallet Balance Hero Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#3D0C63] to-[#1E0533] border border-accent/40 flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[11px] sm:text-xs text-accent-light font-bold">Your Balance</span>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-sm sm:text-lg font-bold text-gold flex items-center gap-1.5">
              <span>🪙</span> {coins.toLocaleString()}
            </span>
            <span className="text-sm sm:text-lg font-bold text-diamond flex items-center gap-1.5">
              <span>💎</span> {diamonds.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={handleWatchAd}
          className="px-4 py-2 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs sm:text-sm font-bold hover:bg-gold/30 flex items-center gap-2 transition-all shadow-sm"
        >
          <Video className="w-4 h-4" />
          <span>+50 Coins</span>
        </button>
      </div>

      {/* Buy Diamonds (In-App Purchase Tier Matrix from Blueprint) */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-diamond uppercase tracking-wider flex items-center gap-1.5">
          <span>💎</span> In-App Purchases (Diamonds)
        </h3>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* Pack 1 */}
          <div
            onClick={() => handleBuyDiamonds(10, '$0.99')}
            className={`p-3 sm:p-4 rounded-2xl border text-center cursor-pointer hover:border-diamond transition-all ${
              isDarkMode ? 'bg-[#230C39]/80 border-diamond/30' : 'bg-white border-primary/10 shadow-sm'
            }`}
          >
            <span className="text-2xl sm:text-3xl">💎</span>
            <div className="text-xs sm:text-sm font-bold text-white mt-1">10 Pack</div>
            <div className="text-[9px] sm:text-[10px] text-diamond">Handful</div>
            <div className="mt-2 py-1 sm:py-1.5 rounded-xl bg-diamond/20 text-diamond text-xs sm:text-sm font-bold">
              $0.99
            </div>
          </div>

          {/* Pack 2 (Popular) */}
          <div
            onClick={() => handleBuyDiamonds(60, '$4.99')}
            className={`p-3 sm:p-4 rounded-2xl border text-center cursor-pointer hover:border-diamond relative transition-all ${
              isDarkMode ? 'bg-[#230C39]/80 border-diamond/50' : 'bg-white border-primary/10 shadow-sm'
            }`}
          >
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider">
              POPULAR
            </span>
            <span className="text-2xl sm:text-3xl">💎</span>
            <div className="text-xs sm:text-sm font-bold text-white mt-1">60 Pack</div>
            <div className="text-[9px] sm:text-[10px] text-diamond">+20% Bonus</div>
            <div className="mt-2 py-1 sm:py-1.5 rounded-xl bg-diamond text-[#1A052B] text-xs sm:text-sm font-bold shadow-md">
              $4.99
            </div>
          </div>

          {/* Pack 3 */}
          <div
            onClick={() => handleBuyDiamonds(150, '$9.99')}
            className={`p-3 sm:p-4 rounded-2xl border text-center cursor-pointer hover:border-diamond transition-all ${
              isDarkMode ? 'bg-[#230C39]/80 border-diamond/30' : 'bg-white border-primary/10 shadow-sm'
            }`}
          >
            <span className="text-2xl sm:text-3xl">💎</span>
            <div className="text-xs sm:text-sm font-bold text-white mt-1">150 Pack</div>
            <div className="text-[9px] sm:text-[10px] text-diamond">+50% Bonus</div>
            <div className="mt-2 py-1 sm:py-1.5 rounded-xl bg-diamond/20 text-diamond text-xs sm:text-sm font-bold">
              $9.99
            </div>
          </div>
        </div>
      </div>

      {/* Premium Decks (Diamonds) */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
          <span>👑</span> Premium Decks (Diamonds)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#230C39]/80 border border-gold/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🧗</span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-white">Self Discovery</h5>
                <p className="text-[10px] sm:text-xs text-purple-300">40 introspective questions</p>
                <span className="text-[10px] sm:text-xs text-gold font-bold">💎 20 Diamonds</span>
              </div>
            </div>
            <button
              onClick={() => handleUnlockDiamondDeck('deck_self_discovery', 'Self Discovery', 20)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold hover:bg-gold/30 transition-all shrink-0 ml-2"
            >
              Unlock
            </button>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#230C39]/80 border border-gold/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">💑</span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-white">Couples Talk</h5>
                <p className="text-[10px] sm:text-xs text-purple-300">50 romantic questions</p>
                <span className="text-[10px] sm:text-xs text-gold font-bold">💎 25 Diamonds</span>
              </div>
            </div>
            <button
              onClick={() => handleUnlockDiamondDeck('deck_couples_talk', 'Couples Talk', 25)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold hover:bg-gold/30 transition-all shrink-0 ml-2"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>

      {/* Standard Decks (Coins) */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-accent-light uppercase tracking-wider flex items-center gap-1.5">
          <span>🪙</span> Standard Decks (Coins)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#230C39]/80 border border-accent/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">❓</span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-white">What If? Scenarios</h5>
                <p className="text-[10px] sm:text-xs text-purple-300">35 fun hypothetical questions</p>
                <span className="text-[10px] sm:text-xs text-gold font-bold">🪙 200 Coins</span>
              </div>
            </div>
            <button
              onClick={() => handleUnlockCoinDeck('deck_what_if', 'What If? Scenarios', 200)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/40 border border-accent/40 text-accent-light text-xs font-bold hover:bg-primary transition-all shrink-0 ml-2"
            >
              Unlock
            </button>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#230C39]/80 border border-accent/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🌿</span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-white">Work & Life Balance</h5>
                <p className="text-[10px] sm:text-xs text-purple-300">30 grounding questions</p>
                <span className="text-[10px] sm:text-xs text-gold font-bold">🪙 200 Coins</span>
              </div>
            </div>
            <button
              onClick={() => handleUnlockCoinDeck('deck_work_life', 'Work & Life Balance', 200)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/40 border border-accent/40 text-accent-light text-xs font-bold hover:bg-primary transition-all shrink-0 ml-2"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
