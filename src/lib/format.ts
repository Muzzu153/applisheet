/**
 * Builds the spreadsheets.batchUpdate requests that style the tracker:
 * header styling, widths, hidden ID column, dropdowns, date formats and
 * colour rules for Stage / Flag. Pure data, so it can be unit-tested.
 */
import {
  APPLICATION_COLUMNS,
  EVENT_COLUMNS,
  MAX_FORMATTED_ROWS,
  SHEET_ID,
  colRef,
  dropdowns,
} from './schema';

type Rgb = { red: number; green: number; blue: number };
const rgb = (hex: string): Rgb => ({
  red: parseInt(hex.slice(1, 3), 16) / 255,
  green: parseInt(hex.slice(3, 5), 16) / 255,
  blue: parseInt(hex.slice(5, 7), 16) / 255,
});

const colNum = (key: Parameters<typeof colRef>[0]) =>
  APPLICATION_COLUMNS.findIndex((c) => c.key === key);

const colRange = (sheetId: number, col: number) => ({
  sheetId,
  startRowIndex: 1,
  endRowIndex: MAX_FORMATTED_ROWS,
  startColumnIndex: col,
  endColumnIndex: col + 1,
});

const headerStyle = (sheetId: number, cols: number) => ({
  repeatCell: {
    range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: cols },
    cell: {
      userEnteredFormat: {
        backgroundColor: rgb('#1F2937'),
        textFormat: { bold: true, foregroundColor: rgb('#FFFFFF') },
        verticalAlignment: 'MIDDLE',
        wrapStrategy: 'WRAP',
      },
    },
    fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,wrapStrategy)',
  },
});

const width = (sheetId: number, col: number, pixelSize: number, hidden = false) => ({
  updateDimensionProperties: {
    range: { sheetId, dimension: 'COLUMNS', startIndex: col, endIndex: col + 1 },
    properties: { pixelSize, hiddenByUser: hidden },
    fields: 'pixelSize,hiddenByUser',
  },
});

const dropdown = (col: number, values: readonly string[]) => ({
  setDataValidation: {
    range: colRange(SHEET_ID.applications, col),
    rule: {
      condition: { type: 'ONE_OF_LIST', values: values.map((v) => ({ userEnteredValue: v })) },
      showCustomUi: true,
      strict: true,
    },
  },
});

const dateFormat = (col: number) => ({
  repeatCell: {
    range: colRange(SHEET_ID.applications, col),
    cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } } },
    fields: 'userEnteredFormat.numberFormat',
  },
});

const textRule = (col: number, text: string, bg: string, fg: string, index: number) => ({
  addConditionalFormatRule: {
    index,
    rule: {
      ranges: [colRange(SHEET_ID.applications, col)],
      booleanRule: {
        condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: text }] },
        format: { backgroundColor: rgb(bg), textFormat: { foregroundColor: rgb(fg), bold: true } },
      },
    },
  },
});

export function buildFormatRequests(): object[] {
  const stageCol = colNum('stage');
  const flagCol = colNum('flag');

  const requests: object[] = [
    headerStyle(SHEET_ID.applications, APPLICATION_COLUMNS.length),
    headerStyle(SHEET_ID.events, EVENT_COLUMNS.length),
    ...APPLICATION_COLUMNS.map((c, i) => width(SHEET_ID.applications, i, c.width, c.hidden)),
    ...EVENT_COLUMNS.map((c, i) => width(SHEET_ID.events, i, c.width)),
    width(SHEET_ID.settings, 0, 160),
    width(SHEET_ID.settings, 1, 80),
    width(SHEET_ID.settings, 2, 380),

    dropdown(stageCol, dropdowns.stage),
    dropdown(colNum('appliedVia'), dropdowns.appliedVia),
    dropdown(colNum('recipientType'), dropdowns.recipientType),
    dropdown(colNum('referralAsked'), dropdowns.referralAsked),

    dateFormat(colNum('appliedDate')),
    dateFormat(colNum('lastFollowUp')),
    dateFormat(colNum('lastActivity')),

    // Flag colours
    textRule(flagCol, 'Ghosted', '#FEE2E2', '#991B1B', 0),
    textRule(flagCol, 'Follow up', '#FEF3C7', '#92400E', 1),
    textRule(flagCol, 'Stale', '#E5E7EB', '#374151', 2),
    // Stage colours
    textRule(stageCol, 'Interview', '#DBEAFE', '#1E40AF', 3),
    textRule(stageCol, 'Offer', '#DCFCE7', '#166534', 4),
    textRule(stageCol, 'Accepted', '#DCFCE7', '#166534', 5),
    textRule(stageCol, 'Rejected', '#FEE2E2', '#991B1B', 6),
  ];
  return requests;
}
