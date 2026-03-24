export type AppState =
  | { screen: 'login' }
  | { screen: 'auth_error'; message: string }
  | { screen: 'ready' }
  | { screen: 'creating' }
  | { screen: 'api_error'; message: string }
  | { screen: 'success' };

export type AppAction =
  | { type: 'LOGGED_IN' }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_FAILED'; message: string }
  | { type: 'START_CREATING' }
  | { type: 'CREATION_SUCCESS' }
  | { type: 'CREATION_FAILED'; message: string }
  | { type: 'RETRY' }
  | { type: 'TRY_AGAIN' };

export const initialAppState: AppState = { screen: 'login' };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGGED_IN':
      return { screen: 'ready' };
    case 'AUTH_FAILED':
      return { screen: 'auth_error', message: action.message };
    case 'TRY_AGAIN':
      return { screen: 'login' };
    case 'START_CREATING':
      return { screen: 'creating' };
    case 'CREATION_SUCCESS':
      return { screen: 'success' };
    case 'CREATION_FAILED':
      return { screen: 'api_error', message: action.message };
    case 'RETRY':
      return { screen: 'ready' };
    case 'LOGOUT':
      return { screen: 'login' };
    default:
      return state;
  }
}
