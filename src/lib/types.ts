export const STAGES = [
  'Saved',
  'Applied',
  'Acknowledged',
  'Screening',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Offer declined',
] as const;
export type Stage = (typeof STAGES)[number];

/** Stages after which nothing more is expected (flags are switched off). */
export const TERMINAL_STAGES: readonly Stage[] = ['Accepted', 'Rejected', 'Withdrawn', 'Offer declined'];

export const APPLIED_VIA = ['Job portal', 'Company page', 'Email', 'Referral', 'Other'] as const;
export type AppliedVia = (typeof APPLIED_VIA)[number];

export const RECIPIENT_TYPES = ['Specific', 'Generic', 'Unknown', 'N/A'] as const;
export type RecipientType = (typeof RECIPIENT_TYPES)[number];

export const YES_NO = ['Yes', 'No'] as const;
export type YesNo = (typeof YES_NO)[number];

/** One tracked application. Dates are ISO `YYYY-MM-DD` strings. */
export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  jobUrl: string;
  sourceSite: string; // e.g. "linkedin.com", "boards.greenhouse.io"
  appliedVia: AppliedVia;
  appliedDate: string;
  stage: Stage;
  contactName: string;
  contact: string; // email or profile link
  recipientType: RecipientType;
  referralAsked: YesNo;
  lastFollowUp: string;
  lastActivity: string;
  threadId: string;
  resumeVersion: string;
  notes: string;
}

export type StageEventSource = 'manual' | 'page' | 'email' | 'calendar' | 'system';

export interface StageEvent {
  timestamp: string; // ISO datetime
  applicationId: string;
  eventType: string; // "created" | "stage_change" | "followup_sent" | ...
  fromStage: string;
  toStage: string;
  source: StageEventSource;
  sourceRef: string; // e.g. Gmail message ID
  note: string;
}
