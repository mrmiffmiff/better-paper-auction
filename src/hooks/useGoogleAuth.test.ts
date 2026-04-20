import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { TokenResponse } from '@react-oauth/google'
import { SCOPES } from '@/lib/googleAuth'

let capturedOnSuccess: ((resp: TokenResponse) => void) | undefined
let capturedOnError: (() => void) | undefined
let capturedOnNonOAuthError: ((err: { type: string }) => void) | undefined

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn((opts: {
    onSuccess: (resp: TokenResponse) => void;
    onError?: () => void;
    onNonOAuthError?: (err: { type: string }) => void;
  }) => {
    capturedOnSuccess = opts.onSuccess
    capturedOnError = opts.onError
    capturedOnNonOAuthError = opts.onNonOAuthError
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
    capturedOnError = undefined
    capturedOnNonOAuthError = undefined
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

describe('useGoogleAuth error handling and logout', () => {
  beforeEach(() => {
    capturedOnSuccess = undefined
    capturedOnError = undefined
    capturedOnNonOAuthError = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('onError sets authError', () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnError) throw new Error('onError callback was not captured')
      capturedOnError()
    })

    expect(result.current.authError).toMatch(/sign-in failed/i)
    expect(result.current.isSignedIn).toBe(false)
  })

  it('onNonOAuthError with popup_closed does not set authError', () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnNonOAuthError) throw new Error('onNonOAuthError callback was not captured')
      capturedOnNonOAuthError({ type: 'popup_closed' })
    })

    expect(result.current.authError).toBeNull()
  })

  it('onNonOAuthError with other type sets popup error', () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnNonOAuthError) throw new Error('onNonOAuthError callback was not captured')
      capturedOnNonOAuthError({ type: 'popup_failed_to_open' })
    })

    expect(result.current.authError).toMatch(/popup/i)
  })

  it('logout clears isSignedIn and accessToken', () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnSuccess) throw new Error('onSuccess callback was not captured')
      capturedOnSuccess(makeTokenResponse(ALL_SCOPES))
    })
    expect(result.current.isSignedIn).toBe(true)

    act(() => result.current.logout())

    expect(result.current.isSignedIn).toBe(false)
    expect(result.current.accessToken).toBeNull()
  })

  it('logout clears authError', () => {
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnError) throw new Error('onError callback was not captured')
      capturedOnError()
    })
    expect(result.current.authError).not.toBeNull()

    act(() => result.current.logout())

    expect(result.current.authError).toBeNull()
  })

  it('expiresAt is computed as Date.now() + expires_in * 1000', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
    const { result } = renderHook(() => useGoogleAuth())

    act(() => {
      if (!capturedOnSuccess) throw new Error('onSuccess callback was not captured')
      capturedOnSuccess(makeTokenResponse(ALL_SCOPES))
    })

    expect(result.current.expiresAt).toBe(1_000_000 + 3600 * 1000)
  })
})
