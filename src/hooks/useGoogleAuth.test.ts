import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { TokenResponse } from '@react-oauth/google'
import { SCOPES } from '@/lib/googleAuth'

// Capture the onSuccess callback passed to useGoogleLogin so we can invoke it directly
// Don't bother with error capture as we have nothing specific to check there, not being onSuccess will just be a failed test
let capturedOnSuccess: ((resp: TokenResponse) => void) | undefined

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn((opts: {
    onSuccess: (resp: TokenResponse) => void;
  }) => {
    capturedOnSuccess = opts.onSuccess
    return vi.fn()
  }),
}))

// Import after mocking
const { useGoogleAuth } = await import('./useGoogleAuth')

const ALL_SCOPES = [SCOPES.sheets, SCOPES.docs, SCOPES.picker].join(' ')

function makeTokenResponse(scope: string): TokenResponse {
  return {
    access_token: 'test-token',
    expires_in: 3600,
    scope,
    token_type: 'Bearer',
    prompt: '',
    error: undefined,
    error_description: undefined,
    error_uri: undefined,
  }
}

describe('useGoogleAuth scope validation', () => {
  beforeEach(() => {
    capturedOnSuccess = undefined
  })

  it('signs in when all required scopes are granted', () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnSuccess) throw new Error('onSuccess callback was not captured')
      capturedOnSuccess(makeTokenResponse(ALL_SCOPES))
    })

    expect(result.current.isSignedIn).toBe(true)
    expect(result.current.accessToken).toBe('test-token')
    expect(result.current.authError).toBeNull()
  })

  it('sets authError and stays signed out when a scope is missing', () => {
    const { result } = renderHook(() => useGoogleAuth())

    // Missing SCOPES.sheets
    const scopesWithOneMissing = [SCOPES.docs, SCOPES.picker].join(' ')
    act(() => {
      if (!capturedOnSuccess) throw new Error('onSuccess callback was not captured')
      capturedOnSuccess(makeTokenResponse(scopesWithOneMissing))
    })

    expect(result.current.isSignedIn).toBe(false)
    expect(result.current.accessToken).toBeNull()
    expect(result.current.authError).toMatch(/required/i)
  })

  it('sets authError and stays signed out when scope string is empty', () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnSuccess) throw new Error('onSuccess callback was not captured')
      capturedOnSuccess(makeTokenResponse(''))
    })

    expect(result.current.isSignedIn).toBe(false)
    expect(result.current.accessToken).toBeNull()
    expect(result.current.authError).toMatch(/required/i)
  })
})
