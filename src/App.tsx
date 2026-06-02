import { useEffect, useReducer } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { appReducer, initialAppState } from '@/hooks/useAppReducer'
import type { AppState } from '@/hooks/useAppReducer'
import { useDarkMode } from '@/hooks/useDarkMode'
import { initGapiClient, loadDocsApi, loadSheetsApi } from '@/lib/gapiClient'
import { LoginScreen } from '@/components/screens/LoginScreen'
import { AuthErrorScreen } from '@/components/screens/AuthErrorScreen'
import { ReadyScreen } from '@/components/screens/ReadyScreen'
import { ApiErrorScreen } from '@/components/screens/ApiErrorScreen'
import { PickerScreen } from './components/screens/PickerScreen'
import { SpreadsheetViewScreen } from './components/screens/SpreadsheetViewScreen'
import { LoadingScreen } from './components/screens/LoadingScreen'
import { DataScreen } from './components/screens/DataScreen'
import { parseSheetRows, parseCategoryIds, colLetterToIndex } from './lib/parseSheetData'
import { parseEmailSheetData } from './lib/parseEmailSheetData'
import { createCatalogDoc } from './lib/createCatalogDoc'
import { createBidSheetDoc } from './lib/createBidSheets'
import { createExpandedSheet } from './lib/createExpandedSheet'
import { EmailLoadScreen } from './components/screens/EmailLoadScreen'
import { EmailResultsScreen } from './components/screens/EmailResultsScreen'
import { Button } from './components/ui/button'

function getScreenTitle(screen: AppState['screen']): string {
  switch (screen) {
    case 'login': return 'Sign in';
    case 'auth_error': return 'Sign-in error';
    case 'ready': return 'Select a spreadsheet';
    case 'picker': return 'Choose spreadsheet from Google Drive';
    case 'spreadsheet_selected_view': return 'Configure data loading';
    case 'loading': return 'Loading data';
    case 'data_view': return 'Data loaded';
    case 'api_error': return 'Error';
    case 'email_load_view': return 'Configure email data';
    case 'email_data_view': return 'Email data loaded';
    default: return '';
  }
}

