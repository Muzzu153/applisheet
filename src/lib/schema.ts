import {
  APPLIED_VIA,
  RECIPIENT_TYPES,
  STAGES,
  TERMINAL_STAGES,
  YES_NO,
  type Application,
  type StageEvent,
} from './types';

export const SCHEMA_VERSION = 1;
export const TAB = { applications: 'Applications', events: 'Events', settings: 'Settings' } as const;
export const SHEET_ID = { applications: 0, events: 1, settings: 2 } as const;

/** Rows pre-formatted / validated below the header. */
export const MAX_FORMATTED_ROWS = 2000;

export interface ColumnDef {
  /** Key on Application, or a computed column name. */
  key: keyof Application | 'daysSinceApplied' | 'flag';
  header: string;
  width: number;
  hidden?: boolean;
}

/**
 * Column order is the contract between the extension and the sheet.
 * Change it only together with a SCHEMA_VERSION bump + migration.
 */
export const APPLICATION_COLUMNS: readonly ColumnDef[] = [
  { key: 'id', header: 'ID', width: 90, hidden: true }, // A
  { key: 'company', header: 'Company', width: 170 }, // B
  { key: 'role', header: 'Role', width: 220 }, // C
  { key: 'location', header: 'Location', width: 130 }, // D
  { key: 'jobUrl', header: 'Job URL', width: 200 }, // E
  { key: 'sourceSite', header: 'Source site', width: 140 }, // F
  { key: 'appliedVia', header: 'Applied via', width: 120 }, // G
  { key: 'appliedDate', header: 'Applied on', width: 100 }, // H
  { key: 'stage', header: 'Stage', width: 120 }, // I
  { key: 'daysSinceApplied', header: 'Days since applied', width: 80 }, // J (formula)
  { key: 'flag', header: 'Flag', width: 100 }, // K (formula)
  { key: 'contactName', header: 'Contact', width: 150 }, // L
  { key: 'contact', header: 'Contact email / link', width: 190 }, // M
  { key: 'recipientType', header: 'Recipient type', width: 110 }, // N
  { key: 'referralAsked', header: 'Referral asked', width: 100 }, // O
  { key: 'lastFollowUp', header: 'Last follow-up', width: 100 }, // P
  { key: 'lastActivity', header: 'Last activity', width: 100 }, // Q
  { key: 'threadId', header: 'Gmail thread ID', width: 130 }, // R
  { key: 'resumeVersion', header: 'Resume version', width: 120 }, // S
  { key: 'notes', header: 'Notes', width: 280 }, // T
];

export const EVENT_COLUMNS: readonly { key: keyof StageEvent; header: string; width: number }[] = [
  { key: 'timestamp', header: 'Timestamp', width: 170 },
  { key: 'applicationId', header: 'Application ID', width: 110 },
  { key: 'eventType', header: 'Event', width: 130 },
  { key: 'fromStage', header: 'From stage', width: 110 },
  { key: 'toStage', header: 'To stage', width: 110 },
  { key: 'source', header: 'Source', width: 90 },
  { key: 'sourceRef', header: 'Source reference', width: 200 },
  { key: 'note', header: 'Note', width: 300 },
];

/** Settings!B1..B4 — referenced by the Flag formula, so keep the order. */
export const SETTINGS_ROWS: readonly [string, number, string][] = [
  ['followUpDays', 7, 'Suggest a follow-up this many days after applying'],
  ['ghostDays', 21, 'Mark as Ghosted after this many days with no activity'],
  ['staleDays', 30, 'Mark as Stale after this many days with no activity'],
  ['schemaVersion', SCHEMA_VERSION, 'Used by the extension. Do not edit.'],
];

const colIndex = (key: ColumnDef['key']): number => {
  const i = APPLICATION_COLUMNS.findIndex((c) => c.key === key);
  if (i < 0) throw new Error(`Unknown column ${key}`);
  return i;
};

/** 0 -> A, 25 -> Z, 26 -> AA */
export function colLetter(index: number): string {
  let n = index;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export const colRef = (key: ColumnDef['key']): string => colLetter(colIndex(key));
export const LAST_APP_COLUMN = colLetter(APPLICATION_COLUMNS.length - 1);

/** Days since applied, for sheet row `r` (1-based). */
export function daysFormula(r: number): string {
  const applied = `${colRef('appliedDate')}${r}`;
  return `=IF(${applied}="","",TODAY()-${applied})`;
}

/**
 * Flag formula for sheet row `r` (1-based). Mirrors the rules in the plan:
 * terminal stages -> no flag; Ghosted > Follow up > Stale.
 */
export function flagFormula(r: number): string {
  const company = `${colRef('company')}${r}`;
  const stage = `${colRef('stage')}${r}`;
  const applied = `${colRef('appliedDate')}${r}`;
  const followUp = `${colRef('lastFollowUp')}${r}`;
  const activity = `${colRef('lastActivity')}${r}`;
  const terminal = TERMINAL_STAGES.map((s) => `${stage}="${s}"`).join(',');
  const waiting = `OR(${stage}="Applied",${stage}="Acknowledged")`;
  return (
    `=IF(${company}="","",IF(OR(${terminal}),"",` +
    `IF(AND(${waiting},TODAY()-MAX(${applied},${activity})>Settings!$B$2),"Ghosted",` +
    `IF(AND(${waiting},TODAY()-MAX(${applied},${followUp})>Settings!$B$1),"Follow up",` +
    `IF(TODAY()-MAX(${applied},${followUp},${activity})>Settings!$B$3,"Stale","")))))`
  );
}

/** Build the cell values for one application row at sheet row `r` (1-based). */
export function applicationToRow(app: Application, r: number): string[] {
  return APPLICATION_COLUMNS.map((col) => {
    if (col.key === 'daysSinceApplied') return daysFormula(r);
    if (col.key === 'flag') return flagFormula(r);
    return String(app[col.key] ?? '');
  });
}

export const dropdowns = {
  stage: STAGES,
  appliedVia: APPLIED_VIA,
  recipientType: RECIPIENT_TYPES,
  referralAsked: YES_NO,
} as const;

export const headerRow = (): string[] => APPLICATION_COLUMNS.map((c) => c.header);
export const eventHeaderRow = (): string[] => EVENT_COLUMNS.map((c) => c.header);
