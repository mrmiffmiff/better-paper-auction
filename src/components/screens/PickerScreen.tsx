import type { Dispatch } from "react";
import type { GoogleAuthState } from "@/lib/googleAuth";
import type { AppAction } from "@/hooks/useAppReducer";
import { DrivePicker, DrivePickerDocsView } from "@googleworkspace/drive-picker-react";

const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID as string;

interface PickerScreenProps {
    readonly auth_state: GoogleAuthState,
    readonly dispatch: Dispatch<AppAction>,
}

export function PickerScreen({ auth_state, dispatch }: PickerScreenProps) {
    const oauth_token = auth_state.accessToken as string;

    function handleCancel() {
        dispatch({ type: 'RETRY' });
    }

    return (
        <DrivePicker
            oauth-token={oauth_token}
            app-id={APP_ID}
            onCanceled={handleCancel}
            onOauthError={handleCancel}
            onPicked={(e) => {
                if (e.detail) {
                    if (e.detail.docs.length > 1) {
                        handleCancel();
                    }
                    const doc = e.detail.docs?.[0];
                    if (doc) {
                        dispatch({
                            type: 'SPREADSHEET_SELECTED',
                            spreadsheetId: doc.id,
                            spreadsheetName: doc.name
                        });
                    }
                }
            }}
        >
            <DrivePickerDocsView
                view-id="SPREADSHEETS"
            />
        </DrivePicker>
    );
}