import type { ItemCategory, ExpandedItemData, BidderData } from "@/lib/basicItemData";

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
  | { screen: 'data_view'; categories: Map<string, ItemCategory>; spreadsheetId: string; warnings: string[] }
  | { screen: 'email_load_view'; categories: Map<string, ItemCategory>; spreadsheetId: string; warnings: string[] }
  | { screen: 'email_data_view'; expandedItems: Map<number, ExpandedItemData>; bidders: Map<string, BidderData>; categories: Map<string, ItemCategory>; spreadsheetId: string; warnings: string[] };

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
  | { type: 'LOADING_SUCCESS'; categories: Map<string, ItemCategory>; spreadsheetId: string; warnings: string[] }
  | { type: 'GO_TO_EMAIL_LOAD' }
  | { type: 'BACK_FROM_EMAIL_LOAD' }
  | { type: 'EMAIL_LOADING_SUCCESS'; expandedItems: Map<number, ExpandedItemData>; bidders: Map<string, BidderData> }
  | { type: 'BACK_FROM_EMAIL_RESULTS' };

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
      return { screen: 'data_view', categories: action.categories, spreadsheetId: action.spreadsheetId, warnings: action.warnings };
    case 'GO_TO_EMAIL_LOAD':
      if (state.screen !== 'data_view') return state;
      return { screen: 'email_load_view', categories: state.categories, spreadsheetId: state.spreadsheetId, warnings: state.warnings };
    case 'BACK_FROM_EMAIL_LOAD':
      if (state.screen !== 'email_load_view') return state;
      return { screen: 'data_view', categories: state.categories, spreadsheetId: state.spreadsheetId, warnings: state.warnings };
    case 'EMAIL_LOADING_SUCCESS':
      if (state.screen !== 'email_load_view') return state;
      return { screen: 'email_data_view', expandedItems: action.expandedItems, bidders: action.bidders, categories: state.categories, spreadsheetId: state.spreadsheetId, warnings: state.warnings };
    case 'BACK_FROM_EMAIL_RESULTS':
      if (state.screen !== 'email_data_view') return state;
      return { screen: 'data_view', categories: state.categories, spreadsheetId: state.spreadsheetId, warnings: state.warnings };
    default:
      return state;
  }
}
