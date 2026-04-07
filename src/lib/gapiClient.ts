const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

let initialized = false;
export async function initGapiClient(): Promise<void> {
  if (initialized) return;
  await new Promise<void>((resolve) => gapi.load('client', resolve));
  await gapi.client.init({ apiKey: API_KEY });
  initialized = true;
}

let docsLoaded = false;
export async function loadDocsApi(): Promise<void> {
  if (docsLoaded) return;
  await gapi.client.load('https://docs.googleapis.com/$discovery/rest?version=v1');
  docsLoaded = true;
}

let sheetsLoaded = false;
export async function loadSheetsApi(): Promise<void> {
  if (sheetsLoaded) return;
  await gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4')
  sheetsLoaded = true;
}