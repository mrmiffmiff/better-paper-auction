import { useEffect, useReducer } from 'react'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { appReducer, initialAppState } from '@/hooks/useAppReducer'
import { initGapiClient, loadDocsApi, loadSheetsApi } from '@/lib/gapiClient'
import { LoginScreen } from '@/components/screens/LoginScreen'
import { AuthErrorScreen } from '@/components/screens/AuthErrorScreen'
import { ReadyScreen } from '@/components/screens/ReadyScreen'
import { CreatingScreen } from '@/components/screens/CreatingScreen'
import { ApiErrorScreen } from '@/components/screens/ApiErrorScreen'
import { SuccessScreen } from '@/components/screens/SuccessScreen'
import { PickerScreen } from './components/screens/PickerScreen'
import { SpreadsheetViewScreen } from './components/screens/SpreadsheetViewScreen'
import type { ItemData, ItemCategory } from './lib/basicItemData'
import { LoadingScreen } from './components/screens/LoadingScreen'
import { DataScreen } from './components/screens/DataScreen'

const isInteger = (s: string): boolean => !isNaN(parseInt(s, 10));
const isDate = (s: string): boolean => !isNaN(Date.parse(s));

function App() {
  const { isSignedIn, accessToken, expiresAt, authError, login, logout } = useGoogleAuth();
  const [state, dispatch] = useReducer(appReducer, initialAppState);

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

  async function handleLoadEventData(sheetId: string, worksheetName: string, lastRow: number) {
    if (!accessToken || (expiresAt !== null && Date.now() > expiresAt)) {
      login();
      return;
    }

    gapi.client.setToken({ access_token: accessToken });
    dispatch({ type: 'START_LOADING' });
    try {
      await loadSheetsApi();
      const range = `${worksheetName}!A2:Q${lastRow}`;
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });
      const values = response.result.values;
      const categories = new Map<string, ItemCategory>();
      if (!values) {
        dispatch({ type: 'LOADING_SUCCESS', categories });
        return;
      }
      for (const row of values) {
        const cat: string = row[7];
        if (!(categories.has(cat))) {
          categories.set(cat, { name: cat, items: [] });
        }
        const item: ItemData = {
          name: row[0],
          itemNumber: Number.parseInt(row[2]),
          description: row[4],
          details: row[5],
          donorName: row[8],
          donorEmail: row[9],
          donorDisplay: row[10],
          quantity: Number.parseInt(row[11]),
          quantityNotes: row[12],
          minBid: Number.parseInt(row[14]),
          bidIncrement: Number.parseInt(row[15]),
          bidSheetType: row[16],
          value: isInteger(row[13]) ? Number.parseInt(row[13]) : undefined,
          date: isDate(row[6]) ? new Date(row[6]) : undefined,
        };
        categories.get(cat)?.items.push(item);
      }
      dispatch({ type: 'LOADING_SUCCESS', categories });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'LOADING_FAILED', message });
    }
  }

  async function handleCreateDocument() {
    if (!accessToken || (expiresAt !== null && Date.now() > expiresAt)) {
      login();
      return;
    }

    gapi.client.setToken({ access_token: accessToken });
    dispatch({ type: 'START_CREATING' });

    try {
      await loadDocsApi();
      const createResp = await gapi.client.docs.documents.create({
        resource: { title: 'Sample Document' },
      });
      const { documentId } = createResp.result;
      await gapi.client.docs.documents.batchUpdate({
        documentId: documentId!,
        resource: {
          requests: [
            { insertText: { location: { index: 1 }, text: 'This is a sample document.' } },
          ],
        },
      });
      dispatch({ type: 'CREATION_SUCCESS' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'CREATION_FAILED', message });
    }
  }

  function handleLogout() {
    logout();
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
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
        <ReadyScreen onCreateDocument={handleCreateDocument} dispatch={dispatch} />
      )}
      {state.screen === 'creating' && (
        <CreatingScreen />
      )}
      {state.screen === 'api_error' && (
        <ApiErrorScreen
          message={state.message}
          onRetry={() => dispatch({ type: 'RETRY' })}
          onLogout={handleLogout}
        />
      )}
      {state.screen === 'success' && (
        <SuccessScreen
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
        <LoadingScreen
        />
      )}
      {state.screen === 'data_view' && (
        <DataScreen
          cats={state.categories}
          onLogout={handleLogout}
        />
      )}
    </main>
  );
}

export default App;
