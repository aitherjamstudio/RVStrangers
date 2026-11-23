import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ProfileCard3D, ProfileStage } from './ProfileCard3D';
import { Sparkles, ArrowRight, User } from 'lucide-react';

const AVATARS = [
  { id: 'heart', emoji: '💜', label: 'Heart' },
  { id: 'joker', emoji: '🃏', label: 'Card' },
  { id: 'spark', emoji: '⚡', label: 'Electric' },
  { id: 'crown', emoji: '👑', label: 'Crown' },
  { id: 'star', emoji: '🌟', label: 'Star' },
  { id: 'mask', emoji: '🎭', label: 'Mystic' },
];

const MOODS = [
  'Here for deep conversations',
  'Ready to meet new friends',
  'Card game enthusiast',
  'Just chilling & playing',
];

export const ProfileSetupView: React.FC = () => {
  const { currentUser, updateUserProfile, setScreen } = useGameStore();

  const [stage, setStage] = useState<ProfileStage>('box_closed');
  
  // Profile form state initialized from Google OAuth profile data if available
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [handle, setHandle] = useState(
    currentUser?.handle ? (currentUser.handle.startsWith('@') ? currentUser.handle : `@${currentUser.handle}`) : '@stranger'
  );
  const [selectedAvatar, setSelectedAvatar] = useState('💜');
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Box Click Handler
  const handleBoxClick = () => {
    if (stage === 'box_closed') {
      setStage('opening');
    }
  };

  // Card Click Handler
  const handleCardClick = () => {
    if (stage === 'card_out') {
      setStage('flipping');
    }
  };

  // Opening animation finished
  const handleOpeningFinished = () => {
    setStage('card_out');
  };

  // Card 180° flip animation finished
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

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#07000E] text-white flex flex-col items-center justify-between overflow-hidden select-none px-4 py-3 sm:py-5 font-comfortaa">
      {/* Background Ambient Glows */}
      <div className="fixed -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF2E93]/30 to-[#8B5CF6]/15 blur-[80px] pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-tl from-[#D946EF]/25 to-[#8B5CF6]/15 blur-[80px] pointer-events-none" />

      {/* Top Header & Instructions */}
      <div className="w-full max-w-md flex flex-col items-center text-center z-10 shrink-0 mt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-pink-500/30 text-[11px] font-bold tracking-wide text-pink-300 shadow-[0_0_15px_rgba(255,46,147,0.2)] mb-1">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>New Player Induction</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black italic tracking-tight">
          <span className="text-white">RV</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3EA5] to-[#E026D8] drop-shadow-[0_0_15px_rgba(244,63,158,0.5)]">
            Strangers
          </span>
        </h1>
        <p className="text-[11px] sm:text-xs text-purple-200/80 mt-0.5">
          {stage === 'box_closed' && 'Your personal conversation card is ready.'}
          {stage === 'opening' && 'Opening your personal card box...'}
          {stage === 'card_out' && 'Your card has emerged! Tap it to customize.'}
          {stage === 'flipping' && 'Revealing player profile details...'}
          {stage === 'card_flipped' && 'Fill out your player details on the card.'}
        </p>
      </div>

      {/* Center 3D Stage & Card Container */}
      <div className="relative w-full max-w-[360px] flex-1 flex items-center justify-center min-h-[300px] max-h-[500px] my-auto">
        
        {/* Ground shadow beneath box */}
        <div className="absolute bottom-6 w-44 h-5 rounded-[100%] bg-black/80 blur-md pointer-events-none" />

        {/* 3D Box & Card WebGL Component */}
        <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${stage === 'card_flipped' ? 'opacity-20 scale-95 blur-[2px]' : 'opacity-100'}`}>
          <ProfileCard3D
            stage={stage}
            onBoxClick={handleBoxClick}
            onCardClick={handleCardClick}
            onOpeningFinished={handleOpeningFinished}
            onFlipFinished={handleFlipFinished}
          />
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE CARD PROFILE FORM (Active when Card is Flipped) */}
        {/* ======================================================== */}
        {stage === 'card_flipped' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 animate-fade-in p-2">
            <form
              onSubmit={handleSaveProfile}
              className="w-full max-w-[340px] rounded-3xl bg-[#140224]/90 border border-pink-500/40 p-4 shadow-[0_0_40px_rgba(255,46,147,0.4)] backdrop-blur-md flex flex-col justify-between space-y-3"
            >
              {/* Card Header Tag */}
              <div className="flex items-center justify-between border-b border-pink-500/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                  <span className="text-[11px] font-black tracking-wider text-pink-300 uppercase">
                    Player Identity Card
                  </span>
                </div>
                <span className="text-xs text-purple-300/80 font-mono">#001</span>
              </div>

              {/* Avatar Selector Row */}
              <div>
                <label className="text-[10px] font-bold text-purple-200 block mb-1">
                  Choose Avatar Symbol
                </label>
                <div className="flex items-center justify-between gap-1.5">
                  {AVATARS.map((av) => (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-200 ${
                        selectedAvatar === av.emoji
                          ? 'bg-gradient-to-tr from-[#FF2E93] to-[#D946EF] border-2 border-white scale-110 shadow-[0_0_15px_rgba(255,46,147,0.8)]'
                          : 'bg-white/[0.06] border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{av.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="text-[10px] font-bold text-purple-200 block mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-300">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={25}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.06] border border-pink-500/30 text-white placeholder-purple-300/40 text-xs font-semibold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Handle / Tag Input */}
              <div>
                <label className="text-[10px] font-bold text-purple-200 block mb-1">
                  Card Handle
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={handle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHandle(val.startsWith('@') ? val : `@${val}`);
                  }}
                  placeholder="@yourhandle"
                  className="w-full h-10 px-3 rounded-xl bg-white/[0.06] border border-pink-500/30 text-white placeholder-purple-300/40 text-xs font-semibold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 shadow-inner"
                />
              </div>

              {/* Connection Mood Quick Selector */}
              <div>
                <label className="text-[10px] font-bold text-purple-200 block mb-1">
                  Card Mood
                </label>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#1B0530] border border-pink-500/30 text-purple-100 text-[11px] font-semibold focus:outline-none focus:border-pink-500"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m} className="bg-[#1B0530] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save & Continue Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF2E93] via-[#D946EF] to-[#8B5CF6] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,46,147,0.6)] hover:shadow-[0_0_35px_rgba(255,46,147,0.8)] active:scale-[0.98] transition-all duration-200 mt-2 disabled:opacity-50"
              >
                <span>Save Profile & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Context Callout & Actions */}
      <div className="w-full max-w-sm flex flex-col items-center z-10 shrink-0 pb-2">
        {stage === 'box_closed' && (
          <button
            type="button"
            onClick={handleBoxClick}
            className="w-full h-12 rounded-full bg-white text-[#140224] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,46,147,0.5)] hover:shadow-[0_0_40px_rgba(255,46,147,0.8)] active:scale-95 transition-all duration-200 border border-white"
          >
            <span>👉 Tap Box to Open Card</span>
          </button>
        )}

        {stage === 'card_out' && (
          <button
            type="button"
            onClick={handleCardClick}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#D946EF] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,46,147,0.7)] hover:shadow-[0_0_40px_rgba(255,46,147,0.9)] active:scale-95 transition-all duration-200 border border-pink-300"
          >
            <span>🃏 Tap Card to Flip & Personalize</span>
          </button>
        )}

        {stage === 'card_flipped' && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-[11px] text-purple-300/70 hover:text-white underline mt-1 transition-colors"
          >
            Skip for now & enter dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSetupView;
