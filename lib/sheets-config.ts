'use client';

/** Current Sheets API config. Set by auth/settings so data layer can use Sheets when available. */
let currentSpreadsheetId: string | null = null;
let currentAccessToken: string | null = null;

export function setSheetsConfig(spreadsheetId: string | null, accessToken: string | null): void {
  currentSpreadsheetId = spreadsheetId;
  currentAccessToken = accessToken;
}

export function getSheetsConfig(): { spreadsheetId: string; accessToken: string } | null {
  if (currentSpreadsheetId && currentAccessToken) return { spreadsheetId: currentSpreadsheetId, accessToken: currentAccessToken };
  return null;
}

export function hasSheetsConfig(): boolean {
  return !!(currentSpreadsheetId && currentAccessToken);
}
