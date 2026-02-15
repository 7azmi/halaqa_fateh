'use client';

import { GoogleAuthProvider } from '@/components/google-auth-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
}
