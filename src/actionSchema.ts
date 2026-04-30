// ============================================================
// Studio Sync Hub — Action Item Schema
// ============================================================

export type SyncType = 'Studio Sync' | 'Lead Sync';

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
  sourceSync: SyncType;
  areaTag: AreaTag;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  sessionDate?: string;
  notes?: string;
}

export const AREA_META: Record<AreaTag, { label: string; color: string; bg: string }> = {
  'overall':           { label: 'Overall Studio',    color: '#5F5E5A', bg: '#F1EFE8' },
  'web':               { label: 'Website / UI·UX',   color: '#534AB7', bg: '#EEEDFE' },
  'social':            { label: 'Social & Marketing', color: '#993C1D', bg: '#FAECE7' },
  'last-light':        { label: 'Last Light',         color: '#A32D2D', bg: '#FCEBEB' },
  'corebound':         { label: 'Corebound',          color: '#854F0B', bg: '#FAEEDA' },
  'big-boss-cleanup':  { label: 'Big Boss Cleanup',   color: '#3B6D11', bg: '#EAF3DE' },
};

export const SYNC_META: Record<SyncType, { short: string; color: string; bg: string }> = {
  'Studio Sync': { short: 'SS', color: '#3B6D11', bg: '#EAF3DE' },
  'Lead Sync':   { short: 'LS', color: '#185FA5', bg: '#E6F1FB' },
};
