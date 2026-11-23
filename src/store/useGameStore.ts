import { create } from 'zustand';
import { ScreenType, AuthUser, AuthSession } from '../types';
import { api, AuthResponse } from '../services/api';
import { 
  isNativeAndroid, 
  startHostedGoogleLogin, 
  initHostedAndroidAuth, 
  checkWebHostedAuthExchange 
} from '../services/hostedAuth';

const SESSION_STORAGE_KEY = 'rvstrangers_auth_session';

const getInitialSession = (): AuthSession | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialSession = getInitialSession();

interface GameStore {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  coins: number;
  diamonds: number;
  addCoins: (amount: number) => Promise<void>;
  addDiamonds: (amount: number, price?: string) => Promise<void>;
  spendCoins: (amount: number) => boolean;
  spendDiamonds: (amount: number) => boolean;
  unlockDeckInD1: (deckId: string) => Promise<boolean>;
  
  // Authentication State
  currentUser: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  applyAuthSession: (res: AuthResponse) => void;
  updateUserProfile: (data: { name: string; handle: string; avatar: string }) => Promise<void>;
  initSessionFromD1: () => Promise<void>;
  loginWithGoogle: (credential?: string, email?: string, name?: string) => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<boolean>;
  registerWithCredentials: (email: string, pass: string, name: string, handle?: string) => Promise<boolean>;
  continueAsGuest: () => Promise<void>;
  logout: () => void;

