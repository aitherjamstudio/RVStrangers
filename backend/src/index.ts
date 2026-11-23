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

// Interface for unified Google user session result
interface UserSessionResult {
  token: string;
  user: {
    id: string;
    name: string;
    email?: string;
    handle: string;
    avatar: string;
    isGuest: boolean;
  };
  wallet: {
    coins: number;
    diamonds: number;
  };
}

// Helper: Securely find or create profile in D1 and issue session JWT
async function createOrGetGoogleUserSession(googleUser: any, env: Env, secret: string): Promise<UserSessionResult> {
  const googleId = googleUser.sub;
  const userEmail = (googleUser.email || '').toLowerCase();
  const displayName = googleUser.name || userEmail.split('@')[0] || 'Player';
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

  return {
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
    },
  };
}

async function handleGoogleUserSession(googleUser: any, env: Env, secret: string): Promise<Response> {
  const result = await createOrGetGoogleUserSession(googleUser, env, secret);
  return jsonResponse({
    success: true,
    ...result,
  });
}

// --------------------------------------------------------
// OAuth State & Security Whitelist Helpers
// --------------------------------------------------------
interface OAuthStateData {
  r: string; // redirect_uri
  s: string; // client_state
  t: number; // timestamp
}

async function signOAuthState(data: OAuthStateData, secret: string): Promise<string> {
  const jsonStr = JSON.stringify(data);
  const encodedData = stringToBase64Url(jsonStr);
  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedData));
  const encodedSig = bytesToBase64Url(new Uint8Array(signature));
  return `${encodedData}.${encodedSig}`;
}

async function verifyOAuthState(stateString: string, secret: string): Promise<OAuthStateData | null> {
  try {
    const parts = stateString.split('.');
    if (parts.length !== 2) return null;
    const [encodedData, encodedSig] = parts;
    const key = await getCryptoKey(secret);
    const sigBytes = base64UrlToBytes(encodedSig);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(encodedData));
    if (!isValid) return null;

    const data: OAuthStateData = JSON.parse(base64UrlToString(encodedData));
    if (Date.now() - data.t > 15 * 60 * 1000) return null; // 15-minute validity window
    return data;
  } catch {
    return null;
  }
}

