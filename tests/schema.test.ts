import { describe, expect, it } from 'vitest';
import { buildFormatRequests } from '../src/lib/format';
import {
  APPLICATION_COLUMNS,
  LAST_APP_COLUMN,
  applicationToRow,
  colLetter,
  colRef,
  daysFormula,
  flagFormula,
  headerRow,
} from '../src/lib/schema';
import type { Application } from '../src/lib/types';

const app: Application = {
  id: 'abc12345', company: 'Acme', role: 'Backend Engineer', location: 'Mumbai',
  jobUrl: 'https://example.com/j/1', sourceSite: 'example.com', appliedVia: 'Company page',
  appliedDate: '2026-10-11', stage: 'Applied', contactName: '', contact: '', recipientType: 'N/A',
  referralAsked: 'No', lastFollowUp: '', lastActivity: '2026-10-11', threadId: '',
  resumeVersion: 'v1', notes: '',
};

describe('column helpers', () => {
  it('converts indexes to letters', () => {
    expect(colLetter(0)).toBe('A');
    expect(colLetter(25)).toBe('Z');
    expect(colLetter(26)).toBe('AA');
  });
  it('keeps the column contract the formulas rely on', () => {
    expect(colRef('id')).toBe('A');
    expect(colRef('appliedDate')).toBe('H');
    expect(colRef('stage')).toBe('I');
    expect(LAST_APP_COLUMN).toBe('T');
  });
});

describe('row building', () => {
  it('produces one cell per column', () => {
    expect(headerRow()).toHaveLength(APPLICATION_COLUMNS.length);
    expect(applicationToRow(app, 5)).toHaveLength(APPLICATION_COLUMNS.length);
  });
  it('writes formulas that point at their own row', () => {
    const row = applicationToRow(app, 7);
    expect(row[9]).toBe(daysFormula(7));
    expect(row[9]).toContain('H7');
    expect(row[10]).toContain('I7');
    expect(row[10]).not.toContain('I6');
  });
  it('flag formula covers every terminal stage and the Settings thresholds', () => {
    const f = flagFormula(2);
    for (const s of ['Accepted', 'Rejected', 'Withdrawn', 'Offer declined']) expect(f).toContain(`"${s}"`);
    for (const ref of ['$B$1', '$B$2', '$B$3']) expect(f).toContain(`Settings!${ref}`);
    expect(f.startsWith('=')).toBe(true);
  });
  it('has balanced parentheses', () => {
    const f = flagFormula(2);
    expect(f.split('(').length).toBe(f.split(')').length);
  });
});

describe('format requests', () => {
  it('builds well-formed requests', () => {
    const reqs = buildFormatRequests() as Record<string, unknown>[];
    expect(reqs.length).toBeGreaterThan(20);
    expect(reqs.every((r) => Object.keys(r).length === 1)).toBe(true);
  });
});
