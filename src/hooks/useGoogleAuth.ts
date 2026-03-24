import { useGoogleLogin, TokenResponse } from '@react-oauth/google'
import { useState, useCallback, useRef } from 'react'

const SCOPES = {
  sheets: 'https://www.googleapis.com/auth/spreadsheets',
  docs: 'https://www.googleapis.com/auth/documents',
  picker: 'https://www.googleapis.com/auth/drive.file',
} as const;

interface GoogleAuthState {
  accessToken: string | null
  isSignedIn: boolean
}

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    accessToken: null,
    isSignedIn: false,
  })

  // TODO: implement sign-in using useGoogleLogin from @react-oauth/google
  // TODO: implement sign-out
  // TODO: handle token expiry / refresh

  return {
    ...authState,
    scopes: SCOPES,
  }
}
