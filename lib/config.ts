'use client';

const STORAGE_KEY_SHEET_ID = 'halaqa_spreadsheet_id';
const STORAGE_KEY_GOOGLE_CLIENT_ID = 'halaqa_google_client_id';

export function getSpreadsheetId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_SHEET_ID);
}

export function setSpreadsheetId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(STORAGE_KEY_SHEET_ID, id);
  else localStorage.removeItem(STORAGE_KEY_SHEET_ID);
}

export function getGoogleClientId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_GOOGLE_CLIENT_ID) || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
}

export function setGoogleClientId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, id);
  else localStorage.removeItem(STORAGE_KEY_GOOGLE_CLIENT_ID);
}