function App() {
  const { isSignedIn, accessToken, expiresAt, authError, login, logout } = useGoogleAuth();
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const { isDark, toggle: toggleDark } = useDarkMode();

  useEffect(() => {
    initGapiClient().catch(console.error)
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      dispatch({ type: 'LOGGED_IN' });
    } else if (authError) {
      dispatch({ type: 'AUTH_FAILED', message: authError });
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  }, [isSignedIn, authError]);

  async function handleLoadEventData(sheetId: string, worksheetName: string, lastRow: number, categoryTabName: string, categoryNameCol: string, categoryIdCol: string) {
    if (!accessToken || (expiresAt !== null && Date.now() > expiresAt)) {
      login();
      return;
    }

    const spreadsheetName = state.screen === 'spreadsheet_selected_view' ? state.spreadsheetName : '';

    gapi.client.setToken({ access_token: accessToken });
    dispatch({ type: 'START_LOADING' });
    try {
      await loadSheetsApi();
      const range = `${worksheetName}!A2:U${lastRow}`;
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });
      let categoryIds: Map<string, number> | undefined;
      if (categoryTabName) {
        const catResponse = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${categoryTabName}!A2:Z`,
        });
        categoryIds = parseCategoryIds(catResponse.result.values, colLetterToIndex(categoryNameCol), colLetterToIndex(categoryIdCol));
      }
      const { categories, warnings } = parseSheetRows(response.result.values, categoryIds);
      dispatch({ type: 'LOADING_SUCCESS', categories, spreadsheetId: sheetId, spreadsheetName, warnings });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'LOADING_FAILED', message });
    }
  }

  async function handleCreateCatalog() {
    if (!accessToken || (expiresAt !== null && Date.now() > expiresAt)) {
      login();
      return;
    }

    gapi.client.setToken({ access_token: accessToken });
    try {
      await loadDocsApi();
      if (state.screen !== 'data_view') return;
      const url = await createCatalogDoc(state.categories);
      window.open(url, '_blank');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'CREATION_FAILED', message });
    }
  }

  async function handleCreateBidSheets() {
    if (!accessToken || (expiresAt !== null && Date.now() > expiresAt)) {
      login();
      return;
    }

    gapi.client.setToken({ access_token: accessToken });
    try {
      await loadDocsApi();
      if (state.screen !== 'data_view') return;
      const url = await createBidSheetDoc(state.categories);
      window.open(url, '_blank');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'CREATION_FAILED', message });
    }
  }

  async function handleCreateExpandedSheet() {
    if (!accessToken || (expiresAt !== null && Date.now() > expiresAt)) {
      login();
      return;
    }

    gapi.client.setToken({ access_token: accessToken });
    try {
      await loadSheetsApi();
      if (state.screen !== 'data_view') return;
      const url = await createExpandedSheet(state.categories, state.spreadsheetId);
      window.open(url, '_blank');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'CREATION_FAILED', message });
    }
  }

  async function handleLoadEmailData(sheetName: string, lastRow: number) {
    if (!accessToken || (expiresAt !== null && Date.now() > expiresAt)) {
      login();
      return;
    }

    gapi.client.setToken({ access_token: accessToken });
    try {
      await loadSheetsApi();
      if (state.screen !== 'email_load_view') return;
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: state.spreadsheetId,
        range: `${sheetName}!A2:J${lastRow}`,
      });
      const { expandedItems, bidders } = parseEmailSheetData(response.result.values ?? [], state.categories);
      dispatch({ type: 'EMAIL_LOADING_SUCCESS', expandedItems, bidders });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'CREATION_FAILED', message });
    }
  }

  function handleLogout() {
    logout();
    dispatch({ type: 'LOGOUT' });
  }

  const isWideScreen = state.screen === 'data_view' || state.screen === 'email_data_view';

  return (
    <>
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background">
        <span className="text-sm font-semibold text-foreground tracking-tight">Better Paper Auction</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </header>
      <main
        aria-label={getScreenTitle(state.screen)}
        className={isWideScreen
          ? "flex-1 flex flex-col"
          : "flex-1 flex items-center justify-center p-4 sm:p-6"
        }
      >
        <p className="sr-only" role="status">{getScreenTitle(state.screen)}</p>
        {state.screen === 'login' && (
          <LoginScreen onLogin={login} />
        )}
        {state.screen === 'auth_error' && (
          <AuthErrorScreen
            message={state.message}
            onTryAgain={() => dispatch({ type: 'TRY_AGAIN' })}
          />
        )}
        {state.screen === 'ready' && (
          <ReadyScreen dispatch={dispatch} />
        )}
        {state.screen === 'api_error' && (
          <ApiErrorScreen
            message={state.message}
            onRetry={() => dispatch({ type: 'RETRY' })}
            onLogout={handleLogout}
          />
        )}
        {state.screen === 'picker' && (
          <PickerScreen
            auth_state={{ accessToken: accessToken, isSignedIn: isSignedIn, expiresAt: expiresAt }}
            dispatch={dispatch}
          />
        )}
        {state.screen === 'spreadsheet_selected_view' && (
          <SpreadsheetViewScreen
            spreadsheetId={state.spreadsheetId}
            spreadsheetName={state.spreadsheetName}
            onReturn={() => dispatch({ type: 'RETRY' })}
            onLoad={handleLoadEventData}
          />
        )}
        {state.screen === 'loading' && (
          <LoadingScreen />
        )}
        {state.screen === 'data_view' && (
          <DataScreen
            cats={state.categories}
            warnings={state.warnings}
            onLogout={handleLogout}
            onCreateCatalog={handleCreateCatalog}
            onCreateBidSheets={handleCreateBidSheets}
            onCreateExpandedSheet={handleCreateExpandedSheet}
            onLoadEmailData={() => dispatch({ type: 'GO_TO_EMAIL_LOAD' })}
            onReloadData={() => dispatch({ type: 'BACK_TO_SPREADSHEET_CONFIG' })}
          />
        )}
        {state.screen === 'email_load_view' && (
          <EmailLoadScreen
            onLoad={handleLoadEmailData}
            onBack={() => dispatch({ type: 'BACK_FROM_EMAIL_LOAD' })}
          />
        )}
        {state.screen === 'email_data_view' && (
          <EmailResultsScreen
            expandedItems={state.expandedItems}
            bidders={state.bidders}
            onBack={() => dispatch({ type: 'BACK_FROM_EMAIL_RESULTS' })}
          />
        )}
      </main>
    </>
  );
}

export default App;
