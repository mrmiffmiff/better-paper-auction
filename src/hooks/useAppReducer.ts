import type { ItemCategory } from "@/lib/basicItemData";

export type AppState =
  | { screen: 'login' }
  | { screen: 'auth_error'; message: string }
  | { screen: 'ready' }
  | { screen: 'creating' }
  | { screen: 'api_error'; message: string }
  | { screen: 'success' }
  | { screen: 'picker' }
  | { screen: 'spreadsheet_selected_view'; spreadsheetId: string; spreadsheetName: string }
  | { screen: 'loading' }
  | { screen: 'data_view'; categories: Map<string, ItemCategory> };

export type AppAction =
  | { type: 'LOGGED_IN' }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_FAILED'; message: string }
  | { type: 'START_CREATING' }
  | { type: 'CREATION_SUCCESS' }
  | { type: 'CREATION_FAILED'; message: string }
  | { type: 'RETRY' }
  | { type: 'TRY_AGAIN' }
  | { type: 'PICK_SPREADSHEET' }
  | { type: 'SPREADSHEET_SELECTED'; spreadsheetId: string; spreadsheetName: string }
  | { type: 'START_LOADING' }
  | { type: 'LOADING_FAILED'; message: string }
  | { type: 'LOADING_SUCCESS'; categories: Map<string, ItemCategory> };

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
    case 'PICK_SPREADSHEET':
      return { screen: 'picker' };
    case 'SPREADSHEET_SELECTED':
      return { screen: 'spreadsheet_selected_view', spreadsheetId: action.spreadsheetId, spreadsheetName: action.spreadsheetName };
    case 'START_LOADING':
      return { screen: 'loading' };
    case 'LOADING_FAILED':
      return { screen: 'api_error', message: action.message };
    case 'LOADING_SUCCESS':
      return { screen: 'data_view', categories: action.categories };
    default:
      return state;
  }
}
