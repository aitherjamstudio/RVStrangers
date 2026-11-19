import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { api, AuthResponse } from './api';

const OAUTH_STATE_KEY = 'rvstrangers_android_oauth_state';
const OAUTH_VERIFIER_KEY = 'rvstrangers_android_oauth_verifier';

/**
 * Returns true if the application is currently running inside a native Android container (Capacitor APK).
 */
export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Generates a cryptographically secure random string for OAuth state and PKCE verifier.
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array).map((x) => charset[x % charset.length]).join('');
}

/**
 * Derives a base64url-encoded SHA-256 code challenge from a code verifier (RFC 7636).
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Initiates external system browser OAuth flow with PKCE for Android APK.
 */
export async function startAndroidGoogleOAuth(): Promise<{ success: boolean; error?: string }> {
  try {
    const clientId = await api.getGoogleClientId();
    if (!clientId) {
      return { success: false, error: 'Google sign-in is not configured on the server.' };
    }

    const state = generateRandomString(32);
    const verifier = generateRandomString(64);
    const challenge = await generateCodeChallenge(verifier);

    // Persist state and verifier locally for validation on deep link return
    try {
      localStorage.setItem(OAUTH_STATE_KEY, state);
      localStorage.setItem(OAUTH_VERIFIER_KEY, verifier);
    } catch {}

    const redirectUri = `${api.getBaseUrl()}/api/auth/google/callback`;
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('prompt', 'select_account');

    // Open system browser (external browser, not embedded WebView)
    await Browser.open({
      url: authUrl.toString(),
      windowName: '_system',
    });

    return { success: true };
  } catch (err: any) {
    console.error('[AndroidAuth] Error opening system browser for Google OAuth:', err);
    return { success: false, error: err?.message || 'Could not open system browser for Google sign-in.' };
  }
}

let isDeepLinkListenerRegistered = false;

/**
 * Handles incoming deep link URL (e.g. com.aitherjamstudio.rvstrangers://auth?code=...&state=...)
 */
async function processDeepLinkUrl(
  urlStr: string,
  onSuccess: (authRes: AuthResponse) => void,
  onError: (err: string) => void
) {
  if (!urlStr) return;

  // Verify URL is an auth callback
  const isAuthDeepLink =
    urlStr.startsWith('com.aitherjamstudio.rvstrangers://auth') ||
    urlStr.startsWith('rvstrangers://auth') ||
    urlStr.includes('://auth');

  if (!isAuthDeepLink) return;

  // Close external browser tab once redirected to app
  try {
    await Browser.close().catch(() => {});
  } catch {}

  try {
    // Parse query parameters
    let search = '';
    const queryIndex = urlStr.indexOf('?');
    if (queryIndex !== -1) {
      search = urlStr.substring(queryIndex);
    }
    const params = new URLSearchParams(search);

    const error = params.get('error');
    if (error) {
      onError(`Google sign-in was canceled: ${error}`);
      return;
    }

    const code = params.get('code');
    const returnedState = params.get('state');

    const savedState = localStorage.getItem(OAUTH_STATE_KEY);
    const verifier = localStorage.getItem(OAUTH_VERIFIER_KEY);

    // Clean up one-time verification tokens
    try {
      localStorage.removeItem(OAUTH_STATE_KEY);
      localStorage.removeItem(OAUTH_VERIFIER_KEY);
    } catch {}

    // Security check: validate OAuth state to prevent CSRF
    if (!returnedState || returnedState !== savedState) {
      onError('Security validation failed: invalid OAuth state. Please try again.');
      return;
    }

    if (!code) {
      onError('Google sign-in failed: no authorization code returned.');
      return;
    }

    if (!verifier) {
      onError('Google sign-in failed: PKCE code verifier expired. Please try again.');
      return;
    }

    // Securely exchange authorization code + PKCE verifier via Cloudflare Worker
    const redirectUri = `${api.getBaseUrl()}/api/auth/google/callback`;
    const authRes = await api.exchangeGoogleAuthCode(code, verifier, redirectUri);

    if (authRes && authRes.success && authRes.user && authRes.token) {
      onSuccess(authRes);
    } else {
      onError(authRes?.error || 'Failed to exchange authorization code with server.');
    }
  } catch (err: any) {
    console.error('[AndroidAuth] Error handling deep link:', err);
    onError(err?.message || 'Error processing Google sign-in response.');
  }
}

/**
 * Initializes deep link listeners for Android native APK.
 * Should be called once on app initialization.
 */
export function initAndroidAuth(
  onSuccess: (authRes: AuthResponse) => void,
  onError: (err: string) => void
) {
  if (!isNativeAndroid() || isDeepLinkListenerRegistered) return;

  isDeepLinkListenerRegistered = true;

  // 1. Listen for deep links when app is in background or resumed
  App.addListener('appUrlOpen', (event) => {
    processDeepLinkUrl(event.url, onSuccess, onError);
  });

  // 2. Check if app was cold-started from a deep link
  App.getLaunchUrl().then((launchUrl) => {
    if (launchUrl?.url) {
      processDeepLinkUrl(launchUrl.url, onSuccess, onError);
    }
  }).catch(() => {});
}
