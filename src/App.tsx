import { useEffect, useReducer } from 'react'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { appReducer, initialAppState } from '@/hooks/useAppReducer'
import { initGapiClient, loadDocsApi } from '@/lib/gapiClient'
import { LoginScreen } from '@/components/screens/LoginScreen'
import { AuthErrorScreen } from '@/components/screens/AuthErrorScreen'
import { ReadyScreen } from '@/components/screens/ReadyScreen'
import { CreatingScreen } from '@/components/screens/CreatingScreen'
import { ApiErrorScreen } from '@/components/screens/ApiErrorScreen'
import { SuccessScreen } from '@/components/screens/SuccessScreen'
import { PickerScreen } from './components/screens/PickerScreen'
import { SpreadsheetViewScreen } from './components/screens/SpreadsheetViewScreen'

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
      {state.screen === 'spreadsheet_data_view' && (
        <SpreadsheetViewScreen
          spreadsheetId={state.spreadsheetId}
          spreadsheetName={state.spreadsheetName}
          onReturn={() => dispatch({ type: 'RETRY' })}
        />
      )}
    </main>
  );
}

export default App;
