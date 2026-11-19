import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import { 
  Layers, 
  Play, 
  Sparkles, 
  CheckCircle, 
  ArrowLeft,
  Flame,
  Search,
  BookOpen
} from 'lucide-react';

interface OwnedDeck {
  id: string;
  title: string;
  category: string;
  cardCount: number;
  completedCount: number;
  icon: string;
  gradient: string;
  description: string;
  tags: string[];
}

const OWNED_DECKS: OwnedDeck[] = [
  {
    id: 'deep-talks',
    title: 'Deep Conversations',
    category: 'Introspective',
    cardCount: 30,
    completedCount: 22,
    icon: '🌅',
    gradient: 'from-[#5B0DAD] via-[#7B19D4] to-[#430680]',
    description: 'Thought-provoking prompts on values, vulnerability, core dreams, and reflections.',
    tags: ['Philosophy', 'Deep', 'Soulful']
  },
  {
    id: 'relationships',
    title: 'Relationships',
    category: 'Couples & Love',
    cardCount: 35,
    completedCount: 15,
    icon: '💖',
    gradient: 'from-[#7B1B77] via-[#9C27B0] to-[#4A0E47]',
    description: 'Intimate questions to spark closeness, mutual appreciation, and emotional honesty.',
    tags: ['Romance', 'Connection', 'Warmth']
  },
  {
    id: 'mind-psychology',
    title: 'Mind & Psychology',
    category: 'Personal Growth',
    cardCount: 30,
    completedCount: 8,
    icon: '🧠',
    gradient: 'from-[#351578] via-[#512DA8] to-[#200D47]',
    description: 'Questions uncovering how you think, react, dream, and perceive the world around you.',
    tags: ['Mindset', 'Growth', 'Perspective']
  },
  {
    id: 'friends-fun',
    title: 'Friends & Fun',
    category: 'Social Icebreakers',
    cardCount: 40,
    completedCount: 31,
    icon: '🎉',
    gradient: 'from-[#D9480F] via-[#E85D04] to-[#9D0208]',
    description: 'Lighthearted, hilarious, and surprising scenarios guaranteed to start lively banter.',
    tags: ['Humor', 'Stories', 'Party']
  },
  {
    id: 'what-if',
    title: 'What If? Scenarios',
    category: 'Hypothetical',
    cardCount: 35,
    completedCount: 12,
    icon: '❓',
    gradient: 'from-[#3A0CA3] via-[#4361EE] to-[#1F0A4A]',
    description: 'Wild hypotheticals and moral dilemmas that reveal hidden personalities.',
    tags: ['Imagination', 'Dilemmas', 'Fun']
  }
];

export const MyCardsView: React.FC = () => {
  const { setScreen, setSelectedDeckTitle, loadDeckCards, showToast, token } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [decks, setDecks] = useState<OwnedDeck[]>(OWNED_DECKS);

  useEffect(() => {
    api.getMyCards(token).then((res) => {
      if (res && res.success && res.decks && res.decks.length > 0) {
        const mapped = res.decks
          .filter((d: any) => d.is_unlocked === 1)
          .map((d: any) => ({
            id: d.id,
            title: d.title,
            category: d.category.toUpperCase(),
            cardCount: d.card_count || 30,
            completedCount: d.exploration_count || 12,
            icon: d.icon || '🎴',
            gradient: d.gradient || 'from-[#5B0DAD] to-[#C026D3]',
            description: d.description || 'Engaging prompts and conversational starters.',
            tags: [d.category, d.access_type],
          }));
        if (mapped.length > 0) {
          setDecks(mapped);
        }
      }
    });
  }, [token]);

  const handlePlay = async (title: string, deckId?: string) => {
    setSelectedDeckTitle(title);
    await loadDeckCards(deckId || title);
    setScreen('game');
    showToast(`Loaded ${title}! Starting match...`);
  };

  const filteredDecks = decks.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                          d.category.toLowerCase().includes(search.toLowerCase());
    if (filter === 'in-progress') return matchesSearch && d.completedCount < d.cardCount;
    if (filter === 'completed') return matchesSearch && d.completedCount >= d.cardCount;
    return matchesSearch;
  });

  const totalCards = decks.reduce((acc, curr) => acc + curr.cardCount, 0);
  const totalCompleted = decks.reduce((acc, curr) => acc + curr.completedCount, 0);

  return (
    <div className="w-full space-y-6 pb-28 pt-2">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-accent/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('dashboard')}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              <span>My Card Decks</span>
            </h1>
            <p className="text-xs text-purple-300/70">
              Your unlocked conversation decks and collection stats
            </p>
          </div>
        </div>

        <button
          onClick={() => setScreen('store')}
          className="px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-bold hover:bg-accent hover:text-white transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Get More Decks</span>
        </button>
      </div>

      {/* Collection Stats Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-3xl bg-[#230C39]/80 border border-accent/25 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200/80">Owned Decks</span>
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white mt-2">
            {OWNED_DECKS.length}
          </span>
          <span className="text-[10px] text-accent-light mt-0.5">Ready to play</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-[#230C39]/80 border border-accent/25 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200/80">Total Prompts</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white mt-2">
            {totalCards}
          </span>
          <span className="text-[10px] text-purple-300/70 mt-0.5">Across all decks</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-[#230C39]/80 border border-accent/25 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200/80">Answered</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {totalCompleted}
          </span>
          <span className="text-[10px] text-emerald-300/70 mt-0.5">
            {Math.round((totalCompleted / totalCards) * 100)}% exploration
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-[#230C39]/80 border border-accent/25 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200/80">Game Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            7 Days
          </span>
          <span className="text-[10px] text-amber-300/70 mt-0.5">+50 bonus tomorrow</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decks by title or tag..."
            className="w-full py-2.5 pl-10 pr-3 rounded-2xl bg-[#140423] border border-accent/30 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'all' 
                ? 'bg-accent text-white shadow-md' 
                : 'bg-white/5 border border-white/10 text-purple-300 hover:text-white'
            }`}
          >
            All Decks ({OWNED_DECKS.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'in-progress' 
                ? 'bg-accent text-white shadow-md' 
                : 'bg-white/5 border border-white/10 text-purple-300 hover:text-white'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'completed' 
                ? 'bg-accent text-white shadow-md' 
                : 'bg-white/5 border border-white/10 text-purple-300 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Decks Grid (Fully Responsive: 1 Col on small mobile, 2 Cols on tablet, 3-4 Cols on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredDecks.map((deck) => {
          const progressPercent = Math.round((deck.completedCount / deck.cardCount) * 100);

          return (
            <div
              key={deck.id}
              className="group rounded-3xl overflow-hidden bg-[#230C39]/80 border border-accent/30 hover:border-accent shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-5"
            >
              <div>
                {/* Deck Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${deck.gradient} flex items-center justify-center text-3xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform`}>
                    {deck.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-[10px] font-bold text-accent-light">
                      {deck.category}
                    </span>
                    <span className="text-[11px] text-purple-300/80 font-semibold">
                      {deck.cardCount} Cards
                    </span>
                  </div>
                </div>

                {/* Deck Title & Description */}
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight mb-1.5">
                  {deck.title}
                </h3>
                <p className="text-xs text-purple-200/70 leading-relaxed line-clamp-2 mb-3">
                  {deck.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {deck.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-purple-300/80">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress & Play CTA */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-purple-200/80 mb-1">
                    <span>Exploration Progress</span>
                    <span className="text-accent-light font-bold">
                      {deck.completedCount}/{deck.cardCount} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handlePlay(deck.title, deck.id)}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white text-xs font-bold shadow-md shadow-accent/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play This Deck</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
