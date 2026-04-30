// ============================================================
// Studio Sync Hub — Action Item Schema
// Drop this into your React tracker project
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
  /** Unique identifier — UUID or timestamp-based */
  id: string;

  /** The action item text */
  task: string;

  /** Person responsible */
  owner: string;

  /** ISO date string YYYY-MM-DD, or empty string if none */
  dueDate: string;

  /** Which meeting this came from */
  sourceSync: SyncType;

  /** Which area or game this belongs to */
  areaTag: AreaTag;

  /** Priority level */
  priority: Priority;

  /** Current status */
  status: Status;

  /** ISO timestamp of when the item was created */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;

  /** Optional: session date this was captured in (YYYY-MM-DD) */
  sessionDate?: string;

  /** Optional: free-text notes or context */
  notes?: string;
}

// ============================================================
// Area display metadata — use for rendering tags, colors, etc.
// ============================================================

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
