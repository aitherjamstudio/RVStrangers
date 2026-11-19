export type ScreenType = 'welcome' | 'landing' | 'dashboard' | 'game' | 'friends' | 'matchmaking' | 'store' | 'my-cards';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  handle: string;
  avatar: string;
  isGuest: boolean;
  createdAt: string;
}

export interface AuthSession {
  token?: string;
  user: AuthUser;
  expiresAt?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  status: 'Online' | 'In Game' | 'Offline';
  cardsOwned: number;
  decksOwned: number;
  friendsCount: number;
  about: string;
}

export interface DeckItem {
  id: string;
  title: string;
  category: string;
  plays: string;
  cardCount: number;
  isPremium: boolean;
  priceAmount: number;
  priceCurrency: 'COINS' | 'DIAMONDS';
  rating: number;
  icon: string;
  gradient: string;
}

export interface FriendItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  status: 'Online' | 'In Game' | 'Offline';
  lastSeen?: string;
  isRequest?: boolean;
}
