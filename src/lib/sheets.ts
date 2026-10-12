import { buildFormatRequests } from './format';
import {
  LAST_APP_COLUMN,
  SETTINGS_ROWS,
  SHEET_ID,
  TAB,
  applicationToRow,
  eventHeaderRow,
  headerRow,
} from './schema';
import type { Application } from './types';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

export class SheetsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new SheetsError(`Google Sheets API ${res.status}: ${body.slice(0, 300)}`, res.status);
  }
  return (await res.json()) as T;
}

/** Create the tracker spreadsheet (3 tabs, headers, settings, formatting). */
export async function createTracker(token: string): Promise<string> {
  const created = await call<{ spreadsheetId: string }>(token, API, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: 'Job Applications Tracker' },
      sheets: [
        {
          properties: {
            sheetId: SHEET_ID.applications,
            title: TAB.applications,
            gridProperties: { frozenRowCount: 1, frozenColumnCount: 3 },
          },
        },
        {
          properties: {
            sheetId: SHEET_ID.events,
            title: TAB.events,
            gridProperties: { frozenRowCount: 1 },
          },
        },
        { properties: { sheetId: SHEET_ID.settings, title: TAB.settings } },
      ],
    }),
  });
  const id = created.spreadsheetId;

  await call(token, `${API}/${id}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${TAB.applications}!A1`, values: [headerRow()] },
        { range: `${TAB.events}!A1`, values: [eventHeaderRow()] },
        { range: `${TAB.settings}!A1`, values: SETTINGS_ROWS.map((r) => [...r]) },
      ],
    }),
  });

  await call(token, `${API}/${id}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests: buildFormatRequests() }),
  });

  return id;
}

/** First empty row in the Applications tab (1-based). Header is row 1. */
async function nextApplicationRow(token: string, id: string): Promise<number> {
  const res = await call<{ values?: string[][] }>(
    token,
    `${API}/${id}/values/${TAB.applications}!A:A`,
  );
  return (res.values?.length ?? 0) + 1;
}

/**
 * Write one application. We target an explicit row (instead of `values:append`)
 * so the per-row formulas (Days since applied, Flag) can reference their own row.
 */
export async function addApplication(
  token: string,
  id: string,
  app: Application,
): Promise<number> {
  const row = await nextApplicationRow(token, id);
  const range = `${TAB.applications}!A${row}:${LAST_APP_COLUMN}${row}`;
  await call(token, `${API}/${id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ range, majorDimension: 'ROWS', values: [applicationToRow(app, row)] }),
  });
  return row;
}
