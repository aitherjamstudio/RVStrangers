// ========================================================
// RVSTRANGERS CLOUDFLARE WORKER BACKEND
// Architecture: Edge Compute + Cloudflare D1 + Cloudflare R2
// ========================================================

export interface Env {
  DB: D1Database;          // rvstrangers-db: profiles, wallet_balances, wallet_transactions, friendships, user_reports
  CARDS_DB: D1Database;    // rvstrangers-cards: decks, cards, card_translations, deck_ownership
  MESSAGES_DB: D1Database; // rvstrangers-messages: private_messages
  STATIC_ASSETS?: Fetcher; // Cloudflare Workers Static Assets (Frontend React PWA)
  ASSETS: R2Bucket;
  JWT_SECRET?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
}

interface JWTPayload {
  sub: string;
  username: string;
  is_guest: boolean;
  exp: number;
}

// --------------------------------------------------------
// Web Crypto JWT Helpers (Zero external dependencies)
// --------------------------------------------------------
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

function base64UrlToString(str: string): string {
  return new TextDecoder().decode(base64UrlToBytes(str));
}

async function signJWT(payload: Omit<JWTPayload, 'exp'>, secret: string, expiresInSec: number = 7 * 86400): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload: JWTPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSec,
  };

  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedPayload = stringToBase64Url(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
  const encodedSignature = bytesToBase64Url(new Uint8Array(signature));

  return `${dataToSign}.${encodedSignature}`;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const dataToVerify = `${encodedHeader}.${encodedPayload}`;
    const key = await getCryptoKey(secret);
    const sigBytes = base64UrlToBytes(encodedSignature);

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(dataToVerify));
    if (!isValid) return null;

    const payload: JWTPayload = JSON.parse(base64UrlToString(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + ':rvstrangers_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --------------------------------------------------------
// Standard CORS & JSON Response Helpers
// --------------------------------------------------------
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message, success: false }, status);
}

// Helper: Extract authenticated user from Authorization header
async function authenticateRequest(request: Request, env: Env): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const secret = env.JWT_SECRET || 'rvstrangers_prod_jwt_secret_d88b163_91b5d80a_sec_key_2026';
  return verifyJWT(token, secret);
}

