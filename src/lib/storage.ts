import { browser } from 'wxt/browser';

const SHEET_KEY = 'tracker.spreadsheetId';

export async function getSpreadsheetId(): Promise<string | undefined> {
  return (await browser.storage.local.get(SHEET_KEY))[SHEET_KEY] as string | undefined;
}

export async function setSpreadsheetId(id: string): Promise<void> {
  await browser.storage.local.set({ [SHEET_KEY]: id });
}

export const sheetUrl = (id: string): string => `https://docs.google.com/spreadsheets/d/${id}/edit`;