  // Game Table State
  selectedDeckTitle: string;
  setSelectedDeckTitle: (title: string) => void;
  activeCards: Array<{ id: string; prompt: string }>;
  loadDeckCards: (deckIdOrTitle: string) => Promise<void>;
  isCardFlipped: boolean;
  toggleCardFlip: () => void;
  currentCardIndex: number;
  nextCard: () => void;
  currentAnswer: string;
  setAnswer: (ans: string) => void;
  publishedAnswer: string | null;
  submitAnswer: () => void;
  reactions: Array<{ id: string; emoji: string; left: number }>;
  addReaction: (emoji: string) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DECK_ID_MAP: Record<string, string> = {
  'Deep Conversations': 'deck_deep',
  'Relationships': 'deck_relationships',
  'Mind & Psychology': 'deck_mind',
  'Friends & Fun': 'deck_friends',
  'Self Discovery': 'deck_self_discovery',
  'Emotional Wellness': 'deck_emotional',
  'Couples Talk': 'deck_couples_talk',
  'Life Goals': 'deck_life_goals',
  'What If? Scenarios': 'deck_what_if',
  'Work & Life Balance': 'deck_work_life',
};

export const useGameStore = create<GameStore>((set, get) => ({
  currentScreen: initialSession ? 'dashboard' : 'welcome',
  setScreen: (screen) => set({ currentScreen: screen }),
  isDarkMode: true,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  coins: 0,
  diamonds: 0,
  token: initialSession?.token || null,

  // Synchronize Live D1 Session on App Mount
  initSessionFromD1: async () => {
    // If native Android, initialize external browser OAuth deep link handler
    if (isNativeAndroid()) {
      initHostedAndroidAuth(
        (authRes) => get().applyAuthSession(authRes),
        (errMsg) => get().showToast(errMsg),
        () => get().continueAsGuest()
      );
    } else {
      // Check if returning from centralized hosted portal with one-time exchange code
      await checkWebHostedAuthExchange(
        (authRes) => get().applyAuthSession(authRes),
        (errMsg) => get().showToast(errMsg),
        () => get().continueAsGuest()
      );
    }

    const currentToken = get().token;
    if (!currentToken) return;

    const me = await api.getMe(currentToken);
    if (me && me.success) {
      set({
        currentUser: {
          id: me.user.id,
          name: me.user.name,
          email: me.user.email,
          handle: me.user.handle,
          avatar: me.user.avatar,
          isGuest: Boolean(me.user.isGuest),
          createdAt: new Date().toISOString(),
        },
        coins: me.wallet.coins,
        diamonds: me.wallet.diamonds,
        isAuthenticated: !me.user.isGuest,
        isGuest: Boolean(me.user.isGuest),
      });
    }
  },

  addCoins: async (amount) => {
    void amount;
    const currentToken = get().token;
    if (currentToken) {
      const res = await api.claimAdBonus(currentToken);
      if (res && res.success) {
        set({ coins: res.coins, diamonds: res.diamonds });
        return;
      }
    }
    get().showToast('Rewards are unavailable until an approved ad provider is connected.');
  },

  addDiamonds: async (amount, price = '$0.99') => {
    const currentToken = get().token;
    if (currentToken) {
      const res = await api.buyDiamonds(amount, price, currentToken);
      if (res && res.success) {
        set({ coins: res.coins, diamonds: res.diamonds });
        return;
      }
    }
    get().showToast('Purchases are unavailable until checkout is connected.');
  },

  spendCoins: (amount) => {
    if (get().coins >= amount) {
      set((state) => ({ coins: state.coins - amount }));
      return true;
    }
    return false;
  },

  spendDiamonds: (amount) => {
    if (get().diamonds >= amount) {
      set((state) => ({ diamonds: state.diamonds - amount }));
      return true;
    }
    return false;
  },

  unlockDeckInD1: async (deckId: string) => {
    const currentToken = get().token;
    if (currentToken) {
      const res = await api.unlockDeck(deckId, currentToken);
      if (res && res.success) {
        set({ coins: res.coins, diamonds: res.diamonds });
        get().showToast(res.message);
        return true;
      } else if (res && res.error) {
        get().showToast(res.error);
        return false;
      }
    }
    get().showToast('Sign in to unlock decks.');
    return false;
  },

  // Auth Implementations (Integrated with Cloudflare D1 Backend)
  currentUser: initialSession ? initialSession.user : null,
  isAuthenticated: initialSession ? !initialSession.user.isGuest : false,
  isGuest: initialSession ? initialSession.user.isGuest : false,

  applyAuthSession: (res: AuthResponse) => {
    if (res && res.success && res.user && res.token) {
      const session: AuthSession = {
        token: res.token,
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          handle: res.user.handle,
          avatar: res.user.avatar,
          isGuest: false,
          createdAt: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch {}
      set({
        token: res.token,
        currentUser: session.user,
        coins: res.wallet?.coins ?? 0,
        diamonds: res.wallet?.diamonds ?? 0,
        isAuthenticated: true,
        isGuest: false,
        currentScreen: 'profile-setup', // Login users from workers are routed to profile setup card experience
      });
      get().showToast(`Signed in with Google! Welcome ${res.user.name} 👋`);
    } else {
      get().showToast(res?.error || 'Google login failed.');
    }
  },

  updateUserProfile: async (data: { name: string; handle: string; avatar: string }) => {
    const current = get().currentUser;
    if (!current) return;
    const updatedUser: AuthUser = {
      ...current,
      name: data.name.trim() || current.name,
      handle: data.handle.trim() || current.handle,
      avatar: data.avatar || current.avatar,
    };
    const token = get().token;
    if (token) {
      api.updateProfile({ name: updatedUser.name, handle: updatedUser.handle, avatar: updatedUser.avatar }, token).catch(() => {});
    }
    const session: AuthSession = {
      token: token || undefined,
      user: updatedUser,
    };
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}
    set({
      currentUser: updatedUser,
      currentScreen: 'dashboard',
    });
    get().showToast(`Profile ready! Welcome to RVStrangers, ${updatedUser.name} ✨`);
  },

  loginWithGoogle: async (credential) => {
    if (credential) {
      get().showToast('Connecting with Google...');
      const res = await api.loginWithGoogle(credential);
      get().applyAuthSession(res);
      return;
    }

    get().showToast('Redirecting to RVStrangers secure sign-in...');
    const result = await startHostedGoogleLogin();
    if (!result.success && result.error) {
      get().showToast(result.error);
    }
  },

  loginWithCredentials: async (email, pass) => {
    if (!email || !pass) {
      get().showToast('Please enter both email and password.');
      return false;
    }
    get().showToast('Verifying credentials...');
    const res = await api.login(email, pass);
    if (res && res.success && res.user && res.token) {
      const session: AuthSession = {
        token: res.token,
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          handle: res.user.handle,
          avatar: res.user.avatar,
          isGuest: false,
          createdAt: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch {}
      set({
        token: res.token,
        currentUser: session.user,
        coins: res.wallet?.coins ?? 0,
        diamonds: res.wallet?.diamonds ?? 0,
        isAuthenticated: true,
        isGuest: false,
        currentScreen: 'dashboard',
      });
      get().showToast(`Welcome back, ${res.user.name}! 🌟`);
      return true;
    } else {
      get().showToast(res?.error || 'Invalid email or password.');
      return false;
    }
  },

  registerWithCredentials: async (email, pass, name, handle) => {
    if (!email || !pass || !name) {
      get().showToast('Please fill all required fields.');
      return false;
    }
    get().showToast('Creating account in Cloudflare D1...');
    const res = await api.register(email, pass, name, handle);
    if (res && res.success && res.user && res.token) {
      const session: AuthSession = {
        token: res.token,
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          handle: res.user.handle,
          avatar: res.user.avatar,
          isGuest: false,
          createdAt: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch {}
      set({
        token: res.token,
        currentUser: session.user,
        coins: res.wallet?.coins ?? 0,
        diamonds: res.wallet?.diamonds ?? 0,
        isAuthenticated: true,
        isGuest: false,
        currentScreen: 'dashboard',
      });
      get().showToast('Account created successfully.');
      return true;
    } else {
      get().showToast(res?.error || 'Registration failed.');
      return false;
    }
  },

  continueAsGuest: async () => {
    get().showToast('Creating Guest session...');
    const res = await api.continueAsGuest();
    if (res && res.success && res.user && res.token) {
      const session: AuthSession = {
        token: res.token,
        user: {
          id: res.user.id,
          name: res.user.name,
          handle: res.user.handle,
          avatar: res.user.avatar,
          isGuest: true,
          createdAt: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch {}
      set({
        token: res.token,
        currentUser: session.user,
        coins: res.wallet?.coins ?? 0,
        diamonds: res.wallet?.diamonds ?? 0,
        isAuthenticated: false,
        isGuest: true,
        currentScreen: 'dashboard',
      });
      get().showToast('Continuing as Guest. Local game unlocked! 🎴');
    } else {
      get().showToast(res?.error || 'Could not start guest session.');
    }
  },

  logout: () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    set({
      token: null,
      currentUser: null,
      isAuthenticated: false,
      isGuest: false,
      currentScreen: 'welcome',
    });
    get().showToast('Logged out safely. See you soon!');
  },

  selectedDeckTitle: 'Deep Conversations',
  setSelectedDeckTitle: (title) => set({ selectedDeckTitle: title }),
  activeCards: [],
  loadDeckCards: async (deckIdOrTitle: string) => {
    const deckId = DECK_ID_MAP[deckIdOrTitle] || deckIdOrTitle;
    try {
      const res = await api.getDeckCards(deckId);
      if (res && res.success && Array.isArray(res.cards) && res.cards.length > 0) {
        set({
          activeCards: res.cards.map((c: any) => ({
            id: c.id,
            prompt: c.default_question,
          })),
          currentCardIndex: 0,
          isCardFlipped: false,
          publishedAnswer: null,
          currentAnswer: '',
        });
        return;
      }
    } catch {}

    set({
      activeCards: [],
      currentCardIndex: 0,
      isCardFlipped: false,
      publishedAnswer: null,
      currentAnswer: '',
    });
    get().showToast('This deck could not be loaded. Please try again.');
  },
  isCardFlipped: false,
  toggleCardFlip: () => set((state) => ({ isCardFlipped: !state.isCardFlipped })),
  currentCardIndex: 0,
  nextCard: () => set((state) => {
    const total = state.activeCards.length;
    return {
      currentCardIndex: total ? (state.currentCardIndex + 1) % total : 0,
      isCardFlipped: false,
      publishedAnswer: null,
      currentAnswer: '',
    };
  }),
  currentAnswer: '',
  setAnswer: (ans) => set({ currentAnswer: ans }),
  publishedAnswer: null,
  submitAnswer: () => set((state) => ({
    publishedAnswer: state.currentAnswer.trim() || null,
    currentAnswer: '',
  })),
  reactions: [],
  addReaction: (emoji) => {
    const newId = Math.random().toString();
    const left = Math.random() * 60 + 20;
    set((state) => ({
      reactions: [...state.reactions, { id: newId, emoji, left }]
    }));
    setTimeout(() => {
      set((state) => ({
        reactions: state.reactions.filter((r) => r.id !== newId)
      }));
    }, 1800);
  },

  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 2800);
  }
}));
