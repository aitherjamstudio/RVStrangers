import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { api, AuthResponse } from './api';

const OAUTH_STATE_KEY = 'rvstrangers_hosted_oauth_state';

/**
 * Returns true if the application is currently running inside a native Android container (Capacitor APK).
 */
export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Generates a cryptographically random state string for OAuth CSRF protection.
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array).map((x) => charset[x % charset.length]).join('');
}

/**
 * Computes the trusted redirect URI for the active client platform.
 */
export function getClientRedirectUri(): string {
  if (isNativeAndroid()) {
    return 'com.aitherjamstudio.rvstrangers://auth';
  }
  // On Web, use the clean current origin + pathname (preserves base path such as /RVStrangers/)
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Initiates authentication by redirecting to the centralized hosted RVStrangers login portal.
 * On native Android, opens external system browser via Capacitor Browser.
 * On Web, navigates the current browser window to the hosted portal.
 */
export async function startHostedGoogleLogin(): Promise<{ success: boolean; error?: string }> {
  try {
    const state = generateRandomString(32);
    try {
      localStorage.setItem(OAUTH_STATE_KEY, state);
    } catch {}

    const redirectUri = getClientRedirectUri();
    const portalUrl = new URL(`${api.getBaseUrl()}/login`);
    portalUrl.searchParams.set('redirect_uri', redirectUri);
    portalUrl.searchParams.set('state', state);

    if (isNativeAndroid()) {
      await Browser.open({
        url: portalUrl.toString(),
        windowName: '_system',
      });
      return { success: true };
    } else {
      window.location.href = portalUrl.toString();
      return { success: true };
    }
  } catch (err: any) {
    console.error('[HostedAuth] Failed to launch hosted login portal:', err);
    return { success: false, error: err?.message || 'Could not launch login portal.' };
  }
}

/**
 * Exchanges a single-use exchange code received from the hosted login portal for a session.
 */
export async function exchangeSessionCode(
  exchangeCode: string,
  returnedState?: string | null
): Promise<AuthResponse> {
  try {
    if (returnedState) {
      const savedState = localStorage.getItem(OAUTH_STATE_KEY);
      if (savedState && savedState !== returnedState) {
        console.warn('[HostedAuth] State mismatch in OAuth return', { savedState, returnedState });
      }
      try {
        localStorage.removeItem(OAUTH_STATE_KEY);
      } catch {}
    }

    return await api.exchangeSessionCode(exchangeCode);
  } catch (err: any) {
    return { success: false, error: err.message || 'Session exchange failed.' };
  }
}

let isDeepLinkListenerRegistered = false;

/**
 * Registers Android deep link listener to handle callbacks from the hosted login portal.
 */
export function initHostedAndroidAuth(
  onSuccess: (authRes: AuthResponse) => void,
  onError: (errMsg: string) => void,
  onGuest: () => void
) {
  if (!isNativeAndroid()) return;
  if (isDeepLinkListenerRegistered) return;
  isDeepLinkListenerRegistered = true;

  App.addListener('appUrlOpen', async (data) => {
    if (!data?.url) return;
    const urlStr = data.url;
    if (
      !urlStr.startsWith('com.aitherjamstudio.rvstrangers://auth') &&
      !urlStr.startsWith('rvstrangers://auth') &&
      !urlStr.includes('://auth')
    ) {
      return;
    }

    try {
      await Browser.close().catch(() => {});

      const urlObj = new URL(urlStr);
      const exchangeCode = urlObj.searchParams.get('exchange_code');
      const state = urlObj.searchParams.get('state');
      const error = urlObj.searchParams.get('error');
      const guest = urlObj.searchParams.get('guest');

      if (error) {
        onError(`Authentication notice: ${error}`);
        return;
      }

      if (guest === '1') {
        onGuest();
        return;
      }

      if (exchangeCode) {
        const res = await exchangeSessionCode(exchangeCode, state);
        if (res && res.success) {
          onSuccess(res);
        } else {
          onError(res?.error || 'Authentication code exchange failed.');
        }
      }
    } catch (err: any) {
      console.error('[HostedAuth] Error processing deep link callback:', err);
      onError(err?.message || 'Error processing authentication callback.');
    }
  });
}

/**
 * Inspects Web URL parameters upon load. If returning from hosted login portal,
 * extracts the exchange_code, validates state, and completes session exchange.
 */
export async function checkWebHostedAuthExchange(
  onSuccess: (authRes: AuthResponse) => void,
  onError: (errMsg: string) => void,
  onGuest: () => void
) {
  if (isNativeAndroid()) return;

  try {
    const url = new URL(window.location.href);
    const exchangeCode = url.searchParams.get('exchange_code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const guest = url.searchParams.get('guest');

    if (!exchangeCode && !error && !guest) return;

    // Immediately remove exchange parameters from URL to keep address bar completely clean
    url.searchParams.delete('exchange_code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    url.searchParams.delete('guest');
    window.history.replaceState({}, document.title, url.toString());

    if (error) {
      onError(`Authentication notice: ${error}`);
      return;
    }

    if (guest === '1') {
      onGuest();
      return;
    }

    if (exchangeCode) {
      const res = await exchangeSessionCode(exchangeCode, state);
      if (res && res.success) {
        onSuccess(res);
      } else {
        onError(res?.error || 'Failed to exchange login session.');
      }
    }
  } catch (err: any) {
    console.error('[HostedAuth] Web exchange check error:', err);
  }
}
