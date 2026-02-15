'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getGoogleClientId, getSpreadsheetId } from '@/lib/config';
import { setSheetsConfig } from '@/lib/sheets-config';
import {
  clearCachedToken,
  getCachedAccessToken,
  requestGoogleToken,
  setCachedToken,
} from '@/lib/google-auth';

type AuthContextValue = {
  accessToken: string | null;
  isSignedIn: boolean;
  isReady: boolean;
  signIn: () => Promise<string | null>;
  signOut: () => void;
  refreshToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());
  const [isReady, setIsReady] = useState(true);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const clientId = getGoogleClientId();
    if (!clientId) return null;
    return new Promise((resolve) => {
      requestGoogleToken(clientId, (token) => {
        setAccessToken(token);
        resolve(token);
      });
    });
  }, []);

  const signIn = useCallback(async (): Promise<string | null> => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      console.warn('Google Client ID not set. Add it in Settings.');
      return null;
    }
    setIsReady(false);
    try {
      const token = await new Promise<string | null>((resolve) => {
        requestGoogleToken(clientId, (t) => resolve(t));
      });
      setAccessToken(token);
      return token;
    } finally {
      setIsReady(true);
    }
  }, []);

  const signOut = useCallback(() => {
    clearCachedToken();
    setAccessToken(null);
    setSheetsConfig(null, null);
  }, []);

  useEffect(() => {
    if (accessToken && getSpreadsheetId()) {
      setSheetsConfig(getSpreadsheetId(), accessToken);
    } else if (!accessToken) {
      setSheetsConfig(null, null);
    }
  }, [accessToken]);

  const value: AuthContextValue = {
    accessToken,
    isSignedIn: !!accessToken,
    isReady,
    signIn,
    signOut,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useGoogleAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  return ctx;
}