function isTrustedRedirectUri(uri: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  // Android APK Deep Links
  if (
    uri.startsWith('com.aitherjamstudio.rvstrangers://auth') ||
    uri.startsWith('rvstrangers://auth')
  ) {
    return true;
  }
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Production Web Client (GitHub Pages)
    if (parsed.hostname === 'aitherjamstudio.github.io') {
      return parsed.pathname.startsWith('/RVStrangers');
    }
    // Localhost Development
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0'
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function renderDeepLinkBridgeHtml(deepLink: string, fallbackLink: string, error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>RVStrangers - Returning</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      background: #0B0114;
      color: #FFFFFF;
      font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: linear-gradient(180deg, #180429 0%, #0E0119 100%);
      border: 1px solid rgba(217, 70, 239, 0.4);
      box-shadow: 0 0 40px rgba(236, 72, 153, 0.35);
      border-radius: 32px;
      padding: 40px 28px;
      max-width: 380px;
      width: 100%;
      box-sizing: border-box;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(217, 70, 239, 0.2);
      border-top-color: #F43F9E;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      margin: 0 0 12px;
      font-size: 20px;
      font-weight: 800;
      color: #FFFFFF;
    }
    p {
      color: rgba(233, 213, 255, 0.85);
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 28px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 16px 20px;
      background: #FFFFFF;
      color: #140224;
      font-weight: 800;
      font-size: 15px;
      border-radius: 9999px;
      text-decoration: none;
      box-shadow: 0 0 30px rgba(236, 72, 153, 0.5);
      box-sizing: border-box;
      transition: transform 0.15s ease;
    }
    .btn:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>${error ? 'Authentication Notice' : 'Returning to RVStrangers'}</h2>
    <p>${error ? error : 'Identity verified. Returning you to your game...'}</p>
    <a href="${deepLink}" class="btn">Open RVStrangers</a>
  </div>
  <script>
    const deepLink = ${JSON.stringify(deepLink)};
    const fallbackLink = ${JSON.stringify(fallbackLink)};
    try {
      window.location.replace(deepLink);
    } catch (e) {
      window.location.href = deepLink;
    }
    setTimeout(() => {
      try { window.location.href = fallbackLink; } catch (e) {}
    }, 1200);
  </script>
</body>
</html>`;
}

function renderSecurityErrorHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>RVStrangers - Security Notice</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      background: #0B0114;
      color: #FFFFFF;
      font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: linear-gradient(180deg, #180429 0%, #0E0119 100%);
      border: 1px solid rgba(239, 68, 68, 0.4);
      box-shadow: 0 0 40px rgba(239, 68, 68, 0.25);
      border-radius: 32px;
      padding: 40px 28px;
      max-width: 380px;
      width: 100%;
      box-sizing: border-box;
    }
    .icon {
      font-size: 40px;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 20px;
      font-weight: 800;
      color: #F87171;
    }
    p {
      color: rgba(233, 213, 255, 0.85);
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 28px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 16px 20px;
      background: #FFFFFF;
      color: #140224;
      font-weight: 800;
      font-size: 15px;
      border-radius: 9999px;
      text-decoration: none;
      box-shadow: 0 0 25px rgba(255, 255, 255, 0.2);
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🛡️</div>
    <h2>${title}</h2>
    <p>${message}</p>
    <a href="https://aitherjamstudio.github.io/RVStrangers/" class="btn">Return to RVStrangers</a>
  </div>
</body>
</html>`;
}

function renderHostedLoginHtml(googleAuthUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>RVStrangers - Welcome</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    html, body {
      width: 100%;
      height: 100%;
      height: 100dvh;
      max-height: 100dvh;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #07000E;
      color: #FFFFFF;
      font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      -webkit-font-smoothing: antialiased;
    }
    /* Ambient Glows */
    .glow-top-left {
      position: fixed;
      top: -80px;
      left: -80px;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 46, 147, 0.35) 0%, rgba(138, 43, 226, 0.15) 50%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }
    .glow-bottom-right {
      position: fixed;
      bottom: -80px;
      right: -80px;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(217, 70, 239, 0.3) 0%, rgba(138, 43, 226, 0.15) 50%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }
    /* Mobile Card Frame (Fixed Viewport, Zero Scrolling) */
    .app-frame {
      position: relative;
      width: 100%;
      height: 100%;
      height: 100dvh;
      max-height: 100dvh;
      max-width: 430px;
      background: linear-gradient(180deg, #130222 0%, #0D011A 50%, #07000E 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px 16px;
      overflow: hidden;
      box-sizing: border-box;
    }
    @media (min-width: 480px) {
      body {
        padding: 14px;
      }
      .app-frame {
        height: auto;
        max-height: min(800px, 94vh);
        border-radius: 40px;
        border: 1px solid rgba(217, 70, 239, 0.25);
        box-shadow: 0 0 60px rgba(217, 70, 239, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.12);
        padding: 22px 24px 24px;
      }
    }
    /* Angled Floating Cards in Corners */
    .floating-card-left {
      position: absolute;
      top: -12px;
      left: -16px;
      width: 80px;
      height: 120px;
      border-radius: 16px;
      background: rgba(35, 9, 56, 0.45);
      border: 1px solid rgba(217, 70, 239, 0.3);
      box-shadow: 0 0 20px rgba(217, 70, 239, 0.2);
      transform: rotate(-26deg);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      opacity: 0.75;
      backdrop-filter: blur(2px);
    }
    .floating-card-right {
      position: absolute;
      top: -12px;
      right: -16px;
      width: 80px;
      height: 120px;
      border-radius: 16px;
      background: rgba(35, 9, 56, 0.45);
      border: 1px solid rgba(217, 70, 239, 0.3);
      box-shadow: 0 0 20px rgba(217, 70, 239, 0.2);
      transform: rotate(26deg);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      opacity: 0.75;
      backdrop-filter: blur(2px);
    }
    .heart-icon, .star-icon {
      width: 26px;
      height: 26px;
      fill: #F43F9E;
      filter: drop-shadow(0 0 8px rgba(244, 63, 158, 0.9));
    }
    /* Central 3D Deck Box Hero */
    .deck-hero-wrap {
      position: relative;
      width: 150px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      flex-shrink: 0;
    }
    .aura-glow {
      position: absolute;
      inset: 12px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 46, 147, 0.85) 0%, rgba(217, 70, 239, 0.65) 45%, rgba(139, 92, 246, 0.3) 70%, transparent 80%);
      filter: blur(22px);
      pointer-events: none;
      animation: pulseGlow 3s ease-in-out infinite alternate;
    }
    @keyframes pulseGlow {
      0% { opacity: 0.75; transform: scale(0.96); }
      100% { opacity: 0.95; transform: scale(1.04); }
    }
    .ground-shadow {
      position: absolute;
      bottom: -6px;
      width: 130px;
      height: 14px;
      border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(112, 26, 117, 0.4) 60%, transparent 80%);
      filter: blur(4px);
      pointer-events: none;
    }
    .deck-canvas-box {
      position: relative;
      width: 100%;
      height: 100%;
      z-index: 10;
      cursor: grab;
    }
    .deck-canvas-box:active {
      cursor: grabbing;
    }
    .deck-canvas-box canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
    /* Branding */
    .title-group {
      text-align: center;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      font-style: italic;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .brand-rv {
      color: #FFFFFF;
      text-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);
    }
    .brand-strangers {
      background: linear-gradient(90deg, #FF3EA5 0%, #F43F9E 50%, #E026D8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 16px rgba(244, 63, 158, 0.6));
    }
    .brand-subtitle {
      color: rgba(243, 232, 255, 0.85);
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.2px;
      margin-top: 3px;
    }
    .heart-divider-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 6px;
      opacity: 0.9;
    }
    .heart-divider-line {
      width: 44px;
      height: 1.5px;
      background: linear-gradient(to right, transparent, rgba(236, 72, 153, 0.75), #EC4899);
    }
    .heart-divider-line-rev {
      background: linear-gradient(to left, transparent, rgba(236, 72, 153, 0.75), #EC4899);
    }
    .heart-divider-svg {
      width: 12px;
      height: 12px;
      fill: #F43F9E;
      filter: drop-shadow(0 0 6px rgba(244, 63, 158, 0.95));
    }
    /* 3 Feature Pillars */
    .pillars-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 300px;
      margin: 10px 0 4px;
      padding: 0 4px;
      flex-shrink: 0;
    }
    .pillar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .pillar-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15);
    }
    .pillar-svg {
      width: 17px;
      height: 17px;
      stroke: #E9D5FF;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }
    .pillar-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #E9D5FF;
      text-align: center;
      line-height: 1.2;
      margin-top: 4px;
    }
    .pillar-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
    }
    /* Buttons */
    .actions-box {
      width: 100%;
      max-width: 350px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 10;
      margin-bottom: 2px;
      flex-shrink: 0;
    }
    .btn-google {
      width: 100%;
      height: 48px;
      padding: 0 20px;
      border-radius: 9999px;
      background: #FFFFFF;
      color: #140224;
      font-weight: 800;
      font-size: 14px;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 0 35px rgba(236, 72, 153, 0.5);
      transition: all 0.2s ease;
      border: 1px solid #FFFFFF;
    }
    .btn-google:hover {
      box-shadow: 0 0 45px rgba(236, 72, 153, 0.7);
      background: #FAFAFA;
      transform: translateY(-1px);
    }
    .btn-google:active {
      transform: scale(0.98);
    }
    /* Subtle Pagination Dots */
    .dots-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(217, 70, 239, 0.4);
    }
    .dot-active {
      width: 6px;
      height: 6px;
      background: #FF2E93;
      box-shadow: 0 0 8px #FF2E93;
    }
  </style>
