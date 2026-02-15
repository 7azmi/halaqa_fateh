'use client';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string; error?: string }) => void;
          }) => { requestAccessToken: (config?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export type AuthState = {
  accessToken: string | null;
  email: string | null;
  isReady: boolean;
};

let cachedToken: string | null = null;
let tokenExpiry = 0;
const TOKEN_BUFFER_MS = 60_000; // refresh 1 min before expiry

export function isTokenValid(): boolean {
  return !!cachedToken && Date.now() < tokenExpiry - TOKEN_BUFFER_MS;
}

export function getCachedAccessToken(): string | null {
  return isTokenValid() ? cachedToken : null;
}

export function setCachedToken(token: string, expiresInSeconds?: number): void {
  cachedToken = token;
  tokenExpiry = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : Date.now() + 3600 * 1000;
}

export function clearCachedToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

/**
 * Request a fresh access token via Google Identity Services.
 * Requires clientId to be set (localStorage or env).
 * Calls callback with access_token or error.
 */
export async function requestGoogleToken(
  clientId: string,
  callback: (token: string | null, error?: string) => void
): Promise<void> {
  await loadScript();
  if (!window.google?.accounts?.oauth2) {
    callback(null, 'Google Sign-In not loaded');
    return;
  }
  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (response) => {
      if (response.error) {
        clearCachedToken();
        callback(null, response.error);
        return;
      }
      if (response.access_token) {
        setCachedToken(response.access_token);
        callback(response.access_token);
      }
    },
  });
  client.requestAccessToken({ prompt: '' });
}

/**
 * Get a valid access token: use cache if still valid, else trigger token request.
 * Returns a promise that resolves with the token when user has signed in.
 */
export function getAccessToken(clientId: string): Promise<string | null> {
  if (isTokenValid() && cachedToken) return Promise.resolve(cachedToken);
  return new Promise((resolve) => {
    requestGoogleToken(clientId, (token) => resolve(token));
  });
}
