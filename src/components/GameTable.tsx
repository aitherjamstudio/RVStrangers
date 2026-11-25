import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { resolveAvatarUrl } from '../utils/avatars';
import { Clock, X, Sparkles, Send, ArrowRight } from 'lucide-react';

export const GameTable: React.FC = () => {
  const { 
    selectedDeckTitle, 
    activeCards,
    setScreen, 
    isCardFlipped, 
    toggleCardFlip, 
    currentCardIndex, 
    nextCard, 
    currentAnswer, 
    setAnswer, 
    publishedAnswer, 
    submitAnswer, 
    reactions, 
    addReaction, 
    showToast,
    isDarkMode,
    currentUser,
  } = useGameStore();

  const [timer] = useState(84);

  const currentPrompt = activeCards[currentCardIndex]?.prompt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswer();
    if (currentAnswer.trim()) showToast('Answer saved for this session.');
  };

  if (!currentPrompt) {
    return (
      <div className="w-full max-w-md mx-auto py-12 text-center space-y-4">
        <p className="text-sm text-purple-200">No game card is loaded.</p>
        <button onClick={() => setScreen('dashboard')} className="px-5 py-2.5 rounded-full bg-primary border border-accent text-white text-xs font-bold">Back to decks</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-28 pt-2 transition-all">
      {/* Game Room Header Bar */}
      <div className="flex items-center justify-between py-2 border-b border-accent/25">
        <button
          onClick={() => setScreen('dashboard')}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-accent-light uppercase tracking-wider block">
            {selectedDeckTitle}
          </span>
          <span className="text-xs font-semibold opacity-80">
            Card {currentCardIndex + 1} of {activeCards.length}
          </span>
        </div>

        {/* 90s Turn Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs sm:text-sm font-bold shadow-sm">
          <Clock className="w-4 h-4" />
          <span>{timer}s</span>
        </div>
      </div>

      {/* Seating / Turn Indicator */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border ${
        isDarkMode 
          ? 'bg-[#2D0D4B] border-accent/30' 
          : 'bg-white border-primary/20 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-primary/40 border border-accent/40">
            <img 
              src={resolveAvatarUrl(currentUser?.avatar)}
              alt={currentUser?.name || 'Player'}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs sm:text-sm font-bold">You{currentUser ? ` (${currentUser.name})` : ''}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
        <span className="text-xs sm:text-sm font-bold text-accent-light">YOUR TURN</span>
      </div>

      {/* 3D CARD PERSPECTIVE STAGE (Responsive scaling: 280px on mobile to 340px on tablet/desktop) */}
      <div className="relative w-full h-[320px] sm:h-[370px] perspective-1000 flex items-center justify-center my-3">
        {/* Floating Reaction Emojis */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="floating-reaction text-4xl sm:text-5xl"
              style={{ left: `${r.left}%`, bottom: '20px' }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Flippable Card */}
        <div
          onClick={toggleCardFlip}
          className={`w-full max-w-[285px] sm:max-w-[340px] h-[305px] sm:h-[355px] relative transform-style-3d transition-transform duration-700 cursor-pointer shadow-2xl rounded-3xl ${
            isCardFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* CARD BACK (Face Down - Rabble & Sparks Celestial Arch) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-between bg-gradient-to-br from-[#2D0A4E] via-[#481278] to-[#1A052B] border-2 border-accent/70 shadow-[0_12px_35px_rgba(192,38,211,0.4)]">
            <div className="w-full h-full border border-purple-300/25 rounded-2xl p-4 flex flex-col items-center justify-between">
              {/* Top Motif */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-accent-light uppercase">
                  RVSTRANGERS
                </span>
                <div className="w-16 sm:w-20 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent mt-1" />
              </div>

              {/* Center Celestial Arch & Pulsing Star */}
              <div className="flex flex-col items-center">
                <div className="w-18 sm:w-22 h-26 sm:h-32 rounded-t-full border border-accent-light/50 flex items-center justify-center relative shadow-inner">
                  <span className="text-3xl sm:text-4xl text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse">
                    ✦
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-white mt-2">
                  PRESENT
                </span>
              </div>

              {/* Tap to Flip Prompt */}
              <div className="px-4 py-1.5 rounded-full bg-accent/30 border border-accent text-xs font-bold text-white animate-bounce shadow-md">
                ✨ Tap Card to Flip
              </div>
            </div>
          </div>

          {/* CARD FRONT (Face Up - Prompt Question in Comfortaa) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between bg-white text-textPrimary shadow-2xl border-2 border-accent">
            <div className="w-full flex items-center justify-between border-b border-purple-900/10 pb-2">
              <span className="text-xs font-bold tracking-widest text-primary">
                PROMPT #{currentCardIndex + 1}
              </span>
              <span className="text-base">🌌</span>
            </div>

            {/* Prompt Text in Comfortaa */}
            <div className="my-auto text-center px-2">
              <p className="text-base sm:text-lg font-bold leading-relaxed text-textPrimary">
                "{currentPrompt}"
              </p>
            </div>

            <div className="w-full flex items-center justify-between pt-2 border-t border-purple-900/10 text-[10px] sm:text-xs text-textSecondary font-bold">
              <span>{selectedDeckTitle}</span>
              <span>Reflect & Answer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Interaction Stage Below Card */}
      {!isCardFlipped ? (
        /* State 1: Card is face down */
        <div className={`p-4 sm:p-5 rounded-3xl border text-center space-y-2.5 ${
          isDarkMode ? 'bg-[#2D0D4B]/60 border-accent/30' : 'bg-white border-primary/20 shadow-sm'
        }`}>
          <p className="text-xs sm:text-sm opacity-80 font-medium">
            It's your turn! Tap the card above to reveal the prompt.
          </p>
          <button
            onClick={toggleCardFlip}
            className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-lg shadow-accent/25 hover:opacity-95 transition-all"
          >
            Flip Card Now
          </button>
        </div>
      ) : !publishedAnswer ? (
        /* State 2: Answer Input Field */
        <form onSubmit={handleSubmit} className={`p-4 sm:p-5 rounded-3xl border space-y-3 ${
          isDarkMode ? 'bg-[#2D0D4B]/60 border-accent/30' : 'bg-white border-primary/20 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span>Your Answer:</span>
            <span className="text-accent">{currentAnswer.length}/300</span>
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Type your honest answer here..."
            className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#140423] border border-accent/40 text-white text-xs sm:text-sm placeholder-purple-400/40 focus:outline-none focus:border-accent"
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-95"
            >
              <span>Submit Answer</span>
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextCard}
              className="px-5 py-3 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-purple-200 hover:text-white transition-all"
            >
              Pass
            </button>
          </div>
        </form>
      ) : (
        /* State 3: Published Answer & Emojis Reactions */
        <div className={`p-4 sm:p-5 rounded-3xl border space-y-3.5 ${
          isDarkMode ? 'bg-[#2D0D4B]/60 border-accent/30' : 'bg-white border-primary/20 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Answer saved
            </span>
            <span className="text-accent-light text-xs">Tap emojis to react:</span>
          </div>

          {/* Published Answer Bubble */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1E0733] border border-accent/30 text-xs sm:text-sm italic text-white leading-relaxed">
            <span className="font-bold not-italic text-accent-light">You: </span>
            <span>"{publishedAnswer}"</span>
          </div>

          {/* Reaction Bar */}
          <div className="flex items-center justify-around py-2">
            {['❤️', '😂', '😮', '👏', '🔥'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => addReaction(emoji)}
                className="text-2xl sm:text-3xl p-2 rounded-2xl hover:bg-white/10 active:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            onClick={nextCard}
            className="w-full py-3 rounded-full bg-primary/60 hover:bg-primary border border-accent/50 text-xs sm:text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
          >
            <span>Next Card</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