</head>
<body>
  <div class="glow-top-left"></div>
  <div class="glow-bottom-right"></div>

  <div class="app-frame">
    <!-- Top Floating Angled Cards -->
    <div class="floating-card-left">
      <svg class="heart-icon" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
    <div class="floating-card-right">
      <svg class="star-icon" viewBox="0 0 24 24">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
      </svg>
    </div>

    <!-- Center Content -->
    <div style="width: 100%; display: flex; flex-direction: column; align-items: center; margin: auto 0; overflow: hidden;">
      <!-- Central 3D Deck Box Hero -->
      <div class="deck-hero-wrap">
        <div class="aura-glow"></div>
        <div class="ground-shadow"></div>
        <div id="deckCanvasWrap" class="deck-canvas-box">
          <img id="deckFallbackImg" src="/api/assets/textures/default_box_texture.webp" alt="RVStrangers Deck" style="position: absolute; inset: 4px; width: calc(100% - 8px); height: calc(100% - 8px); object-fit: contain; filter: drop-shadow(0 0 16px rgba(255,46,147,0.75)); transition: opacity 0.5s ease; pointer-events: none; border-radius: 12px; z-index: 1;" />
        </div>
      </div>

      <!-- Title & Tagline -->
      <div class="title-group">
        <h1 class="brand-title">
          <span class="brand-rv">RV</span><span class="brand-strangers">Strangers</span>
        </h1>
        <p class="brand-subtitle">Built for meaningful connections.</p>
        <div class="heart-divider-row">
          <div class="heart-divider-line"></div>
          <svg class="heart-divider-svg" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <div class="heart-divider-line heart-divider-line-rev"></div>
        </div>
      </div>

      <!-- 3 Feature Pillars -->
      <div class="pillars-row">
        <div class="pillar-item">
          <div class="pillar-icon-box">
            <svg class="pillar-svg" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span class="pillar-label">Meet<br/>New People</span>
        </div>

        <div class="pillar-divider"></div>

        <div class="pillar-item">
          <div class="pillar-icon-box">
            <svg class="pillar-svg" viewBox="0 0 24 24">
              <rect x="3" y="5" width="13" height="15" rx="2" transform="rotate(-6 3 5)" />
              <rect x="8" y="3" width="13" height="15" rx="2" transform="rotate(6 8 3)" />
              <path d="M14.5 9.5l.6 1.2 1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6 1.2-.6z" fill="currentColor" />
            </svg>
          </div>
          <span class="pillar-label">Play<br/>Card Games</span>
        </div>

        <div class="pillar-divider"></div>

        <div class="pillar-item">
          <div class="pillar-icon-box">
            <svg class="pillar-svg" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span class="pillar-label">Chat<br/>& Connect</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions-box">
      <!-- Continue with Google -->
      <a href="${googleAuthUrl}" class="btn-google">
        <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        </div>
        <span style="flex: 1; text-align: center; color: #140224; font-weight: 800; font-size: 14px;">
          Continue with Google
        </span>
        <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0;">
          <svg style="width: 18px; height: 18px; stroke: #140224; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round;" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </a>
    </div>

    <!-- Bottom Pagination Dots -->
    <div class="dots-row">
      <div class="dot"></div>
      <div class="dot dot-active"></div>
      <div class="dot"></div>
    </div>
  </div>

  <!-- Import Map & 3D Deck Box WebGL Module Script -->
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    try {
      const container = document.getElementById('deckCanvasWrap');
      if (container) {
        const width = container.clientWidth || 150;
        const height = container.clientHeight || 180;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 10);
        camera.position.set(0, 0, 0.24);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
        keyLight.position.set(-0.8, 1.8, 2.5);
        scene.add(keyLight);

        const rightRimLight = new THREE.DirectionalLight(0xff2e93, 4.6);
        rightRimLight.position.set(2.5, 1.0, -0.6);
        scene.add(rightRimLight);

        const leftRimLight = new THREE.DirectionalLight(0xd946ef, 2.6);
        leftRimLight.position.set(-2.5, 0.8, -0.6);
        scene.add(leftRimLight);

        const topLight = new THREE.DirectionalLight(0xf43f8e, 3.2);
        topLight.position.set(0, 3.0, 0.1);
        scene.add(topLight);

        const bottomFill = new THREE.DirectionalLight(0xa855f7, 1.3);
        bottomFill.position.set(0, -2.0, 1.0);
        scene.add(bottomFill);

        const pivotGroup = new THREE.Group();
        scene.add(pivotGroup);
        pivotGroup.rotation.x = 0.06;
        pivotGroup.rotation.y = 0.32;

        const gltfLoader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();

        gltfLoader.load('/api/assets/models/default_box.glb', (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          model.position.set(-center.x, -center.y, -center.z);
          pivotGroup.add(model);

          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          const cameraDistance = (maxDim / 2) / Math.tan(fov / 2) * 1.22;
          camera.position.z = Math.max(cameraDistance, 0.23);
          camera.lookAt(0, 0, 0);

          textureLoader.load('/api/assets/textures/default_box_texture.webp', (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.flipY = false;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.22, metalness: 0.05 });
            model.traverse((child) => {
              if (child.isMesh) child.material = mat;
            });
            const fallback = document.getElementById('deckFallbackImg');
            if (fallback) {
              fallback.style.opacity = '0';
              setTimeout(() => fallback.remove(), 500);
            }
          });
        });

        let isDragging = false;
        let prevX = 0, prevY = 0;
        let userRotY = 0, currentRotX = 0.06;
        let velX = 0, velY = 0;
        let lastTime = performance.now();

        const onDown = (e) => {
          isDragging = true;
          const cx = e.touches ? e.touches[0].clientX : e.clientX;
          const cy = e.touches ? e.touches[0].clientY : e.clientY;
          prevX = cx; prevY = cy;
          velX = 0; velY = 0;
          lastTime = performance.now();
        };

        const onMove = (e) => {
          if (!isDragging) return;
          const cx = e.touches ? e.touches[0].clientX : e.clientX;
          const cy = e.touches ? e.touches[0].clientY : e.clientY;
          velX = (cx - prevX) * 0.012;
          velY = (cy - prevY) * 0.012;
          userRotY += velX;
          currentRotX = Math.max(-0.65, Math.min(0.65, currentRotX + velY));
          prevX = cx; prevY = cy;
          lastTime = performance.now();
        };

        const onUp = () => { isDragging = false; };

        const domEl = renderer.domElement;
        domEl.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        domEl.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);

        let clock = new THREE.Clock();
        const animate = () => {
          requestAnimationFrame(animate);
          const elapsed = clock.getElapsedTime();
          if (!isDragging) {
            velX *= 0.92; velY *= 0.92;
            userRotY += velX;
            currentRotX = Math.max(-0.65, Math.min(0.65, currentRotX + velY));
            if ((performance.now() - lastTime) / 1000 > 1.0) {
              userRotY *= 0.96;
              currentRotX += (0.06 - currentRotX) * 0.04;
            }
          }
          pivotGroup.rotation.y = 0.32 + userRotY + Math.sin(elapsed * 1.1) * 0.12;
          pivotGroup.rotation.x = currentRotX + Math.cos(elapsed * 0.8) * 0.03;
          pivotGroup.position.y = Math.sin(elapsed * 1.5) * 0.0035;
          renderer.render(scene, camera);
        };
        animate();
      }
    } catch (e) {
      console.warn('3D preview init error:', e);
    }
  </script>
