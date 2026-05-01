// ============================================================
// Studio EA — Action Item & Meeting Note Schema
// ============================================================

export type AreaTag =
  | 'overall'
  | 'web'
  | 'social'
  | 'last-light'
  | 'corebound'
  | 'big-boss-cleanup';

export type Priority = 'normal' | 'urgent' | 'decision';

export type Status = 'open' | 'in-progress' | 'done';

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  dueDate: string;
  areaTag: AreaTag;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ============================================================
// Meeting Notes
// ============================================================

export type MeetingType = 'studio-sync' | 'lead-sync' | 'team-sync';

export const TEAM_META = {
  'last-light':       { label: 'Last Light',       color: '#A32D2D', bg: '#FCEBEB' },
  'corebound':        { label: 'Corebound',         color: '#854F0B', bg: '#FAEEDA' },
  'big-boss-cleanup': { label: 'Big Boss Cleanup',  color: '#3B6D11', bg: '#EAF3DE' },
} as const;

export type TeamKey = keyof typeof TEAM_META;

export const MEETING_META: Record<MeetingType, { label: string; short: string }> = {
  'studio-sync': { label: 'Studio Sync', short: 'SS' },
  'lead-sync':   { label: 'Lead Sync',   short: 'LS' },
  'team-sync':   { label: 'Team Syncs',  short: 'TS' },
};

export interface MeetingNote {
  id: string;
  type: MeetingType;
  team?: TeamKey;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Area display metadata
// ============================================================

export const AREA_META: Record<AreaTag, { label: string; color: string; bg: string }> = {
  'overall':           { label: 'Overall Studio',    color: '#5F5E5A', bg: '#F1EFE8' },
  'web':               { label: 'Website / UI·UX',   color: '#534AB7', bg: '#EEEDFE' },
  'social':            { label: 'Social & Marketing', color: '#993C1D', bg: '#FAECE7' },
  'last-light':        { label: 'Last Light',         color: '#A32D2D', bg: '#FCEBEB' },
  'corebound':         { label: 'Corebound',          color: '#854F0B', bg: '#FAEEDA' },
  'big-boss-cleanup':  { label: 'Big Boss Cleanup',   color: '#3B6D11', bg: '#EAF3DE' },
};
