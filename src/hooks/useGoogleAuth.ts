import type { TokenResponse } from '@react-oauth/google';
import { useGoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { SCOPES } from '@/lib/googleAuth'
import type { GoogleAuthState } from '@/lib/googleAuth'

const REQUIRED_SCOPES = new Set(Object.values(SCOPES));

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    accessToken: null,
    isSignedIn: false,
    expiresAt: null,
  })
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (resp: TokenResponse) => {
      const grantedScopes = new Set(resp.scope.split(' '));
      const missingScopes = [...REQUIRED_SCOPES].filter(s => !grantedScopes.has(s));
      if (missingScopes.length > 0) {
        setAuthError('All permissions are required. Please grant access to Sheets, Docs, and Drive.');
        return;
      }
      setAuthError(null);

      setAuthState(
        {
          accessToken: resp.access_token,
          isSignedIn: true,
          expiresAt: Date.now() + resp.expires_in * 1000,
        }
      );
    },
    onError: () => {
      setAuthError('Sign-in failed. Please try again.');
    },
    onNonOAuthError: (err) => {
      if (err.type !== 'popup_closed') {
        setAuthError('Could not open sign-in popup. Please allow popups for this site.');
      }
    },
    flow: 'implicit',
    scope: Object.values(SCOPES).join(' '),
  });
  const logout = () => {
    setAuthState({ accessToken: null, isSignedIn: false, expiresAt: null });
    setAuthError(null);
  };

  return {
    ...authState,
    authError,
    login,
    logout,
    scopes: SCOPES,
  }
}