</body>
</html>`;
}

function redirectToDestination(redirectUri: string, params: Record<string, string>): Response {
  if (redirectUri.startsWith('com.aitherjamstudio.rvstrangers://') || redirectUri.startsWith('rvstrangers://')) {
    const deepLinkUrl = new URL(redirectUri);
    for (const [k, v] of Object.entries(params)) {
      if (v) deepLinkUrl.searchParams.set(k, v);
    }
    const fullDeepLink = deepLinkUrl.toString();
    const fallbackLink = fullDeepLink.replace('com.aitherjamstudio.rvstrangers://', 'rvstrangers://');
    return new Response(renderDeepLinkBridgeHtml(fullDeepLink, fallbackLink, params.error), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  const target = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) {
    if (v) target.searchParams.set(k, v);
  }
  return Response.redirect(target.toString(), 302);
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
    if (env.STATIC_ASSETS && !url.pathname.startsWith('/api/') && url.pathname !== '/health' && url.pathname !== '/login') {
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

      // GET /login or /api/auth/login (Centralized Branded RVStrangers Hosted OAuth Portal)
      if ((url.pathname === '/login' || url.pathname === '/auth/login' || url.pathname === '/api/auth/login') && method === 'GET') {
        const redirectUri = url.searchParams.get('redirect_uri') || 'https://aitherjamstudio.github.io/RVStrangers/';
        const clientState = url.searchParams.get('state') || '';

        if (!isTrustedRedirectUri(redirectUri)) {
          return new Response(
            renderSecurityErrorHtml(
              'Untrusted Redirect Destination',
              'For your security, this authentication portal only connects to authorized RVStrangers applications.'
            ),
            {
              status: 400,
              headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
            }
          );
        }

        const statePayload: OAuthStateData = {
          r: redirectUri,
          s: clientState,
          t: Date.now(),
        };
        const signedState = await signOAuthState(statePayload, secret);

        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleAuthUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID || '');
        googleAuthUrl.searchParams.set('redirect_uri', `${url.origin}/api/auth/google/callback`);
        googleAuthUrl.searchParams.set('response_type', 'code');
        googleAuthUrl.searchParams.set('scope', 'openid email profile');
        googleAuthUrl.searchParams.set('state', signedState);
        googleAuthUrl.searchParams.set('prompt', 'select_account');

        const html = renderHostedLoginHtml(googleAuthUrl.toString());
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0',
            ...corsHeaders,
          },
        });
      }

      // GET /api/auth/google/config
      if (url.pathname === '/api/auth/google/config' && method === 'GET') {
        return jsonResponse({ clientId: env.GOOGLE_CLIENT_ID || null });
      }

      // POST /api/auth/google (Web One Tap / Direct Token Verification)
      if (url.pathname === '/api/auth/google' && method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const { credential } = body;
        if (!credential || !env.GOOGLE_CLIENT_ID) return errorResponse('Google sign-in is not configured.', 503);

        const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (!verification.ok) return errorResponse('Google could not verify this sign-in.', 401);
        const googleUser: any = await verification.json();
        if (googleUser.aud !== env.GOOGLE_CLIENT_ID || googleUser.email_verified !== 'true' || !googleUser.sub || !googleUser.email) {
          return errorResponse('Google sign-in verification failed.', 401);
        }

        return handleGoogleUserSession(googleUser, env, secret);
      }

      // GET /api/auth/google/callback (Google OAuth Redirect Callback)
      if (url.pathname === '/api/auth/google/callback' && method === 'GET') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state') || '';
        const error = url.searchParams.get('error');

        const stateData = await verifyOAuthState(state, secret);
        if (!stateData || !isTrustedRedirectUri(stateData.r)) {
          return new Response(
            renderSecurityErrorHtml(
              'Authentication Verification Failed',
              'The authentication request was invalid, tampered with, or expired. Please return to the app and try signing in again.'
            ),
            {
              status: 400,
              headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
            }
          );
        }

        const redirectUri = stateData.r;
        const clientState = stateData.s;

        if (error) {
          return redirectToDestination(redirectUri, { error, state: clientState });
        }

        if (!code) {
          return redirectToDestination(redirectUri, { error: 'Missing authorization code from Google', state: clientState });
        }

        if (!env.GOOGLE_CLIENT_ID) {
          return redirectToDestination(redirectUri, { error: 'Google sign-in is not configured on the server.', state: clientState });
        }

        const tokenParams = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${url.origin}/api/auth/google/callback`,
        });
        if (env.GOOGLE_CLIENT_SECRET) {
          tokenParams.set('client_secret', env.GOOGLE_CLIENT_SECRET);
        }

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenParams.toString(),
        });

        if (!tokenRes.ok) {
          const errData: any = await tokenRes.json().catch(() => ({}));
          const errMsg = errData.error_description || errData.error || 'Failed to exchange authorization code with Google.';
          return redirectToDestination(redirectUri, { error: errMsg, state: clientState });
        }

        const tokenData: any = await tokenRes.json();
        const idToken = tokenData.id_token;
        let googleUser: any = null;

        if (idToken) {
          const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
          if (verification.ok) {
            const parsed: any = await verification.json();
            if (parsed.aud === env.GOOGLE_CLIENT_ID && parsed.email_verified === 'true' && parsed.sub && parsed.email) {
              googleUser = parsed;
            }
          }
        }

        if (!googleUser && tokenData.access_token) {
          const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (userinfoRes.ok) {
            const parsed: any = await userinfoRes.json();
            if (parsed.sub && parsed.email) {
              googleUser = parsed;
            }
          }
        }

        if (!googleUser) {
          return redirectToDestination(redirectUri, { error: 'Could not verify your Google account profile.', state: clientState });
        }

        // Create or retrieve session in D1
        const sessionData = await createOrGetGoogleUserSession(googleUser, env, secret);

        // Generate single-use exchange code (60-second TTL)
        const exchangeCode = 'exc_' + crypto.randomUUID().replace(/-/g, '');
        const expiresAt = Date.now() + 60 * 1000;

        await env.DB.prepare(
          'INSERT INTO auth_exchange_codes (code, token, user_id, expires_at) VALUES (?, ?, ?, ?)'
        ).bind(exchangeCode, sessionData.token, sessionData.user.id, expiresAt).run();

        // Securely redirect to originating destination (Zero tokens in URL!)
        return redirectToDestination(redirectUri, {
          exchange_code: exchangeCode,
          state: clientState,
        });
      }

      // POST /api/auth/session/exchange (Secure One-Time Code Exchange)
      if (url.pathname === '/api/auth/session/exchange' && method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const { exchange_code } = body;

        if (!exchange_code || typeof exchange_code !== 'string') {
          return errorResponse('Missing exchange_code parameter.', 400);
        }

        const row: any = await env.DB.prepare(
          'SELECT code, token, user_id, expires_at FROM auth_exchange_codes WHERE code = ?'
        ).bind(exchange_code).first();

        if (!row) {
          return errorResponse('Invalid or already consumed exchange code.', 401);
        }

        // Atomically delete the code to guarantee single-use
        await env.DB.prepare('DELETE FROM auth_exchange_codes WHERE code = ?').bind(exchange_code).run();

        if (row.expires_at < Date.now()) {
          return errorResponse('Exchange code has expired. Please sign in again.', 401);
        }

        // Asynchronously clean up stale expired codes
        env.DB.prepare('DELETE FROM auth_exchange_codes WHERE expires_at < ?').bind(Date.now()).run().catch(() => {});

        // Fetch verified user from D1
        const user: any = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(row.user_id).first();
        if (!user) {
          return errorResponse('User profile not found.', 404);
        }

        const wallet: any = await env.DB.prepare('SELECT coins, diamonds FROM wallet_balances WHERE user_id = ?').bind(user.id).first() || { coins: 0, diamonds: 0 };

        return jsonResponse({
          success: true,
          token: row.token,
          user: {
            id: user.id,
            name: user.display_name,
            email: user.email,
            handle: user.username,
            avatar: user.avatar_url,
            isGuest: Boolean(user.is_guest),
          },
          wallet: {
            coins: wallet.coins,
            diamonds: wallet.diamonds,
          },
        });
      }

      // POST /api/auth/google/exchange (Android APK Authorization Code + PKCE Verifier Exchange)
      if (url.pathname === '/api/auth/google/exchange' && method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const { code, code_verifier, redirect_uri } = body;

        if (!code || !code_verifier || !redirect_uri) {
          return errorResponse('Missing code, code_verifier, or redirect_uri for OAuth exchange.', 400);
        }
        if (!env.GOOGLE_CLIENT_ID) {
          return errorResponse('Google sign-in is not configured.', 503);
        }

        const tokenParams = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          code,
          code_verifier,
          grant_type: 'authorization_code',
          redirect_uri,
        });
        if (env.GOOGLE_CLIENT_SECRET) {
          tokenParams.set('client_secret', env.GOOGLE_CLIENT_SECRET);
        }

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenParams.toString(),
        });

        if (!tokenRes.ok) {
          const errData: any = await tokenRes.json().catch(() => ({}));
          return errorResponse(errData.error_description || errData.error || 'Failed to exchange authorization code with Google.', 401);
        }

        const tokenData: any = await tokenRes.json();
        const idToken = tokenData.id_token;

        let googleUser: any = null;

        if (idToken) {
          const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
          if (verification.ok) {
            const parsed: any = await verification.json();
            if (parsed.aud === env.GOOGLE_CLIENT_ID && parsed.email_verified === 'true' && parsed.sub && parsed.email) {
              googleUser = parsed;
            }
          }
        }

        // Fallback: If id_token not verified or missing, use access_token with userinfo endpoint
        if (!googleUser && tokenData.access_token) {
          const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (userinfoRes.ok) {
            const parsed: any = await userinfoRes.json();
            if (parsed.sub && parsed.email) {
              googleUser = parsed;
            }
          }
        }

        if (!googleUser) {
          return errorResponse('Google OAuth token verification failed.', 401);
        }

        return handleGoogleUserSession(googleUser, env, secret);
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
            Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
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
