import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ArrowLeft, Radio } from 'lucide-react';

export const MatchmakingModal: React.FC = () => {
  const { setScreen } = useGameStore();

  return (
    <div className="w-full max-w-md sm:max-w-xl mx-auto space-y-5 pb-28 pt-2">
      <div className="flex items-center justify-between py-2 border-b border-accent/20">
        <button onClick={() => setScreen('dashboard')} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10" aria-label="Back to play">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">Online Matchmaking</h2>
        <div className="w-9" />
      </div>
      <section className="p-6 sm:p-8 rounded-3xl bg-[#230C39]/80 border border-accent/35 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent-light">
          <Radio className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-white">Matchmaking is not live yet</h3>
        <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">There are no fabricated opponents, rooms, or search results here. Online play will appear once real-time matchmaking is connected.</p>
        <button onClick={() => setScreen('dashboard')} className="px-5 py-2.5 rounded-full bg-primary border border-accent text-white text-xs font-bold">Back to decks</button>
      </section>
    </div>
  );
};
