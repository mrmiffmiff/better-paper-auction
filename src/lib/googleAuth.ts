export const SCOPES = {
  sheets: 'https://www.googleapis.com/auth/spreadsheets',
  docs: 'https://www.googleapis.com/auth/documents',
  picker: 'https://www.googleapis.com/auth/drive.file',
} as const;

export interface GoogleAuthState {
  accessToken: string | null
  isSignedIn: boolean
  expiresAt: number | null
}
