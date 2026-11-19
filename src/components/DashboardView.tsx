import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import { 
  Globe, 
  Users, 
  ChevronRight, 
  Plus, 
  Flame, 
  Crown, 
  Sparkles, 
  QrCode, 
  X, 
  Lock 
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    setScreen, 
    setSelectedDeckTitle, 
    loadDeckCards,
    showToast,
    isGuest,
    loginWithGoogle,
    token
  } = useGameStore();

  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      api.getFriends(token).then((res) => {
        if (res && res.success && Array.isArray(res.friends)) {
          setFriends(res.friends);
        }
      });
    } else {
      setFriends([]);
    }
  }, [token]);

  const [showLocalModal, setShowLocalModal] = useState(false);
  const [localModalTab, setLocalModalTab] = useState<'join' | 'create'>('join');
  const [localRoomCode, setLocalRoomCode] = useState('');
  const [showOnlineGuestModal, setShowOnlineGuestModal] = useState(false);

  const handlePlayOnline = () => {
    if (isGuest) {
      setShowOnlineGuestModal(true);
    } else {
      setScreen('matchmaking');
    }
  };

  const handleOpenLocalModal = () => {
    showToast('Local room hosting and joining will be enabled when real-time room support is connected.');
  };

  const handlePlayDeck = async (deckTitle: string, deckId?: string) => {
    setSelectedDeckTitle(deckTitle);
    await loadDeckCards(deckId || deckTitle);
    setScreen('game');
    showToast(`Loaded Deck: ${deckTitle}`);
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6 pb-28 pt-3 sm:pt-4 select-none font-comfortaa">
      {/* ======================================================== */}
      {/* 1. HERO GAME MODE CARDS (Play Online vs Play Local)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
        {/* Play Online Card */}
        <div
          onClick={handlePlayOnline}
          className="group relative overflow-hidden rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-[#5B0DAD] via-[#7B19D4] to-[#430680] border border-accent/40 cursor-pointer shadow-xl shadow-purple-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[110px] sm:min-h-[140px] flex flex-col justify-between"
        >
          {/* Subtle Watermark Silhouette */}
          <div className="absolute right-3 -bottom-2 opacity-15 pointer-events-none text-5xl sm:text-6xl group-hover:scale-110 transition-transform">
            👥
          </div>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            {isGuest ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Registered
              </span>
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs sm:text-sm shadow-sm group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-extrabold text-white leading-tight">Play Online</h3>
            <p className="text-[11px] sm:text-xs text-[#E879F9] mt-0.5 sm:mt-1">
              {isGuest ? "Sign in to play worldwide" : "Play with people anywhere"}
            </p>
          </div>
        </div>

        {/* Play Local Card */}
        <div
          onClick={handleOpenLocalModal}
          className="group relative overflow-hidden rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-[#FF7E67] via-[#FF5E62] to-[#FF9966] border border-orange-400/40 cursor-pointer shadow-xl shadow-orange-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[110px] sm:min-h-[140px] flex flex-col justify-between"
        >
          {/* Fanned Cards Watermark */}
          <div className="absolute right-3 -bottom-2 opacity-20 pointer-events-none text-5xl sm:text-6xl group-hover:scale-110 transition-transform">
            🎴
          </div>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            {isGuest && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white">
                Join Only
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-extrabold text-white leading-tight">Play Local</h3>
            <p className="text-[11px] sm:text-xs text-orange-100 mt-0.5 sm:mt-1">
              {isGuest ? "Join nearby game rooms" : "Play together nearby"}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FRIENDS ROW                                          */}
      {/* ======================================================== */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">Friends ({friends.length})</h3>
          </div>
          <button 
            onClick={() => setScreen('friends')}
            className="text-[11px] sm:text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {friends.length === 0 ? (
          <div 
            onClick={() => setScreen('friends')}
            className="p-3.5 sm:p-4 rounded-2xl bg-[#230C39]/60 border border-accent/20 flex items-center justify-between cursor-pointer hover:border-accent/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent-light flex items-center justify-center text-lg">
                👥
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Invite & Connect with Friends</h4>
                <p className="text-[10px] sm:text-xs text-purple-300/70">Play conversation decks together or share a room code</p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-accent text-white font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all">
              + Add
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto pb-1 no-scrollbar">
            {friends.map((f: any) => (
              <div 
                key={f.id}
                onClick={() => setScreen('friends')}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
              >
                <div className="relative mb-1">
                  <img 
                    src={f.avatar} 
                    alt={f.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#320E54] border-2 border-emerald-500 shadow-md group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1A052B] rounded-full" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-gray-200">{f.name}</span>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold">{f.status || 'Online'}</span>
              </div>
            ))}
            <div 
              onClick={() => setScreen('friends')}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-accent/60 group-hover:border-accent flex items-center justify-center text-accent mb-1 transition-all group-hover:scale-105">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-accent">Add</span>
              <span className="text-[9px] sm:text-[10px] text-accent-light">Friends</span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. TOP PLAYED CARDS                                     */}
      {/* ======================================================== */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">Top Played Cards</h3>
          </div>
          <button 
            onClick={() => setScreen('store')}
            className="text-[11px] sm:text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: Deep Conversations */}
          <div
            onClick={() => handlePlayDeck('Deep Conversations')}
            className="group relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-end cursor-pointer bg-gradient-to-t from-[#1A052B] via-[#330F47]/80 to-[#5C1663]/60 border border-[#C026D3]/40 hover:border-[#C026D3] shadow-md transition-all text-center hover:-translate-y-1"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-4xl opacity-60 group-hover:scale-110 transition-transform">🌅</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <h4 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Deep Conversations</h4>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] text-[#E879F9] font-bold">
                ▶ 128K plays
              </div>
            </div>
          </div>

          {/* Card 2: Relationships */}
          <div
            onClick={() => handlePlayDeck('Relationships')}
            className="group relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-end cursor-pointer bg-gradient-to-t from-[#1A052B] via-[#4A0E47]/80 to-[#7D1B77]/60 border border-pink-500/40 hover:border-pink-500 shadow-md transition-all text-center hover:-translate-y-1"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-4xl opacity-60 group-hover:scale-110 transition-transform">💖</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <h4 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Relationships</h4>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] text-pink-300 font-bold">
                ▶ 98K plays
              </div>
            </div>
          </div>

          {/* Card 3: Mind & Psychology */}
          <div
            onClick={() => handlePlayDeck('Mind & Psychology')}
            className="group relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-end cursor-pointer bg-gradient-to-t from-[#1A052B] via-[#200D47]/80 to-[#351578]/60 border border-purple-500/40 hover:border-purple-400 shadow-md transition-all text-center hover:-translate-y-1"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-4xl opacity-60 group-hover:scale-110 transition-transform">🧠</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <h4 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Mind & Psychology</h4>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] text-purple-300 font-bold">
                ▶ 76K plays
              </div>
            </div>
          </div>

          {/* Card 4: Friends & Fun */}
          <div
            onClick={() => handlePlayDeck('Friends & Fun')}
            className="group relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-end cursor-pointer bg-gradient-to-t from-[#1A052B] via-[#3B1F0E]/80 to-[#6E3C1B]/60 border border-amber-500/40 hover:border-amber-400 shadow-md transition-all text-center hover:-translate-y-1"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-4xl opacity-60 group-hover:scale-110 transition-transform">🎉</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <h4 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Friends & Fun</h4>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-black/40 text-[9px] sm:text-[10px] text-amber-300 font-bold">
                ▶ 62K plays
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. PREMIUM CARDS (With Gold Crown Badges)              */}
      {/* ======================================================== */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">Premium Cards</h3>
          </div>
          <button 
            onClick={() => setScreen('store')}
            className="text-[11px] sm:text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Premium 1 */}
          <div 
            onClick={() => setScreen('store')}
            className="relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-between cursor-pointer bg-gradient-to-b from-[#351057] to-[#170428] border border-amber-400/40 hover:border-amber-400 shadow-md text-center hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <span>👑</span>
              <span>Premium</span>
            </div>
            <div className="text-center my-auto">
              <span className="text-3xl opacity-75">🧗</span>
            </div>
            <h5 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Self Discovery</h5>
          </div>

          {/* Premium 2 */}
          <div 
            onClick={() => setScreen('store')}
            className="relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-between cursor-pointer bg-gradient-to-b from-[#351057] to-[#170428] border border-amber-400/40 hover:border-amber-400 shadow-md text-center hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <span>👑</span>
              <span>Premium</span>
            </div>
            <div className="text-center my-auto">
              <span className="text-3xl opacity-75">🪷</span>
            </div>
            <h5 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Emotional Wellness</h5>
          </div>

          {/* Premium 3 */}
          <div 
            onClick={() => setScreen('store')}
            className="relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-between cursor-pointer bg-gradient-to-b from-[#351057] to-[#170428] border border-amber-400/40 hover:border-amber-400 shadow-md text-center hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <span>👑</span>
              <span>Premium</span>
            </div>
            <div className="text-center my-auto">
              <span className="text-3xl opacity-75">💑</span>
            </div>
            <h5 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Couples Talk</h5>
          </div>

          {/* Premium 4 */}
          <div 
            onClick={() => setScreen('store')}
            className="relative h-36 sm:h-44 lg:h-48 rounded-2xl overflow-hidden p-3 flex flex-col justify-between cursor-pointer bg-gradient-to-b from-[#351057] to-[#170428] border border-amber-400/40 hover:border-amber-400 shadow-md text-center hover:-translate-y-1 transition-all"
          >
            <div className="mx-auto px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] sm:text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <span>👑</span>
              <span>Premium</span>
            </div>
            <div className="text-center my-auto">
              <span className="text-3xl opacity-75">🚩</span>
            </div>
            <h5 className="text-[11px] sm:text-xs font-extrabold text-white leading-tight">Life Goals</h5>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. RECENTLY ADDED (4 Cards)                             */}
      {/* ======================================================== */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">Recently Added</h3>
          </div>
          <button 
            onClick={() => setScreen('store')}
            className="text-[11px] sm:text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* 1: Work & Life Balance */}
          <div 
            onClick={() => handlePlayDeck('Work & Life Balance')}
            className="p-3 rounded-2xl bg-[#0F2926]/80 border border-teal-500/30 hover:border-teal-400 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-20 sm:h-24 hover:scale-105"
          >
            <span className="text-2xl mb-1">🌿</span>
            <span className="text-[10px] sm:text-xs font-bold text-teal-200 leading-tight">Work & Life Balance</span>
          </div>

          {/* 2: Gratitude Cards */}
          <div 
            onClick={() => handlePlayDeck('Gratitude Cards')}
            className="p-3 rounded-2xl bg-[#2D1E12]/80 border border-amber-500/30 hover:border-amber-400 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-20 sm:h-24 hover:scale-105"
          >
            <span className="text-2xl mb-1">🌱</span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-200 leading-tight">Gratitude Cards</span>
          </div>

          {/* 3: What If? Scenarios */}
          <div 
            onClick={() => handlePlayDeck('What If? Scenarios')}
            className="p-3 rounded-2xl bg-[#260E3D]/80 border border-purple-500/30 hover:border-purple-400 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-20 sm:h-24 hover:scale-105"
          >
            <span className="text-2xl mb-1">❓</span>
            <span className="text-[10px] sm:text-xs font-bold text-purple-200 leading-tight">What If? Scenarios</span>
          </div>

          {/* 4: Random Fun Talk */}
          <div 
            onClick={() => handlePlayDeck('Random Fun Talk')}
            className="p-3 rounded-2xl bg-[#1C182B]/80 border border-slate-500/30 hover:border-slate-400 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-20 sm:h-24 hover:scale-105"
          >
            <span className="text-2xl mb-1">🎲</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-200 leading-tight">Random Fun Talk</span>
          </div>
        </div>
      </div>

      {/* Modal: Online Play Restriction for Guests */}
      {showOnlineGuestModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#230C39] p-6 border border-accent/40 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowOnlineGuestModal(false)}
              className="absolute top-4 right-4 text-purple-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent-light flex items-center justify-center mx-auto text-2xl">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">Online Matchmaking</h3>
            <p className="text-xs text-purple-200/80">
              Online play connects you with real players across the globe. Sign in with Google to unlock online rooms, friend lists, and cloud stats.
            </p>
            <div className="p-3.5 rounded-2xl bg-[#140423]/90 border border-purple-500/20 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-purple-200">
                <span className="text-emerald-400">✓</span> Play with strangers worldwide
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <span className="text-emerald-400">✓</span> Add friends & direct chat
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <span className="text-emerald-400">✓</span> Cloud saved wallet & achievements
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  setShowOnlineGuestModal(false);
                  await loginWithGoogle();
                }}
                className="w-full py-3 rounded-full bg-white hover:bg-gray-100 text-[#1F1726] font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => setShowOnlineGuestModal(false)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-purple-300 font-semibold text-xs"
              >
                Keep Playing as Guest (Local Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Local Multiplayer Room (Join vs Host) */}
      {showLocalModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#230C39] p-6 border border-orange-400/40 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowLocalModal(false)}
              className="absolute top-4 right-4 text-purple-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Modal Subtabs: Join Room vs Host Room */}
            <div className="flex bg-[#140423] p-1 rounded-2xl border border-white/10 mx-auto max-w-xs">
              <button
                onClick={() => setLocalModalTab('join')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  localModalTab === 'join' 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                Join Room
              </button>
              <button
                onClick={() => setLocalModalTab('create')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  localModalTab === 'create' 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                {isGuest && <Lock className="w-3 h-3 text-amber-400" />}
                Host Room
              </button>
            </div>

            {localModalTab === 'join' ? (
              // TAB 1: JOIN ROOM (Allowed for Guests and Registered Players)
              <div className="space-y-4 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto text-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Join Local Room</h3>
                  <p className="text-xs text-orange-200/80 mt-1">
                    Enter the 6-character room code from your host or friend nearby.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={localRoomCode}
                    onChange={(e) => setLocalRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LOCAL1"
                    maxLength={6}
                    className="w-full text-center tracking-widest text-lg font-bold py-3 px-4 rounded-2xl bg-[#140423] border border-orange-400/40 text-amber-300 placeholder-purple-400/40 focus:outline-none focus:border-orange-400"
                  />
                  <p className="text-[10px] text-purple-300/70">
                    Make sure your device is connected to the same Wi-Fi or hotspot.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowLocalModal(false)}
                    className="flex-1 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!localRoomCode.trim()) {
                        showToast('Please enter a room code');
                        return;
                      }
                      setShowLocalModal(false);
                      setScreen('game');
                      showToast(`Joined Local Room: ${localRoomCode.trim()}! 🎴`);
                    }}
                    className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs shadow-md"
                  >
                    Join Match
                  </button>
                </div>
              </div>
            ) : isGuest ? (
              // TAB 2: HOST ROOM - GUEST LOCKED
              <div className="space-y-4 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Hosting Reserved</h3>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Guests may only join existing rooms. Sign in with Google to host and customize local multiplayer sessions.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={async () => {
                      setShowLocalModal(false);
                      await loginWithGoogle();
                    }}
                    className="w-full py-2.5 rounded-full bg-white hover:bg-gray-100 text-[#1F1726] font-bold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    onClick={() => setLocalModalTab('join')}
                    className="w-full py-2 rounded-full bg-white/5 hover:bg-white/10 text-orange-200 text-xs font-semibold"
                  >
                    Switch to Join Room
                  </button>
                </div>
              </div>
            ) : (
              // TAB 2: HOST ROOM - REGISTERED HOST
              <div className="space-y-4 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto text-2xl">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white">Host Local Room</h3>
                <p className="text-xs text-orange-200/80">
                  Friends on the same Wi-Fi can scan this QR or enter the code to join.
                </p>
                <div className="w-32 h-32 bg-white rounded-2xl p-2 mx-auto shadow-md">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=RVSTRANGERS_LOCAL_ROOM_ABCD" 
                    alt="Room QR" 
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-purple-300/80">Room Code:</span>
                  <div className="text-xl font-black text-amber-300 tracking-widest mt-0.5">LOCAL1</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowLocalModal(false)}
                    className="flex-1 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowLocalModal(false);
                      setScreen('game');
                      showToast('Local Room LOCAL1 opened! Waiting for players...');
                    }}
                    className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs shadow-md"
                  >
                    Start Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
