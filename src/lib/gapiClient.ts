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
  await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/docs/v1/rest');
  docsLoaded = true;
}