// --------------------------------------------------------
// Main Worker Fetch Handler
// --------------------------------------------------------
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 0. STATIC ASSET SERVING (Serve React Web PWA directly from Worker)
    if (env.STATIC_ASSETS && !url.pathname.startsWith('/api/') && url.pathname !== '/health') {
      try {
        const assetReq = url.pathname.startsWith('/RVStrangers')
          ? new Request(new URL(url.pathname.replace(/^\/RVStrangers/, '') || '/', request.url), request)
          : request;
        const assetRes = await env.STATIC_ASSETS.fetch(assetReq);
        if (assetRes.status !== 404) {
          return assetRes;
        }
        // SPA Routing Fallback: Return index.html
        return await env.STATIC_ASSETS.fetch(new Request(new URL('/', request.url), request));
      } catch {}
    }

    const secret = env.JWT_SECRET || 'rvstrangers_prod_jwt_secret_d88b163_91b5d80a_sec_key_2026';
    const coreDb = env.DB;
    const cardsDb = env.CARDS_DB || env.DB;
    const messagesDb = env.MESSAGES_DB || env.DB;

    try {
      // 1. HEALTH CHECK & STATUS
      if (url.pathname === '/health' || (url.pathname === '/' && !env.STATIC_ASSETS)) {
        return jsonResponse({
          status: 'online',
          server: 'RVStrangers Edge API & Web PWA',
          version: '3.1.0 (Full PWA Web + 3-Database Architecture)',
          databases: {
            core: 'Cloudflare D1 (rvstrangers-db: profiles, wallet, friendships, reports)',
            cards: 'Cloudflare D1 (rvstrangers-cards: decks, cards, translations, ownership)',
            messages: 'Cloudflare D1 (rvstrangers-messages: private_messages)',
          },
          storage: 'Cloudflare R2 (rvstrangers-assets)',
          timestamp: new Date().toISOString(),
        });
      }

      // ========================================================
      // AUTHENTICATION ROUTES
      // ========================================================

      // POST /api/auth/google
      if (url.pathname === '/api/auth/google/config' && method === 'GET') {
        return jsonResponse({ clientId: env.GOOGLE_CLIENT_ID || null });
      }

      if (url.pathname === '/api/auth/google' && method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const { credential } = body;
        if (!credential || !env.GOOGLE_CLIENT_ID) return errorResponse('Google sign-in is not configured.', 503);

        // Do not trust client-decoded JWT claims. Google verifies the ID token first.
        const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (!verification.ok) return errorResponse('Google could not verify this sign-in.', 401);
        const googleUser: any = await verification.json();
        if (googleUser.aud !== env.GOOGLE_CLIENT_ID || googleUser.email_verified !== 'true' || !googleUser.sub || !googleUser.email) {
          return errorResponse('Google sign-in verification failed.', 401);
        }
        const googleId = googleUser.sub;
        const userEmail = googleUser.email.toLowerCase();
        const displayName = googleUser.name || userEmail.split('@')[0];
        const avatarUrl = googleUser.picture;

        // Check if user exists in D1
        let user: any = await env.DB.prepare(
          'SELECT * FROM profiles WHERE (google_id = ? AND google_id IS NOT NULL) OR (email = ? AND email IS NOT NULL)'
        ).bind(googleId || '', userEmail || '').first();

        const userId = user ? user.id : 'usr_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
        const handle = user ? user.username : userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const finalAvatar = user?.avatar_url || avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;

        if (!user) {
          // Atomic creation: profile + starter wallet in D1
          await env.DB.batch([
            env.DB.prepare(
              'INSERT INTO profiles (id, google_id, email, username, display_name, avatar_url, is_guest) VALUES (?, ?, ?, ?, ?, ?, 0)'
            ).bind(userId, googleId, userEmail || null, handle, displayName, finalAvatar),
            env.DB.prepare(
              'INSERT INTO wallet_balances (user_id, coins, diamonds) VALUES (?, 0, 0)'
            ).bind(userId),
          ]);

          user = {
            id: userId,
            google_id: googleId,
            email: userEmail,
            username: handle,
            display_name: displayName,
            avatar_url: finalAvatar,
            is_guest: 0,
          };
        }

        // Fetch wallet balances
        const wallet: any = await env.DB.prepare('SELECT coins, diamonds FROM wallet_balances WHERE user_id = ?').bind(user.id).first() || { coins: 0, diamonds: 0 };

        const token = await signJWT({ sub: user.id, username: user.username, is_guest: false }, secret);

        return jsonResponse({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.display_name,
            email: user.email,
            handle: user.username,
            avatar: user.avatar_url,
            isGuest: false,
          },
          wallet: {
            coins: wallet.coins,
            diamonds: wallet.diamonds,
          }
        });
      }

      // POST /api/auth/register
      if (url.pathname === '/api/auth/register' && method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const { email, password, name, handle } = body;

        if (!email || !password || !name || password.length < 8) {
          return errorResponse('Email, name, and a password of at least 8 characters are required.');
        }

        const cleanHandle = handle ? handle.replace(/[^a-z0-9_]/gi, '').toLowerCase() : email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

        // Check uniqueness in D1
        const existing = await env.DB.prepare('SELECT id FROM profiles WHERE email = ? OR username = ?').bind(email.toLowerCase(), cleanHandle).first();
        if (existing) {
          return errorResponse('An account with this email or username already exists.');
        }

        const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
        const passHash = await hashPassword(password);
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`;

        // Atomic D1 creation
        await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO profiles (id, email, password_hash, username, display_name, avatar_url, is_guest) VALUES (?, ?, ?, ?, ?, ?, 0)'
          ).bind(userId, email.toLowerCase(), passHash, cleanHandle, name.trim(), avatar),
          env.DB.prepare(
            'INSERT INTO wallet_balances (user_id, coins, diamonds) VALUES (?, 0, 0)'
          ).bind(userId),
        ]);

        const token = await signJWT({ sub: userId, username: cleanHandle, is_guest: false }, secret);

        return jsonResponse({
          success: true,
          token,
          user: {
            id: userId,
            name: name.trim(),
            email: email.toLowerCase(),
            handle: cleanHandle,
            avatar,
            isGuest: false,
          },
          wallet: {
            coins: 0,
            diamonds: 0,
          }
        });
      }

      // POST /api/auth/login
      if (url.pathname === '/api/auth/login' && method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const { email, password } = body;

        if (!email || !password) {
          return errorResponse('Email and password are required.');
        }

        const passHash = await hashPassword(password);
        const user: any = await env.DB.prepare(
          'SELECT * FROM profiles WHERE (email = ? OR username = ?) AND password_hash = ?'
        ).bind(email.toLowerCase(), email.toLowerCase(), passHash).first();

        if (!user) {
          return errorResponse('Invalid email or password.', 401);
        }

        const wallet: any = await env.DB.prepare('SELECT coins, diamonds FROM wallet_balances WHERE user_id = ?').bind(user.id).first() || { coins: 0, diamonds: 0 };
        const token = await signJWT({ sub: user.id, username: user.username, is_guest: false }, secret);

        return jsonResponse({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.display_name,
            email: user.email,
            handle: user.username,
            avatar: user.avatar_url,
            isGuest: false,
          },
          wallet: {
            coins: wallet.coins,
            diamonds: wallet.diamonds,
          }
        });
      }

      // POST /api/auth/guest
      if (url.pathname === '/api/auth/guest' && method === 'POST') {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const guestId = 'guest_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
        const handle = `guest_${randomNum}`;
        const name = `Guest #${randomNum}`;
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=guest${randomNum}`;

        await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO profiles (id, username, display_name, avatar_url, is_guest) VALUES (?, ?, ?, ?, 1)'
          ).bind(guestId, handle, name, avatar),
          env.DB.prepare(
            'INSERT INTO wallet_balances (user_id, coins, diamonds) VALUES (?, 0, 0)'
          ).bind(guestId)
        ]);

        const token = await signJWT({ sub: guestId, username: handle, is_guest: true }, secret, 86400);

        return jsonResponse({
          success: true,
          token,
          user: {
            id: guestId,
            name,
            handle,
            avatar,
            isGuest: true,
          },
          wallet: {
            coins: 0,
            diamonds: 0,
          }
        });
      }

      // GET /api/me (Fetch profile & live wallet from D1)
      if (url.pathname === '/api/me' && method === 'GET') {
        const auth = await authenticateRequest(request, env);
        if (!auth) return errorResponse('Unauthorized', 401);

        const user: any = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(auth.sub).first();
        if (!user) return errorResponse('User not found in D1', 404);

        const wallet: any = await env.DB.prepare('SELECT coins, diamonds FROM wallet_balances WHERE user_id = ?').bind(auth.sub).first() || { coins: 0, diamonds: 0 };

        const isGuestUser = Boolean(user.is_guest);

        return jsonResponse({
          success: true,
          user: {
            id: user.id,
            name: user.display_name,
            email: user.email,
            handle: user.username,
            avatar: user.avatar_url,
            gender: user.gender,
            bio: user.bio,
            isGuest: isGuestUser,
          },
          wallet: {
            coins: wallet.coins,
            diamonds: wallet.diamonds,
          },
          permissions: {
            canPlayLocalJoin: true,
            canPlayLocalCreate: !isGuestUser,
            canPlayOnline: !isGuestUser,
            canAddFriends: !isGuestUser,
            canChat: !isGuestUser,
            canPurchase: !isGuestUser,
          }
        });
      }

      // ========================================================
      // DECKS & CARDS CATALOG (rvstrangers-cards D1)
      // ========================================================

      // GET /api/decks
      if (url.pathname === '/api/decks' && method === 'GET') {
        const { results } = await cardsDb.prepare(
          'SELECT * FROM decks WHERE is_active = 1 ORDER BY plays_count DESC'
        ).all();

        return jsonResponse({
          success: true,
          decks: results,
        });
      }

      // GET /api/decks/:id/cards
      if (url.pathname.startsWith('/api/decks/') && url.pathname.endsWith('/cards') && method === 'GET') {
        const parts = url.pathname.split('/');
        const deckId = parts[3];

        const { results } = await cardsDb.prepare(
          'SELECT id, deck_id, order_index, default_question FROM cards WHERE deck_id = ? ORDER BY order_index ASC'
        ).bind(deckId).all();

        return jsonResponse({
          success: true,
          deckId,
          cards: results,
        });
      }

      // GET /api/my-cards (User's library from rvstrangers-cards D1)
      if (url.pathname === '/api/my-cards' && method === 'GET') {
        const auth = await authenticateRequest(request, env);
        const userId = auth ? auth.sub : 'guest_default';

        const { results } = await cardsDb.prepare(`
          SELECT 
            d.id, d.title, d.category, d.card_count, d.access_type, d.icon, d.gradient,
            COALESCE(o.exploration_count, 0) as exploration_count,
            CASE WHEN d.access_type = 'FREE' OR o.deck_id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked
          FROM decks d
          LEFT JOIN deck_ownership o ON d.id = o.deck_id AND o.user_id = ?
          WHERE d.is_active = 1
        `).bind(userId).all();

        return jsonResponse({
          success: true,
          decks: results,
        });
      }

      // ========================================================
      // STORE & WALLET TRANSACTIONS (ACID via D1.batch())
      // ========================================================

      // POST /api/store/claim-ad (+50 Coins)
      if (url.pathname === '/api/store/claim-ad' && method === 'POST') {
        const auth = await authenticateRequest(request, env);
        if (!auth) return errorResponse('Unauthorized', 401);
        if (auth.is_guest) {
          return errorResponse('Guests cannot claim cloud rewards. Sign in with Google to earn and save rewards.', 403);
        }
        return errorResponse('Rewards are unavailable until an approved ad provider is connected.', 503);

        const currentWallet: any = await env.DB.prepare('SELECT coins, diamonds FROM wallet_balances WHERE user_id = ?').bind(auth.sub).first();
        const newCoins = (currentWallet?.coins || 0) + 50;

        await env.DB.batch([
          env.DB.prepare('UPDATE wallet_balances SET coins = ?, updated_at = datetime("now") WHERE user_id = ?').bind(newCoins, auth.sub),
          env.DB.prepare(
            'INSERT INTO wallet_transactions (id, user_id, currency, amount_change, balance_after, tx_type, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(crypto.randomUUID(), auth.sub, 'COINS', 50, newCoins, 'REWARDED_AD', 'ad_' + Date.now() + '_' + auth.sub)
        ]);

        return jsonResponse({
          success: true,
          message: 'Rewarded Ad bonus credited: +50 Coins',
          coins: newCoins,
          diamonds: currentWallet?.diamonds || 0,
        });
      }

      // POST /api/store/buy-diamonds
      if (url.pathname === '/api/store/buy-diamonds' && method === 'POST') {
        const auth = await authenticateRequest(request, env);
        if (!auth) return errorResponse('Unauthorized', 401);
        if (auth.is_guest) {
          return errorResponse('Guest accounts cannot perform purchases. Please continue with Google to make purchases.', 403);
        }
        return errorResponse('Purchases are unavailable until a verified checkout provider is connected.', 503);

        const body: any = await request.json().catch(() => ({}));
        const amount = Number(body.amount) || 10;
        const price = body.price || '$0.99';

        const currentWallet: any = await env.DB.prepare('SELECT coins, diamonds FROM wallet_balances WHERE user_id = ?').bind(auth.sub).first();
        const newDiamonds = (currentWallet?.diamonds || 0) + amount;

        await env.DB.batch([
          env.DB.prepare('UPDATE wallet_balances SET diamonds = ?, updated_at = datetime("now") WHERE user_id = ?').bind(newDiamonds, auth.sub),
          env.DB.prepare(
            'INSERT INTO wallet_transactions (id, user_id, currency, amount_change, balance_after, tx_type, idempotency_key, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(crypto.randomUUID(), auth.sub, 'DIAMONDS', amount, newDiamonds, 'IAP_PURCHASE', 'iap_' + Date.now() + '_' + auth.sub, JSON.stringify({ price }))
        ]);

        return jsonResponse({
          success: true,
          message: `Purchased +${amount} Diamonds successfully!`,
          coins: currentWallet?.coins || 0,
          diamonds: newDiamonds,
        });
      }

      // POST /api/store/unlock-deck
      if (url.pathname === '/api/store/unlock-deck' && method === 'POST') {
        const auth = await authenticateRequest(request, env);
        if (!auth) return errorResponse('Unauthorized', 401);

        const body: any = await request.json().catch(() => ({}));
        const { deckId } = body;

        const deck: any = await cardsDb.prepare('SELECT * FROM decks WHERE id = ? OR slug = ?').bind(deckId, deckId).first();
        if (!deck) return errorResponse('Deck not found', 404);

        const wallet: any = await coreDb.prepare('SELECT coins, diamonds FROM wallet_balances WHERE user_id = ?').bind(auth.sub).first();
        if (!wallet) return errorResponse('Wallet not found', 404);

        if (deck.price_currency === 'COINS') {
          if (wallet.coins < deck.price_amount) {
            return errorResponse(`Insufficient coins. Need ${deck.price_amount}, have ${wallet.coins}`);
          }
          const updatedCoins = wallet.coins - deck.price_amount;
          await coreDb.batch([
            coreDb.prepare('UPDATE wallet_balances SET coins = ?, updated_at = datetime("now") WHERE user_id = ?').bind(updatedCoins, auth.sub),
            coreDb.prepare(
              'INSERT INTO wallet_transactions (id, user_id, currency, amount_change, balance_after, tx_type, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(crypto.randomUUID(), auth.sub, 'COINS', -deck.price_amount, updatedCoins, 'DECK_UNLOCK', 'unlock_' + deck.id + '_' + auth.sub)
          ]);
          await cardsDb.prepare('INSERT OR IGNORE INTO deck_ownership (id, user_id, deck_id, unlock_method) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), auth.sub, deck.id, 'COINS').run();
          return jsonResponse({ success: true, message: `Deck ${deck.title} unlocked!`, coins: updatedCoins, diamonds: wallet.diamonds });
        } else if (deck.price_currency === 'DIAMONDS') {
          if (wallet.diamonds < deck.price_amount) {
            return errorResponse(`Insufficient diamonds. Need ${deck.price_amount}, have ${wallet.diamonds}`);
          }
          const updatedDiamonds = wallet.diamonds - deck.price_amount;
          await coreDb.batch([
            coreDb.prepare('UPDATE wallet_balances SET diamonds = ?, updated_at = datetime("now") WHERE user_id = ?').bind(updatedDiamonds, auth.sub),
            coreDb.prepare(
              'INSERT INTO wallet_transactions (id, user_id, currency, amount_change, balance_after, tx_type, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(crypto.randomUUID(), auth.sub, 'DIAMONDS', -deck.price_amount, updatedDiamonds, 'DECK_UNLOCK', 'unlock_' + deck.id + '_' + auth.sub)
          ]);
          await cardsDb.prepare('INSERT OR IGNORE INTO deck_ownership (id, user_id, deck_id, unlock_method) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), auth.sub, deck.id, 'DIAMONDS').run();
          return jsonResponse({ success: true, message: `Premium Deck ${deck.title} unlocked!`, coins: wallet.coins, diamonds: updatedDiamonds });
        }

        return jsonResponse({ success: true, message: 'Free deck', coins: wallet.coins, diamonds: wallet.diamonds });
      }

      // ========================================================
      // SOCIAL & FRIENDS (rvstrangers-db D1)
      // ========================================================

      // GET /api/friends
      if (url.pathname === '/api/friends' && method === 'GET') {
        const auth = await authenticateRequest(request, env);
        if (auth && auth.is_guest) {
          return jsonResponse({
            success: true,
            friends: [],
            pendingRequests: [],
            isGuest: true,
            message: 'Social features (friends and chat) are reserved for registered members.',
          });
        }
        if (!auth) return errorResponse('Unauthorized', 401);
        const userId = auth.sub;

        // Query community profiles (real friends in production)
        const { results: friends } = await coreDb.prepare(`
          SELECT id, username as handle, display_name as name, avatar_url as avatar, 'Online' as status
          FROM profiles
          WHERE id != ? AND is_guest = 0
          LIMIT 12
        `).bind(userId).all();

        // Query real pending requests from friendships table
        const { results: pendingRequests } = await coreDb.prepare(`
          SELECT f.id, p.username as handle, p.display_name as name, p.avatar_url as avatar
          FROM friendships f
          JOIN profiles p ON f.user_id = p.id
          WHERE f.friend_id = ? AND f.status = 'PENDING'
        `).bind(userId).all();

        return jsonResponse({
          success: true,
          friends: friends || [],
          pendingRequests: pendingRequests || []
        });
      }

      // ========================================================
      // PRIVATE MESSAGES (rvstrangers-messages D1)
      // ========================================================

      // GET /api/messages
      if (url.pathname === '/api/messages' && method === 'GET') {
        const auth = await authenticateRequest(request, env);
        if (!auth) return errorResponse('Unauthorized', 401);
        if (auth.is_guest) {
          return jsonResponse({
            success: true,
            messages: [],
            isGuest: true,
            message: 'Private messaging is reserved for registered members.',
          });
        }

        const { results } = await messagesDb.prepare(`
          SELECT id, sender_id, receiver_id, content, is_read, created_at
          FROM private_messages
          WHERE sender_id = ? OR receiver_id = ?
          ORDER BY created_at DESC
          LIMIT 50
        `).bind(auth.sub, auth.sub).all();

        return jsonResponse({
          success: true,
          messages: results,
        });
      }

      // POST /api/messages/send
      if (url.pathname === '/api/messages/send' && method === 'POST') {
        const auth = await authenticateRequest(request, env);
        if (!auth) return errorResponse('Unauthorized', 401);
        if (auth.is_guest) {
          return errorResponse('Guests cannot send private messages. Sign in with Google to chat.', 403);
        }

        const body: any = await request.json().catch(() => ({}));
        const { receiverId, content } = body;
        if (!receiverId || !content) return errorResponse('Receiver ID and content are required', 400);

        const messageId = crypto.randomUUID();
        await messagesDb.prepare(`
          INSERT INTO private_messages (id, sender_id, receiver_id, content, is_read, created_at)
          VALUES (?, ?, ?, ?, 0, datetime("now"))
        `).bind(messageId, auth.sub, receiverId, content).run();

        return jsonResponse({
          success: true,
          messageId,
          message: 'Message sent successfully',
        });
      }

      // ========================================================
      // CLOUDFLARE R2 ASSETS HANDLER
      // ========================================================
      if (url.pathname.startsWith('/api/assets/')) {
        const key = url.pathname.replace('/api/assets/', '');
        if (env.ASSETS) {
          const object = await env.ASSETS.get(key);
          if (object) {
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            return new Response(object.body, { headers });
          }
        }
        return errorResponse('Asset not found in R2 bucket', 404);
      }

      return errorResponse(`Route not found: ${method} ${url.pathname}`, 404);

    } catch (err: any) {
      return jsonResponse({
        success: false,
        error: err.message || 'Internal Server Error',
        stack: err.stack,
      }, 500);
    }
  }
};
