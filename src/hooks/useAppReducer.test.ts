import { describe, it, expect } from 'vitest'
import { appReducer, initialAppState } from './useAppReducer'
import type { AppState } from './useAppReducer'

describe('appReducer', () => {
  describe('from login', () => {
    it('LOGGED_IN → ready', () => {
      expect(appReducer(initialAppState, { type: 'LOGGED_IN' })).toEqual({ screen: 'ready' })
    })

    it('AUTH_FAILED → auth_error with message', () => {
      const result = appReducer(initialAppState, { type: 'AUTH_FAILED', message: 'Scope missing' })
      expect(result).toEqual({ screen: 'auth_error', message: 'Scope missing' })
    })

    it('LOGOUT stays login', () => {
      expect(appReducer(initialAppState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })
  })

  describe('from auth_error', () => {
    const authErrorState: AppState = { screen: 'auth_error', message: 'err' }

    it('TRY_AGAIN → login', () => {
      expect(appReducer(authErrorState, { type: 'TRY_AGAIN' })).toEqual({ screen: 'login' })
    })

    it('LOGOUT → login', () => {
      expect(appReducer(authErrorState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })
  })

  describe('from ready', () => {
    const readyState: AppState = { screen: 'ready' }

    it('START_CREATING → creating', () => {
      expect(appReducer(readyState, { type: 'START_CREATING' })).toEqual({ screen: 'creating' })
    })

    it('LOGOUT → login', () => {
      expect(appReducer(readyState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })

    it('PICK_SPREADSHEET -> picker', () => {
      expect(appReducer(readyState, { type: 'PICK_SPREADSHEET' })).toEqual({ screen: 'picker' });
    });
  })

  describe('from creating', () => {
    const creatingState: AppState = { screen: 'creating' }

    it('CREATION_SUCCESS → success', () => {
      expect(appReducer(creatingState, { type: 'CREATION_SUCCESS' })).toEqual({ screen: 'success' })
    })

    it('CREATION_FAILED → api_error with message', () => {
      const result = appReducer(creatingState, { type: 'CREATION_FAILED', message: 'Network error' })
      expect(result).toEqual({ screen: 'api_error', message: 'Network error' })
    })

    it('LOGOUT → login', () => {
      expect(appReducer(creatingState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })
  })

  describe('from success', () => {
    const successState: AppState = { screen: 'success' }

    it('RETRY → ready', () => {
      expect(appReducer(successState, { type: 'RETRY' })).toEqual({ screen: 'ready' })
    })

    it('LOGOUT → login', () => {
      expect(appReducer(successState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })
  })

  describe('from api_error', () => {
    const apiErrorState: AppState = { screen: 'api_error', message: 'failed' }

    it('RETRY → ready', () => {
      expect(appReducer(apiErrorState, { type: 'RETRY' })).toEqual({ screen: 'ready' })
    })

    it('LOGOUT → login', () => {
      expect(appReducer(apiErrorState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })
  })

  describe('from picker', () => {
    const pickerState: AppState = { screen: 'picker' };

    it('cancel or fail -> ready', () => {
      expect(appReducer(pickerState, { type: 'RETRY' })).toEqual({ screen: 'ready' });
    });

    it('SPREADSHEET_SELECTED -> spreadsheet_selected_view', () => {
      expect(appReducer(pickerState, { type: 'SPREADSHEET_SELECTED', spreadsheetId: 'sampleId', spreadsheetName: 'sampleName' })).toEqual({ screen: 'spreadsheet_selected_view', spreadsheetId: 'sampleId', spreadsheetName: 'sampleName' });
    });
  });
})
