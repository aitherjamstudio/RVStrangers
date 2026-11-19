import { api } from './api';

// Augment window object with Google Identity Services definitions
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          renderButton?: (parent: HTMLElement, options: any) => void;
          cancel?: () => void;
        };
      };
    };
    __rvstrangers_gis_initialized?: boolean;
    __rvstrangers_gis_callback?: (credential: string) => void;
  }
}

class GoogleAuthService {
  private scriptPromise: Promise<boolean> | null = null;
  private clientIdPromise: Promise<string | null> | null = null;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Loads the Google Identity Services script at most once.
   */
  public loadScript(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);

    if (window.google?.accounts?.id) {
      return Promise.resolve(true);
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<boolean>((resolve) => {
      // Check if the script tag is already present in document
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]') as HTMLScriptElement | null;
      if (existing) {
        if (window.google?.accounts?.id) {
          resolve(true);
          return;
        }
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        this.scriptPromise = null;
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  /**
   * Fetches and caches the Google Client ID from backend configuration.
   */
  public getClientId(): Promise<string | null> {
    if (!this.clientIdPromise) {
      this.clientIdPromise = api.getGoogleClientId();
    }
    return this.clientIdPromise;
  }

  /**
   * Ensures Google Identity Services (GIS) is initialized only once per window lifecycle.
   * Subsequent invocations reuse the already-initialized GIS instance and update the active callback.
   */
  public async ensureInitialized(callback: (credential: string) => void): Promise<boolean> {
    // Always keep callback updated so active store handler is called
    window.__rvstrangers_gis_callback = callback;

    if (window.__rvstrangers_gis_initialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const [scriptLoaded, clientId] = await Promise.all([
          this.loadScript(),
          this.getClientId(),
        ]);

        if (!scriptLoaded) {
          console.warn('[GoogleAuth] Failed to load Google Identity Services library.');
          this.initPromise = null;
          return false;
        }

        if (!clientId) {
          console.warn('[GoogleAuth] Google Client ID is not configured.');
          this.initPromise = null;
          return false;
        }

        const accountsId = window.google?.accounts?.id;
        if (!accountsId) {
          console.warn('[GoogleAuth] google.accounts.id is unavailable.');
          this.initPromise = null;
          return false;
        }

        // Initialize GIS exactly once
        if (!window.__rvstrangers_gis_initialized) {
          accountsId.initialize({
            client_id: clientId,
            callback: (response: { credential?: string }) => {
              if (response.credential && window.__rvstrangers_gis_callback) {
                window.__rvstrangers_gis_callback(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false,
          });
          window.__rvstrangers_gis_initialized = true;
        }

        return true;
      } catch (err) {
        console.error('[GoogleAuth] Initialization error:', err);
        this.initPromise = null;
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Displays the Google sign-in prompt without re-initializing GIS.
   */
  public async promptSignIn(onCredential: (credential: string) => void): Promise<{ success: boolean; error?: string }> {
    const initialized = await this.ensureInitialized(onCredential);
    if (!initialized) {
      const clientId = await this.getClientId();
      if (!clientId) {
        return { success: false, error: 'Google sign-in is not configured yet. Use email sign-in instead.' };
      }
      return { success: false, error: 'Google sign-in could not be loaded. Please try again.' };
    }

    const accountsId = window.google?.accounts?.id;
    if (!accountsId) {
      return { success: false, error: 'Google sign-in is currently unavailable.' };
    }

    // Reset One Tap dismissal cooldown cookie to allow prompt on user request
    try {
      document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch {}

    // Cancel any previous active prompt before displaying a fresh one
    try {
      accountsId.cancel?.();
    } catch {}

    // Prompt user with One Tap / account chooser without re-initializing
    accountsId.prompt((notification: any) => {
      if (notification?.isNotDisplayed?.()) {
        const reason = notification.getNotDisplayedReason?.();
        console.warn('[GoogleAuth] One Tap not displayed:', reason);
      } else if (notification?.isSkippedMoment?.()) {
        const reason = notification.getSkippedReason?.();
        console.warn('[GoogleAuth] One Tap skipped:', reason);
      } else if (notification?.isDismissedMoment?.()) {
        const reason = notification.getDismissedReason?.();
        console.log('[GoogleAuth] One Tap dismissed by user:', reason);
      }
    });

    return { success: true };
  }

  /**
   * Returns true if GIS has already been initialized in the current page session.
   */
  public isReady(): boolean {
    return Boolean(window.__rvstrangers_gis_initialized);
  }
}

export const googleAuthService = new GoogleAuthService();
