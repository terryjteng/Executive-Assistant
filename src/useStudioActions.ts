import { useState, useCallback, useEffect } from 'react';
import type { ActionItem, AreaTag, Priority, Status } from './actionSchema';

export type NewAction = Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: Status;
};

type FilterOptions = {
  areaTag?: AreaTag;
  priority?: Priority;
  status?: Status;
  owner?: string;
  dueBefore?: string;
  dueAfter?: string;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    } catch {
      console.warn('Could not persist actions to localStorage');
    }
  }, [actions]);

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

  const updateAction = useCallback((id: string, patch: Partial<ActionItem>) => {
    setActions(prev =>
      prev.map(a => a.id === id ? { ...a, ...patch, updatedAt: now() } : a)
    );
  }, []);

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

  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  const filterBy = useCallback((opts: FilterOptions): ActionItem[] => {
    return actions.filter(a => {
      if (opts.areaTag && a.areaTag !== opts.areaTag) return false;
      if (opts.priority && a.priority !== opts.priority) return false;
      if (opts.status && a.status !== opts.status) return false;
      if (opts.owner && a.owner.toLowerCase() !== opts.owner.toLowerCase()) return false;
      if (opts.dueBefore && a.dueDate && a.dueDate > opts.dueBefore) return false;
      if (opts.dueAfter && a.dueDate && a.dueDate < opts.dueAfter) return false;
      return true;
    });
  }, [actions]);

  const exportJSON = useCallback((): string => {
    return JSON.stringify(actions, null, 2);
  }, [actions]);

  const downloadJSON = useCallback(() => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ea-actions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJSON]);

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
