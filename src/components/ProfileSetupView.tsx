import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ProfileCard3D, SetupStage } from './ProfileCard3D';
import { AVATAR_OPTIONS, AvatarCategory, DEFAULT_AVATAR_PATH, resolveAvatarUrl } from '../utils/avatars';
import { COUNTRIES, MATCHMAKING_LANGUAGES } from '../utils/profileCatalogs';
import { api } from '../services/api';
import {
  Sparkles,
  User,
  RotateCcw,
  Check,
  AtSign,
  Quote,
  Globe,
  MapPin,
  Search,
  Tag,
  Pencil,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';

const GENDERS = [
  { value: 'unspecified', label: 'Gender' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const INTEREST_OPTIONS = ['Games', 'Music', 'Psychology', 'Movies', 'Travel', 'Food'];

/** Crisp SVG diamond ornament matching the top & bottom card crest */
const CardDiamondCrest: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 36 28"
    className={`w-7 h-5 drop-shadow-[0_0_10px_rgba(255,46,147,0.95)] pointer-events-none ${className}`}
    fill="none"
  >
    <defs>
      <linearGradient id="crestGrad" x1="0" y1="0" x2="36" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F9A8D4" />
        <stop offset="45%" stopColor="#FF2E93" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    <path
      d="M18 1L25.5 14L18 27L10.5 14L18 1Z"
      fill="url(#crestGrad)"
      stroke="#FCE7F3"
      strokeWidth="1.2"
    />
    <path d="M18 4.5L22.5 14L18 23.5L13.5 14L18 4.5Z" fill="#FDF2F8" fillOpacity="0.32" />
    <path d="M2 14H10.5M25.5 14H34" stroke="#F472B6" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const ProfileSetupView: React.FC = () => {
  const { currentUser, token, updateUserProfile, setScreen, showToast } = useGameStore();

  const [stage, setStage] = useState<SetupStage>('box_closed');

  // Normalize initial handle (lowercase alphanumeric/underscore without leading @)
  const initialCleanHandle = (currentUser?.handle || currentUser?.email?.split('@')[0] || 'stranger')
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 25);

  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(initialCleanHandle || 'stranger');
  const [gender, setGender] = useState(currentUser?.gender || 'unspecified');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [country, setCountry] = useState(currentUser?.country || '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    currentUser?.languages && currentUser.languages.length > 0
      ? currentUser.languages
      : currentUser?.language && MATCHMAKING_LANGUAGES.includes(currentUser.language)
      ? [currentUser.language]
      : ['English']
  );
  const [interests, setInterests] = useState<string[]>(
    currentUser?.interests && currentUser.interests.length > 0
      ? currentUser.interests.slice(0, 6)
      : ['Games', 'Music', 'Psychology']
  );

  // Use local public avatar as default (fall back from emoji/empty if needed)
  const initialAvatar =
    currentUser?.avatar && (currentUser.avatar.includes('/') || currentUser.avatar.startsWith('http'))
      ? currentUser.avatar
      : DEFAULT_AVATAR_PATH;
  const [selectedAvatar, setSelectedAvatar] = useState<string>(initialAvatar);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState<AvatarCategory>('male');
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');

  const [usernameStatus, setUsernameStatus] = useState<'valid' | 'taken' | 'invalid' | 'checking'>('valid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkTimerRef = useRef<number | null>(null);

  // Live username format & availability check
  useEffect(() => {
    const clean = username.trim().replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,25}$/.test(clean)) {
      setUsernameStatus('invalid');
      return;
    }

    // Matches user's existing handle -> always available
    if (clean === (currentUser?.handle || '').replace(/^@+/, '').toLowerCase()) {
      setUsernameStatus('valid');
      return;
    }

    setUsernameStatus('checking');
    if (checkTimerRef.current) window.clearTimeout(checkTimerRef.current);
    checkTimerRef.current = window.setTimeout(async () => {
      const res = await api.checkUsername(clean, token);
      setUsernameStatus(res.valid && res.available ? 'valid' : res.valid ? 'taken' : 'invalid');
    }, 350);

    return () => {
      if (checkTimerRef.current) window.clearTimeout(checkTimerRef.current);
    };
  }, [username, token, currentUser?.handle]);

  const toggleInterest = (tag: string) => {
    setInterests((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }
      if (prev.length >= 6) {
        showToast('You can select up to 6 interests.');
        return prev;
      }
      return [...prev, tag];
    });
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) {
          showToast('Keep at least 1 language selected for matchmaking.');
          return prev;
        }
        return prev.filter((item) => item !== lang);
      }
      return [...prev, lang];
    });
  };

  // 1. Box Click: Opens lid & reveals card
  const handleBoxClick = () => {
    if (stage === 'box_closed') setStage('box_opening');
  };

  // 2. Opening & Emergence Finished
  const handleOpeningFinished = () => {
    setStage('card_ready');
  };

  // 3. Card Click: Initiates zoom-in & 180° flip
  const handleCardClick = () => {
    if (stage === 'card_ready') setStage('card_flipping');
  };

  // 4. Flip & Zoom Finished: Form on Card Becomes Active
  const handleFlipFinished = () => {
    setStage('card_flipped');
  };

  // Form submit handler
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const cleanHandle = username.trim().replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,25}$/.test(cleanHandle)) {
      showToast('Username must be 3–25 letters, numbers, or underscores.');
      setUsernameStatus('invalid');
      return;
    }
    if (usernameStatus === 'taken') {
      showToast('That username is already taken. Try another!');
      return;
    }
    if (selectedLanguages.length === 0) {
      showToast('Select at least 1 language for matchmaking.');
      setIsLanguagePickerOpen(true);
      return;
    }

    setIsSubmitting(true);
    const ok = await updateUserProfile({
      name: displayName.trim() || currentUser?.name || 'Adventurer',
      handle: cleanHandle,
      avatar: selectedAvatar,
      gender,
      bio: bio.trim(),
      country,
      language: selectedLanguages[0] || 'English',
      languages: selectedLanguages,
      interests,
    });
    if (!ok) {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setScreen('dashboard');
  };

  return (
    <div
      className={`w-full min-h-[100dvh] bg-[#07000E] text-white flex flex-col items-center overflow-y-auto overscroll-contain px-3.5 py-2.5 sm:py-4 font-comfortaa ${
        stage === 'card_flipped' ? 'justify-start gap-2.5 pb-6 select-text' : 'justify-between select-none'
      }`}
    >
      {/* Ambient Cyberpunk Radial Glows */}
      <div className="fixed -top-28 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF2E93]/25 via-[#D946EF]/10 to-transparent blur-[95px] pointer-events-none" />
      <div className="fixed -bottom-28 -right-24 w-80 h-80 rounded-full bg-gradient-to-tl from-[#D946EF]/25 via-[#8B5CF6]/15 to-transparent blur-[95px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[460px] rounded-full bg-[#C026D3]/10 blur-[100px] pointer-events-none" />

      {/* ======================================================== */}
      {/* TOP HEADER                                               */}
      {/* ======================================================== */}
      <header className="w-full max-w-[380px] flex flex-col items-center text-center z-20 shrink-0 relative">
        {/* Subtle top-right Skip button during personalization */}
        {stage === 'card_flipped' && (
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-0 top-0 text-[10.5px] font-semibold text-purple-300/70 hover:text-white px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 transition-colors"
          >
            Skip
          </button>
        )}

        {/* RVStrangers Card Logo Brand Strip */}
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <div className="relative w-5 h-5 flex items-center justify-center">
            <div className="w-4 h-4 rounded-[4px] border border-pink-400/90 bg-[#25073E] -rotate-6 flex items-center justify-center shadow-[0_0_8px_rgba(255,46,147,0.6)]">
              <span className="text-[7px] font-black text-white leading-none">RV</span>
            </div>
          </div>
          <span className="text-sm sm:text-base font-black italic tracking-tight leading-none">
            <span className="text-white">RV</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3EA5] via-[#F43F9E] to-[#E026D8]">
              Strangers
            </span>
          </span>
        </div>

        {/* Dynamic Heading */}
        {stage === 'card_flipped' ? (
          <>
            <h1 className="text-[17px] sm:text-xl font-extrabold tracking-tight leading-tight">
              <span className="text-white">Personalize Your </span>
              <span className="italic pr-1.5 text-transparent bg-clip-text bg-gradient-to-r from-[#FF3EA5] via-[#F43F9E] to-[#E026D8] drop-shadow-[0_0_12px_rgba(244,63,158,0.45)]">
                Identity Card
              </span>
            </h1>
            <p className="text-[10.5px] sm:text-xs text-purple-200/75 mt-0.5 leading-tight">
              Set up your profile the way you want.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-pink-500/25 text-[10px] font-bold tracking-wide text-pink-300 shadow-[0_0_12px_rgba(255,46,147,0.15)] my-0.5">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>
                {stage === 'box_closed' && 'Step 1 of 3: Open Deck'}
                {stage === 'box_opening' && 'Step 1 of 3: Unboxing...'}
                {stage === 'card_ready' && 'Step 2 of 3: Tap to Reveal Identity'}
                {stage === 'card_flipping' && 'Step 2 of 3: Revealing Identity...'}
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 mt-0.5 max-w-[300px] leading-tight">
              {stage === 'box_closed' && 'Your personal conversation deck is ready. Tap the box to open.'}
              {stage === 'box_opening' && 'Opening deck box and drawing your card...'}
              {stage === 'card_ready' && 'Your card has emerged! Tap it to reveal your identity card.'}
              {stage === 'card_flipping' && 'Revealing player identity card...'}
            </p>
          </>
        )}
      </header>

      {/* ======================================================== */}
      {/* CENTER STAGE: 3D UNBOXING OR ORNATE IDENTITY CARD        */}
      {/* ======================================================== */}
      <div
        className={`relative w-full max-w-[370px] flex flex-col items-center ${
          stage === 'card_flipped'
            ? 'justify-start py-1'
            : 'flex-1 justify-center my-auto min-h-0'
        }`}
      >
        {/* 3D WebGL Canvas (unmounted once flipped so WebGL loop & resize don't interfere with keyboard) */}
        {stage !== 'card_flipped' && (
          <div className="relative w-full h-full min-h-[260px] max-h-[460px] flex items-center justify-center">
            <div className="absolute bottom-4 w-40 h-4 rounded-[100%] bg-black/80 blur-md pointer-events-none" />

            <ProfileCard3D
              stage={stage}
              selectedAvatar={selectedAvatar}
              displayName={displayName}
              handle={username}
              gender={gender}
              bio={bio}
              country={country}
              languages={selectedLanguages}
              interests={interests}
              onBoxClick={handleBoxClick}
              onCardClick={handleCardClick}
              onOpeningFinished={handleOpeningFinished}
              onFlipFinished={handleFlipFinished}
            />
          </div>
        )}

        {/* STAGE 5: ORNATE PROTOTYPE IDENTITY CARD */}
        {stage === 'card_flipped' && (
          <form
            id="profile-identity-form"
            onSubmit={handleSaveProfile}
            className="w-full max-w-[360px] relative rounded-[28px] bg-[#1a052b] border-[1.5px] border-[#FF2E93]/80 shadow-[0_0_38px_rgba(217,70,239,0.42),inset_0_0_24px_rgba(255,46,147,0.14)] px-3.5 pt-3 pb-3.5 sm:px-4 sm:pt-3.5 sm:pb-4 flex flex-col justify-between animate-fade-in z-20 shrink-0"
          >
            {/* Inner subtle beveled crystal frame */}
            <div className="absolute inset-[5px] rounded-[22px] border border-purple-300/15 pointer-events-none" />

            {/* Top & Bottom Ornate Diamond Crests */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30">
              <CardDiamondCrest />
            </div>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30">
              <CardDiamondCrest />
            </div>

            {/* Subtle Orbital Crescents & Radial Glow behind Avatar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-56 h-24 pointer-events-none overflow-hidden opacity-60">
              <div className="mx-auto w-36 h-20 rounded-full bg-gradient-to-b from-[#FF2E93]/35 to-transparent blur-xl" />
              <svg viewBox="0 0 220 90" className="absolute inset-0 w-full h-full" fill="none">
                <path
                  d="M52 12C22 25 18 68 58 80"
                  stroke="url(#arcL)"
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                />
                <path
                  d="M168 12C198 25 202 68 162 80"
                  stroke="url(#arcR)"
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                />
                <defs>
                  <linearGradient id="arcL" x1="20" y1="12" x2="58" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF2E93" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#F472B6" />
                    <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="arcR" x1="200" y1="12" x2="162" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF2E93" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#F472B6" />
                    <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Circular Avatar Portal with Pencil Edit Button */}
            <div className="relative flex justify-center mt-0.5 mb-2 z-20">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="relative group focus:outline-none"
                aria-label="Choose avatar"
              >
                <div className="w-[68px] h-[68px] sm:w-[82px] sm:h-[82px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF2E93] via-[#E879F9] to-[#8B5CF6] shadow-[0_0_24px_rgba(255,46,147,0.75)] group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#130322]">
                    <img
                      src={resolveAvatarUrl(selectedAvatar)}
                      alt="Selected Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#3A105C] border border-[#FF2E93]/90 flex items-center justify-center shadow-[0_0_10px_rgba(255,46,147,0.7)] group-hover:bg-[#FF2E93] transition-colors">
                  <Pencil className="w-3 h-3 text-white" />
                </span>
              </button>
            </div>

            {/* Form Fields Stack */}
            <div className="space-y-1.5 sm:space-y-2 relative z-20">
              {/* Row 1: Nickname + Gender */}
              <div className="grid grid-cols-[1.45fr_1fr] gap-1.5 sm:gap-2">
                {/* Nickname */}
                <div className="flex items-center gap-2 rounded-xl bg-[#130322]/70 border border-pink-400/25 focus-within:border-[#FF2E93] px-2.5 py-1.5 transition-colors">
                  <User className="w-3.5 h-3.5 text-pink-300/90 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[9px] text-purple-300/70 leading-none mb-0.5">Nickname</span>
                    <input
                      type="text"
                      required
                      maxLength={30}
                      enterKeyHint="done"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="John Don"
                      className="w-full bg-transparent text-xs font-bold text-white placeholder-purple-300/35 focus:outline-none leading-tight select-text"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="relative flex items-center gap-1.5 rounded-xl bg-[#130322]/70 border border-pink-400/25 focus-within:border-[#FF2E93] px-2.5 py-1.5 transition-colors">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 text-pink-300/90 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="10" cy="14" r="5" />
                    <path d="M13.5 10.5L19 5" />
                    <path d="M15 5h4v4" />
                  </svg>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    aria-label="Gender"
                    className="w-full bg-transparent text-[11px] sm:text-xs font-bold text-purple-100 focus:outline-none appearance-none pr-3 cursor-pointer"
                  >
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value} className="bg-[#1a052b] text-white">
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-purple-300/70 pointer-events-none shrink-0" />
                </div>
              </div>

              {/* Row 2: Username */}
              <div className="flex items-center gap-2 rounded-xl bg-[#130322]/70 border border-pink-400/25 focus-within:border-[#FF2E93] px-2.5 py-1.5 transition-colors">
                <AtSign className="w-3.5 h-3.5 text-pink-300/90 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] text-purple-300/70 leading-none mb-0.5">Username</span>
                  <input
                    type="text"
                    required
                    maxLength={25}
                    enterKeyHint="done"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@+/, '').toLowerCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="johndon1247"
                    className="w-full bg-transparent text-xs font-bold text-white placeholder-purple-300/35 focus:outline-none leading-tight select-text"
                  />
                </div>
                <div className="shrink-0 flex items-center">
                  {usernameStatus === 'checking' && (
                    <div className="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-pink-400 rounded-full animate-spin" />
                  )}
                  {usernameStatus === 'valid' && (
                    <Check className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  )}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <span
                      title={usernameStatus === 'taken' ? 'Username already taken' : 'Use 3–25 letters, numbers, or _'}
                      className="flex items-center gap-1 text-[9px] font-bold text-rose-400"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{usernameStatus === 'taken' ? 'Taken' : '3+ chars'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Bio */}
              <div className="relative flex items-start gap-2 rounded-xl bg-[#130322]/70 border border-pink-400/25 focus-within:border-[#FF2E93] px-2.5 py-1.5 transition-colors">
                <Quote className="w-3.5 h-3.5 text-pink-300/90 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] text-purple-300/70 leading-none mb-0.5">Bio</span>
                  <textarea
                    rows={2}
                    maxLength={120}
                    enterKeyHint="enter"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Here for deep conversations and interesting people."
                    className="w-full bg-transparent text-[11px] font-semibold text-purple-50 placeholder-purple-300/40 focus:outline-none resize-none overflow-y-auto leading-snug pr-11 select-text"
                  />
                </div>
                <span className="absolute bottom-1.5 right-2.5 text-[9px] font-semibold text-purple-300/60 pointer-events-none">
                  {bio.length} / 120
                </span>
              </div>

              {/* Row 4: Country + Matchmaking Languages */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {/* Searchable Country Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setCountrySearch('');
                    setIsCountryPickerOpen(true);
                  }}
                  aria-label="Select country"
                  className="relative flex items-center gap-2 rounded-xl bg-[#130322]/70 border border-pink-400/25 hover:border-[#FF2E93] px-2.5 py-1.5 transition-colors text-left"
                >
                  <MapPin className="w-3.5 h-3.5 text-pink-300/90 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[9px] text-purple-300/70 leading-none mb-0.5">Country</span>
                    <span className={`block text-xs font-bold truncate leading-tight ${country ? 'text-white' : 'text-purple-300/50'}`}>
                      {country || 'Select'}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-purple-300/70 shrink-0" />
                </button>

                {/* Matchmaking Languages Multi-Select Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setLanguageSearch('');
                    setIsLanguagePickerOpen(true);
                  }}
                  aria-label="Select matchmaking languages"
                  className="relative flex items-center gap-2 rounded-xl bg-[#130322]/70 border border-pink-400/25 hover:border-[#FF2E93] px-2.5 py-1.5 transition-colors text-left"
                >
                  <Globe className="w-3.5 h-3.5 text-pink-300/90 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[9px] text-purple-300/70 leading-none mb-0.5 truncate">
                      Matchmaking Languages
                    </span>
                    <span className="block text-xs font-bold text-white truncate leading-tight">
                      {selectedLanguages.length > 1
                        ? `${selectedLanguages[0]} +${selectedLanguages.length - 1}`
                        : selectedLanguages[0] || 'English'}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-purple-300/70 shrink-0" />
                </button>
              </div>

              {/* Row 5: Interests (up to 6) */}
              <div className="pt-0.5">
                <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                  <Tag className="w-3 h-3 text-pink-300/90" />
                  <span className="text-[11px] font-bold text-white">Interests</span>
                  <span className="text-[9.5px] text-purple-300/70">(up to 6)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {INTEREST_OPTIONS.map((tag) => {
                    const active = interests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`h-7 rounded-full text-[10.5px] font-bold px-2 flex items-center justify-center gap-1 transition-all duration-150 ${
                          active
                            ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border border-pink-200/80 text-white shadow-[0_0_12px_rgba(255,46,147,0.55)]'
                            : 'bg-[#130322]/65 border border-purple-400/25 text-purple-200/85 hover:border-pink-400/50'
                        }`}
                      >
                        {active && <Check className="w-2.5 h-2.5 shrink-0 stroke-[3]" />}
                        <span className="truncate">{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOTTOM ACTION BUTTON                                     */}
      {/* ======================================================== */}
      <div className="w-full max-w-[360px] flex flex-col items-center z-20 shrink-0 pb-0.5 pt-1">
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
            <span>🃏 Tap Card to Reveal Identity</span>
          </button>
        )}

        {stage === 'card_flipping' && (
          <div className="w-full h-11 rounded-full bg-white/10 border border-pink-500/30 text-pink-300 font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
            <span>Revealing identity card...</span>
          </div>
        )}

        {stage === 'card_flipped' && (
          <button
            type="submit"
            form="profile-identity-form"
            disabled={isSubmitting}
            className="w-full h-10 sm:h-11 rounded-full bg-gradient-to-r from-[#FF2E93] via-[#EC4899] to-[#8B5CF6] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(255,46,147,0.7)] hover:shadow-[0_0_38px_rgba(255,46,147,0.95)] active:scale-[0.98] transition-all duration-200 border border-white/25 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.8]" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* AVATAR PICKER MODAL (Avatars from public/avatars/)       */}
      {/* ======================================================== */}
      {isAvatarPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#07000E]/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsAvatarPickerOpen(false)}
        >
          <div
            className="w-full max-w-[360px] max-h-[82dvh] rounded-[28px] bg-[#1a052b] border border-[#FF2E93]/70 shadow-[0_0_45px_rgba(217,70,239,0.5)] p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-500/20 shrink-0">
              <div>
                <h2 className="text-sm font-black text-white">Choose Your Avatar</h2>
                <p className="text-[10px] text-purple-300/75">Pick a character that matches your vibe</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/15"
                aria-label="Close avatar picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selector Tabs (Male default, Female, Neutral) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#130322] border border-pink-500/20 mt-2.5 shrink-0">
              {(['male', 'female', 'neutral'] as AvatarCategory[]).map((cat) => {
                const active = avatarCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAvatarCategory(cat)}
                    className={`py-1.5 rounded-xl text-[11px] font-extrabold capitalize transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] text-white shadow-[0_0_12px_rgba(255,46,147,0.5)]'
                        : 'text-purple-200/75 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-4 gap-2.5 py-3 overflow-y-auto no-scrollbar">
              {AVATAR_OPTIONS.filter((av) => av.category === avatarCategory).map((av) => {
                const isSelected = selectedAvatar === av.path;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(av.path);
                      setIsAvatarPickerOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1 p-1 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-pink-500/25 ring-2 ring-[#FF2E93] shadow-[0_0_16px_rgba(255,46,147,0.65)] scale-[1.03]'
                        : 'bg-white/[0.04] border border-purple-400/20 hover:border-pink-400/60'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#130322]">
                      <img
                        src={resolveAvatarUrl(av.path)}
                        alt={av.label}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[9.5px] font-bold text-purple-100/90 truncate max-w-full">
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SEARCHABLE COUNTRY PICKER MODAL                          */}
      {/* ======================================================== */}
      {isCountryPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#07000E]/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsCountryPickerOpen(false)}
        >
          <div
            className="w-full max-w-[360px] max-h-[80dvh] rounded-[28px] bg-[#1a052b] border border-[#FF2E93]/70 shadow-[0_0_45px_rgba(217,70,239,0.5)] p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-pink-500/20 shrink-0">
              <div>
                <h2 className="text-sm font-black text-white">Country of Residence</h2>
                <p className="text-[10px] text-purple-300/75">Select where you currently live</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCountryPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/15"
                aria-label="Close country picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative my-2.5 shrink-0">
              <Search className="w-3.5 h-3.5 text-pink-300/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                enterKeyHint="search"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Search country..."
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#130322] border border-pink-400/30 text-xs font-semibold text-white placeholder-purple-300/40 focus:outline-none focus:border-[#FF2E93] select-text"
              />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-0.5">
              {COUNTRIES.filter((c) =>
                c.toLowerCase().includes(countrySearch.trim().toLowerCase())
              ).map((c) => {
                const isSelected = country === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCountry(c);
                      setIsCountryPickerOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FF2E93]/35 to-[#C026D3]/35 border border-[#FF2E93]/75 text-white'
                        : 'bg-[#130322]/60 border border-purple-400/15 text-purple-100/90 hover:border-pink-400/45'
                    }`}
                  >
                    <span className="truncate">{c}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-pink-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MATCHMAKING LANGUAGES MULTI-SELECT MODAL                 */}
      {/* ======================================================== */}
      {isLanguagePickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#07000E]/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsLanguagePickerOpen(false)}
        >
          <div
            className="w-full max-w-[360px] max-h-[82dvh] rounded-[28px] bg-[#1a052b] border border-[#FF2E93]/70 shadow-[0_0_45px_rgba(217,70,239,0.5)] p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-pink-500/20 shrink-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-white">Languages for Matching</h2>
                  <span className="px-1.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-[9px] font-bold text-pink-200">
                    {selectedLanguages.length} selected
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/80 mt-0.5 leading-snug">
                  <span className="text-pink-300 font-bold">Exclusively for matchmaking players</span> — choose all languages you speak or are comfortable communicating in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLanguagePickerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-purple-200 hover:bg-white/15 shrink-0"
                aria-label="Close languages picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative my-2.5 shrink-0">
              <Search className="w-3.5 h-3.5 text-pink-300/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                enterKeyHint="search"
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Filter languages..."
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#130322] border border-pink-400/30 text-xs font-semibold text-white placeholder-purple-300/40 focus:outline-none focus:border-[#FF2E93] select-text"
              />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-1.5 pr-0.5 pb-2">
              {MATCHMAKING_LANGUAGES.filter((l) =>
                l.toLowerCase().includes(languageSearch.trim().toLowerCase())
              ).map((lang) => {
                const active = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-1 transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border border-pink-200/80 text-white shadow-[0_0_12px_rgba(255,46,147,0.45)]'
                        : 'bg-[#130322]/65 border border-purple-400/25 text-purple-200/90 hover:border-pink-400/50'
                    }`}
                  >
                    <span className="truncate">{lang}</span>
                    {active && <Check className="w-3 h-3 shrink-0 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsLanguagePickerOpen(false)}
              className="mt-2 w-full h-9 rounded-full bg-gradient-to-r from-[#FF2E93] via-[#EC4899] to-[#8B5CF6] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,46,147,0.55)] shrink-0"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.8]" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSetupView;
