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

    it('LOGOUT → login', () => {
      expect(appReducer(readyState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })

    it('PICK_SPREADSHEET → picker', () => {
      expect(appReducer(readyState, { type: 'PICK_SPREADSHEET' })).toEqual({ screen: 'picker' });
    });
  })

  describe('from api_error', () => {
    const apiErrorState: AppState = { screen: 'api_error', message: 'failed' }

    it('RETRY → ready', () => {
      expect(appReducer(apiErrorState, { type: 'RETRY' })).toEqual({ screen: 'ready' })
    })

    it('LOGOUT → login', () => {
      expect(appReducer(apiErrorState, { type: 'LOGOUT' })).toEqual({ screen: 'login' })
    })

    it('CREATION_FAILED → api_error with message', () => {
      const result = appReducer(apiErrorState, { type: 'CREATION_FAILED', message: 'Network error' })
      expect(result).toEqual({ screen: 'api_error', message: 'Network error' })
    })
  })

  describe('from picker', () => {
    const pickerState: AppState = { screen: 'picker' };

    it('cancel or fail → ready', () => {
      expect(appReducer(pickerState, { type: 'RETRY' })).toEqual({ screen: 'ready' });
    });

    it('SPREADSHEET_SELECTED → spreadsheet_selected_view', () => {
      expect(appReducer(pickerState, { type: 'SPREADSHEET_SELECTED', spreadsheetId: 'sampleId', spreadsheetName: 'sampleName' })).toEqual({ screen: 'spreadsheet_selected_view', spreadsheetId: 'sampleId', spreadsheetName: 'sampleName' });
    });
  });

  describe('from spreadsheet_selected_view', () => {
    const spreadsheetSelectedState: AppState = { screen: 'spreadsheet_selected_view', spreadsheetId: 'sid', spreadsheetName: 'sname' };

    it('START_LOADING → loading', () => {
      expect(appReducer(spreadsheetSelectedState, { type: 'START_LOADING' })).toEqual({ screen: 'loading' });
    });

    it('RETRY → ready', () => {
      expect(appReducer(spreadsheetSelectedState, { type: 'RETRY' })).toEqual({ screen: 'ready' });
    });

    it('LOGOUT → login', () => {
      expect(appReducer(spreadsheetSelectedState, { type: 'LOGOUT' })).toEqual({ screen: 'login' });
    });
  });

  describe('from loading', () => {
    const loadingState: AppState = { screen: 'loading' };
    const sampleCategories = new Map([['Art', { name: 'Art', items: [], id: 0 }]]);

    it('LOADING_SUCCESS → data_view with categories and warnings', () => {
      expect(appReducer(loadingState, { type: 'LOADING_SUCCESS', categories: sampleCategories, spreadsheetId: 'sid', spreadsheetName: 'sname', warnings: [] }))
        .toEqual({ screen: 'data_view', categories: sampleCategories, spreadsheetId: 'sid', spreadsheetName: 'sname', warnings: [] });
    });

    it('LOADING_FAILED → api_error with message', () => {
      expect(appReducer(loadingState, { type: 'LOADING_FAILED', message: 'Network error' })).toEqual({ screen: 'api_error', message: 'Network error' });
    });

    it('LOGOUT → login', () => {
      expect(appReducer(loadingState, { type: 'LOGOUT' })).toEqual({ screen: 'login' });
    });
  });

  describe('from data_view', () => {
    const dataViewState: AppState = { screen: 'data_view', categories: new Map(), spreadsheetId: 'sid', spreadsheetName: 'sname', warnings: [] };

    it('LOGOUT → login', () => {
      expect(appReducer(dataViewState, { type: 'LOGOUT' })).toEqual({ screen: 'login' });
    });

    it('RETRY → ready', () => {
      expect(appReducer(dataViewState, { type: 'RETRY' })).toEqual({ screen: 'ready' });
    });

    it('BACK_TO_SPREADSHEET_CONFIG → spreadsheet_selected_view with same id and name', () => {
      expect(appReducer(dataViewState, { type: 'BACK_TO_SPREADSHEET_CONFIG' }))
        .toEqual({ screen: 'spreadsheet_selected_view', spreadsheetId: 'sid', spreadsheetName: 'sname' });
    });
  });
})
