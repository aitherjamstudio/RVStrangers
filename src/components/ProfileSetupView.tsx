import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ProfileCard3D, SetupStage } from './ProfileCard3D';
import { Sparkles, User, RotateCcw, Check, AtSign, MessageCircle } from 'lucide-react';

const AVATARS = [
  { id: 'heart', emoji: '💜', label: 'Heart', color: 'from-pink-500 to-purple-600' },
  { id: 'joker', emoji: '🃏', label: 'Card', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'spark', emoji: '⚡', label: 'Electric', color: 'from-amber-400 to-pink-500' },
  { id: 'crown', emoji: '👑', label: 'Royalty', color: 'from-yellow-400 to-amber-600' },
  { id: 'star', emoji: '🌟', label: 'Star', color: 'from-purple-400 to-pink-500' },
  { id: 'mask', emoji: '🎭', label: 'Mystic', color: 'from-violet-500 to-indigo-600' },
];

const MOODS = [
  'Here for deep conversations',
  'Ready to meet new friends',
  'Card game enthusiast',
  'Just chilling & playing',
];

export const ProfileSetupView: React.FC = () => {
  const { currentUser, updateUserProfile, setScreen } = useGameStore();

  const [stage, setStage] = useState<SetupStage>('box_closed');
  
  // Profile form state initialized from Google OAuth profile data
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [handle, setHandle] = useState(
    currentUser?.handle ? (currentUser.handle.startsWith('@') ? currentUser.handle : `@${currentUser.handle}`) : '@stranger'
  );
  const [selectedAvatar, setSelectedAvatar] = useState('💜');
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Box Click: Opens lid & reveals card
  const handleBoxClick = () => {
    if (stage === 'box_closed') {
      setStage('box_opening');
    }
  };

  // 2. Opening & Emergence Finished
  const handleOpeningFinished = () => {
    setStage('card_ready');
  };

  // 3. Card Click: Initiates 180° flip
  const handleCardClick = () => {
    if (stage === 'card_ready') {
      setStage('card_flipping');
    }
  };

  // 4. Flip Finished: Form & Live Card Active
  const handleFlipFinished = () => {
    setStage('card_flipped');
  };

  // Form submit handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const cleanHandle = handle.trim().replace(/^@+/, '');
    await updateUserProfile({
      name: displayName.trim() || currentUser?.name || 'Adventurer',
      handle: cleanHandle ? `@${cleanHandle}` : currentUser?.handle || '@stranger',
      avatar: selectedAvatar,
    });
  };

  const handleSkip = () => {
    setScreen('dashboard');
  };

  const currentAvatarObj = AVATARS.find((a) => a.emoji === selectedAvatar) || AVATARS[0];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#07000E] text-white flex flex-col items-center justify-between overflow-hidden select-none px-3.5 py-2 sm:py-3 font-comfortaa">
      {/* Background Ambient Radial Glows */}
      <div className="fixed -top-28 -left-28 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF2E93]/20 via-[#D946EF]/10 to-transparent blur-[90px] pointer-events-none" />
      <div className="fixed -bottom-28 -right-28 w-80 h-80 rounded-full bg-gradient-to-tl from-[#D946EF]/20 via-[#8B5CF6]/10 to-transparent blur-[90px] pointer-events-none" />

      {/* Top Header & Induction Tag */}
      <div className="w-full max-w-md flex flex-col items-center text-center z-10 shrink-0 mt-0.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-pink-500/25 text-[10px] font-bold tracking-wide text-pink-300 shadow-[0_0_12px_rgba(255,46,147,0.15)] mb-1">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>
            {stage === 'box_closed' && 'Step 1 of 3: Unbox Card'}
            {stage === 'box_opening' && 'Step 1 of 3: Unboxing...'}
            {stage === 'card_ready' && 'Step 2 of 3: Reveal Identity'}
            {stage === 'card_flipping' && 'Step 2 of 3: Flipping Card...'}
            {stage === 'card_flipped' && 'Step 3 of 3: Customize Identity'}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black italic tracking-tight leading-none">
          <span className="text-white">RV</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3EA5] via-[#F43F9E] to-[#E026D8] drop-shadow-[0_0_15px_rgba(244,63,158,0.5)]">
            Strangers
          </span>
        </h1>
        <p className="text-[11px] text-purple-200/80 mt-1 max-w-[290px] leading-tight">
          {stage === 'box_closed' && 'Your personal conversation deck is ready. Tap the box to open.'}
          {stage === 'box_opening' && 'Opening deck box and drawing your personal card...'}
          {stage === 'card_ready' && 'Your card has emerged! Tap it to reveal and personalize.'}
          {stage === 'card_flipping' && 'Revealing player identity passport...'}
          {stage === 'card_flipped' && 'Create your RVStrangers identity card below.'}
        </p>
      </div>

      {/* ======================================================== */}
      {/* CENTER STAGE: 3D UNBOXING OR LIVE CARD CREATION          */}
      {/* ======================================================== */}
      <div className="relative w-full max-w-[340px] flex-1 flex flex-col items-center justify-center my-auto min-h-0">
        
        {/* Stages 1 to 4: 3D Unboxing & Card Flip Sequence */}
        {stage !== 'card_flipped' && (
          <div className="relative w-full h-full min-h-[260px] max-h-[440px] flex items-center justify-center">
            {/* Ground shadow beneath box/card */}
            <div className="absolute bottom-4 w-40 h-4 rounded-[100%] bg-black/80 blur-md pointer-events-none" />

            {/* 3D WebGL Canvas */}
            <ProfileCard3D
              stage={stage}
              onBoxClick={handleBoxClick}
              onCardClick={handleCardClick}
              onOpeningFinished={handleOpeningFinished}
              onFlipFinished={handleFlipFinished}
            />
          </div>
        )}

        {/* Stage 5: Live Interactive Identity Card & Customizer */}
        {stage === 'card_flipped' && (
          <div className="w-full flex flex-col items-center justify-between space-y-2 animate-fade-in py-0.5">
            
            {/* 1. The Live RVStrangers Identity Card Preview */}
            <div className="w-full max-w-[320px] rounded-2xl bg-gradient-to-b from-[#1C042F] to-[#0E011B] border-2 border-[#FF2E93]/60 p-3 shadow-[0_0_30px_rgba(255,46,147,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] relative overflow-hidden shrink-0">
              {/* Card Holographic Sheen */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-[#FF2E93]/20 via-[#D946EF]/20 to-transparent blur-xl pointer-events-none" />
              
              {/* Card Top Strip */}
              <div className="flex items-center justify-between border-b border-pink-500/20 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                  <span className="text-[10px] font-black tracking-wider text-pink-300 uppercase">
                    RVSTRANGERS PASSPORT
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-purple-300/80 bg-white/[0.06] px-1.5 py-0.5 rounded-md border border-white/10">
                  <span>#001</span>
                  <span>•</span>
                  <span>GENESIS</span>
                </div>
              </div>

              {/* Card Body: Live Avatar Emblem & Name/Handle */}
              <div className="flex items-center gap-3">
                {/* Glowing Avatar Emblem */}
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${currentAvatarObj.color} p-0.5 shadow-[0_0_15px_rgba(255,46,147,0.5)] shrink-0 flex items-center justify-center`}>
                  <div className="w-full h-full rounded-[14px] bg-[#140224]/80 flex items-center justify-center text-2xl backdrop-blur-sm">
                    <span>{selectedAvatar}</span>
                  </div>
                </div>

                {/* Live Name & Handle */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-white truncate tracking-tight">
                    {displayName.trim() || 'Your Name'}
                  </div>
                  <div className="text-[11px] font-bold text-pink-400 truncate">
                    {handle.trim() || '@handle'}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-purple-200/75 mt-1 bg-white/[0.04] px-1.5 py-0.5 rounded-full border border-pink-500/15 truncate max-w-full">
                    <MessageCircle className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                    <span className="truncate">{selectedMood}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Interactive Identity Form Controls */}
            <form
              onSubmit={handleSaveProfile}
              className="w-full max-w-[320px] rounded-2xl bg-[#140224]/90 border border-white/10 p-3 shadow-xl backdrop-blur-md flex flex-col space-y-2 shrink-0"
            >
              {/* Avatar One-Tap Selector */}
              <div>
                <label className="text-[9.5px] font-bold text-purple-200 block mb-1">
                  Choose Avatar Emblem
                </label>
                <div className="flex items-center justify-between gap-1">
                  {AVATARS.map((av) => (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.emoji)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-150 ${
                        selectedAvatar === av.emoji
                          ? 'bg-gradient-to-tr from-[#FF2E93] to-[#D946EF] border-2 border-white scale-110 shadow-[0_0_12px_rgba(255,46,147,0.8)]'
                          : 'bg-white/[0.05] border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{av.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name & Handle (Compact Grid) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9.5px] font-bold text-purple-200 block mb-0.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-400" />
                    <input
                      type="text"
                      required
                      maxLength={25}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-8 pl-7 pr-2 rounded-lg bg-white/[0.06] border border-pink-500/25 text-white placeholder-purple-300/40 text-[11px] font-semibold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9.5px] font-bold text-purple-200 block mb-0.5">
                    Handle
                  </label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-purple-400" />
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={handle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHandle(val.startsWith('@') ? val : `@${val}`);
                      }}
                      placeholder="@handle"
                      className="w-full h-8 pl-7 pr-2 rounded-lg bg-white/[0.06] border border-pink-500/25 text-white placeholder-purple-300/40 text-[11px] font-semibold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Conversation Vibe Picker */}
              <div>
                <label className="text-[9.5px] font-bold text-purple-200 block mb-0.5">
                  Conversation Vibe
                </label>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full h-7 px-2 rounded-lg bg-[#1B0530] border border-pink-500/25 text-purple-100 text-[10px] font-semibold focus:outline-none focus:border-pink-500"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m} className="bg-[#1B0530] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Identity Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9 rounded-full bg-gradient-to-r from-[#FF2E93] via-[#D946EF] to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,46,147,0.6)] hover:shadow-[0_0_30px_rgba(255,46,147,0.8)] active:scale-[0.98] transition-all duration-200 mt-1 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Identity & Enter</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOTTOM CONTEXT CALLOUTS & ACTIONS                        */}
      {/* ======================================================== */}
      <div className="w-full max-w-sm flex flex-col items-center z-10 shrink-0 pb-1">
        {stage === 'box_closed' && (
          <button
            type="button"
            onClick={handleBoxClick}
            className="w-full h-11 rounded-full bg-white text-[#140224] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,46,147,0.5)] hover:shadow-[0_0_40px_rgba(255,46,147,0.8)] active:scale-95 transition-all duration-200 border border-white"
          >
            <span>👉 Tap Box to Open Card</span>
          </button>
        )}

        {stage === 'box_opening' && (
          <div className="w-full h-11 rounded-full bg-white/10 border border-pink-500/30 text-pink-300 font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
            <span>Opening deck box and drawing card...</span>
          </div>
        )}

        {stage === 'card_ready' && (
          <button
            type="button"
            onClick={handleCardClick}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#D946EF] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,46,147,0.7)] hover:shadow-[0_0_40px_rgba(255,46,147,0.9)] active:scale-95 transition-all duration-200 border border-pink-300 animate-bounce"
          >
            <RotateCcw className="w-4 h-4" />
            <span>🃏 Tap Card to Flip & Personalize</span>
          </button>
        )}

        {stage === 'card_flipping' && (
          <div className="w-full h-11 rounded-full bg-white/10 border border-pink-500/30 text-pink-300 font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
            <span>Flipping card...</span>
          </div>
        )}

        {stage === 'card_flipped' && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-[10px] text-purple-300/70 hover:text-white underline transition-colors"
          >
            Skip for now & enter dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSetupView;
