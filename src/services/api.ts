// ========================================================
// RVSTRANGERS CLIENT API SERVICE
// Connects React Frontend to Cloudflare Workers & D1 Edge API
// ========================================================

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://worker.aitherjamstudio.workers.dev';

export interface ApiUser {
  id: string;
  name: string;
  email?: string;
  handle: string;
  avatar: string;
  isGuest: boolean;
}

export interface ApiWallet {
  coins: number;
  diamonds: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: ApiUser;
  wallet?: ApiWallet;
  error?: string;
}

class ApiService {
  private getHeaders(token?: string | null): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Health Check ---
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await res.json();
    } catch (err) {
      console.warn('Health check error:', err);
      return null;
    }
  }

  getBaseUrl(): string {
    return API_BASE_URL;
  }

  async getGoogleClientId(): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/config`);
      const data = await res.json();
      return data?.clientId || null;
    } catch {
      return null;
    }
  }

  // --- Auth: Google OAuth (Web ID Token) ---
  async loginWithGoogle(credential?: string, email?: string, name?: string, avatarUrl?: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ credential, email, name, avatarUrl }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Auth: Centralized Hosted Portal Session Code Exchange ---
  async exchangeSessionCode(exchangeCode: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/session/exchange`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ exchange_code: exchangeCode }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Session exchange failed.' };
    }
  }

  // --- Auth: Google OAuth Exchange (Android PKCE Code Exchange) ---
  async exchangeGoogleAuthCode(code: string, codeVerifier: string, redirectUri: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/exchange`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: redirectUri }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Auth: Register ---
  async register(email: string, pass: string, name: string, handle?: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password: pass, name, handle }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Auth: Login ---
  async login(email: string, pass: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password: pass }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Auth: Guest ---
  async continueAsGuest(): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/guest`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({}),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Auth: Get Current Profile & Live Wallet ---
  async getMe(token: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  // --- Decks Catalog ---
  async getDecks() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/decks`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to load decks from D1:', err);
      return null;
    }
  }

  // --- Deck Cards ---
  async getDeckCards(deckId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/decks/${deckId}/cards`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to load cards from D1:', err);
      return null;
    }
  }

  // --- User Decks Library ---
  async getMyCards(token?: string | null) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/my-cards`, {
        headers: this.getHeaders(token),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  // --- Store: Claim Ad ---
  async claimAdBonus(token: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/claim-ad`, {
        method: 'POST',
        headers: this.getHeaders(token),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Store: Buy Diamonds ---
  async buyDiamonds(amount: number, price: string, token: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/buy-diamonds`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ amount, price }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Store: Unlock Deck ---
  async unlockDeck(deckId: string, token: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/unlock-deck`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ deckId }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- Friends & Community ---
  async getFriends(token?: string | null) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends`, {
        headers: this.getHeaders(token),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  // --- Profile: Update Name, Handle, Avatar ---
  async updateProfile(profile: { name?: string; handle?: string; avatar?: string }, token: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(profile),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const api = new ApiService();
