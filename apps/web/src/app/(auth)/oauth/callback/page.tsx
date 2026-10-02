'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { authApi } from '@/lib/api';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const isHydrated = useUserStore((s) => s.isHydrated);
  const setUser = useUserStore((s) => s.setUser);
  
  // Guard against strict mode double-firing
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (!isHydrated || hasProcessed.current) return;
    
    // Hash is in the format #accessToken=...&refreshToken=...&expiresIn=...
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const expiresIn = params.get('expiresIn');

    if (!accessToken || !refreshToken || !expiresIn) {
      router.replace('/login?error=InvalidOAuthTokens');
      return;
    }
    
    hasProcessed.current = true;
    
    // Set the cookie for Next.js middleware (7 days to match refresh token)
    document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax; Secure`;
    
    // Fetch user profile
    authApi.me(accessToken).then((profile) => {
      setUser(profile, {
        accessToken,
        refreshToken,
        expiresIn: parseInt(expiresIn, 10),
      });
      router.replace('/dashboard');
    }).catch((err) => {
      console.error('Failed to fetch OAuth user profile', err);
      router.replace('/login?error=OAuthProfileFetchFailed');
    });

  }, [isHydrated, router, setUser]);

  return (
    <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-6 animate-fade-in text-center min-h-[300px]">
      <div className="w-8 h-8 border-2 border-violet/40 border-t-violet rounded-full animate-spin" />
      <p className="text-muted text-sm font-mono animate-pulse">Authenticating...</p>
    </div>
  );
}
