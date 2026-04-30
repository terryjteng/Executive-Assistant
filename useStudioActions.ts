import { useState, useCallback, useEffect } from 'react';
import type { ActionItem, AreaTag, SyncType, Priority, Status } from './actionSchema';

// ============================================================
// useStudioActions — React hook for the Studio Sync tracker
//
// Usage:
//   const { actions, addAction, updateAction, removeAction,
//           filterBy, exportJSON, importJSON } = useStudioActions();
// ============================================================

type NewAction = Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: Status;
};

type FilterOptions = {
  sourceSync?: SyncType;
  areaTag?: AreaTag;
  priority?: Priority;
  status?: Status;
  owner?: string;
  dueBefore?: string; // ISO date
  dueAfter?: string;  // ISO date
};

const STORAGE_KEY = 'studio_sync_actions';

function generateId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function useStudioActions() {
  const [actions, setActions] = useState<ActionItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    } catch {
      console.warn('Could not persist actions to localStorage');
    }
  }, [actions]);

  /** Add a single action item */
  const addAction = useCallback((item: NewAction): ActionItem => {
    const newItem: ActionItem = {
      ...item,
      id: generateId(),
      status: item.status ?? 'open',
      createdAt: now(),
      updatedAt: now(),
    };
    setActions(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  /** Add multiple action items at once (e.g. bulk import from Sync Hub) */
  const addActions = useCallback((items: NewAction[]): ActionItem[] => {
    const newItems: ActionItem[] = items.map(item => ({
      ...item,
      id: generateId(),
      status: item.status ?? 'open',
      createdAt: now(),
      updatedAt: now(),
    }));
    setActions(prev => [...newItems, ...prev]);
    return newItems;
  }, []);

  /** Update any fields on an existing action */
  const updateAction = useCallback((id: string, patch: Partial<ActionItem>) => {
    setActions(prev =>
      prev.map(a => a.id === id ? { ...a, ...patch, updatedAt: now() } : a)
    );
  }, []);

  /** Toggle status between open → in-progress → done → open */
  const cycleStatus = useCallback((id: string) => {
    setActions(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const next: Status = a.status === 'open' ? 'in-progress'
          : a.status === 'in-progress' ? 'done' : 'open';
        return { ...a, status: next, updatedAt: now() };
      })
    );
  }, []);

  /** Remove an action item */
  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  /** Filter actions by any combination of fields */
  const filterBy = useCallback((opts: FilterOptions): ActionItem[] => {
    return actions.filter(a => {
      if (opts.sourceSync && a.sourceSync !== opts.sourceSync) return false;
      if (opts.areaTag && a.areaTag !== opts.areaTag) return false;
      if (opts.priority && a.priority !== opts.priority) return false;
      if (opts.status && a.status !== opts.status) return false;
      if (opts.owner && a.owner.toLowerCase() !== opts.owner.toLowerCase()) return false;
      if (opts.dueBefore && a.dueDate && a.dueDate > opts.dueBefore) return false;
      if (opts.dueAfter && a.dueDate && a.dueDate < opts.dueAfter) return false;
      return true;
    });
  }, [actions]);

  /** Export all actions as a JSON string (for file download or API POST) */
  const exportJSON = useCallback((): string => {
    return JSON.stringify(actions, null, 2);
  }, [actions]);

  /** Download actions as a .json file */
  const downloadJSON = useCallback(() => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio-sync-actions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJSON]);

  /** Import actions from a JSON string (merges, deduplicates by id) */
  const importJSON = useCallback((json: string) => {
    try {
      const imported: ActionItem[] = JSON.parse(json);
      setActions(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newOnes = imported.filter(a => !existingIds.has(a.id));
        return [...newOnes, ...prev];
      });
    } catch {
      console.error('Invalid JSON — could not import actions');
    }
  }, []);

  /** Computed summaries */
  const summary = {
    total: actions.length,
    open: actions.filter(a => a.status === 'open').length,
    inProgress: actions.filter(a => a.status === 'in-progress').length,
    done: actions.filter(a => a.status === 'done').length,
    urgent: actions.filter(a => a.priority === 'urgent' && a.status !== 'done').length,
    byArea: Object.fromEntries(
      ['overall','web','social','last-light','corebound','big-boss-cleanup'].map(area => [
        area,
        actions.filter(a => a.areaTag === area && a.status !== 'done').length
      ])
    ) as Record<AreaTag, number>,
  };

  return {
    actions,
    summary,
    addAction,
    addActions,
    updateAction,
    cycleStatus,
    removeAction,
    filterBy,
    exportJSON,
    downloadJSON,
    importJSON,
  };
}
