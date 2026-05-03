import { useState, useCallback, useEffect, useRef } from 'react';
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
const HR_TOOL_URL = 'http://localhost:3001';

function generateId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${HR_TOOL_URL}/api/ping`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
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

  const [serverConnected, setServerConnected] = useState(false);
  const connectedRef = useRef(false);

  // Persist to localStorage whenever actions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    } catch {
      console.warn('Could not persist actions to localStorage');
    }
  }, [actions]);

  // On mount: check server, hydrate from it, migrate local data if server is empty
  useEffect(() => {
    let mounted = true;

    async function init() {
      const ok = await ping();
      if (!mounted) return;
      if (!ok) return;

      setServerConnected(true);
      connectedRef.current = true;

      try {
        const res = await fetch(`${HR_TOOL_URL}/api/actions`);
        const serverActions: ActionItem[] = await res.json();

        if (!mounted) return;

        const localActions: ActionItem[] = (() => {
          try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
        })();

        if (serverActions.length === 0 && localActions.length > 0) {
          // First connect — migrate local data to server
          await fetch(`${HR_TOOL_URL}/api/actions/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actions: localActions }),
          });
          if (mounted) setActions(localActions);
        } else {
          if (mounted) setActions(serverActions);
        }
      } catch {
        // Server unreachable mid-init, stay on localStorage
      }
    }

    init();

    // Sync on window focus
    function onFocus() {
      if (!connectedRef.current) return;
      fetch(`${HR_TOOL_URL}/api/actions`)
        .then(r => r.json())
        .then((serverActions: ActionItem[]) => { if (mounted) setActions(serverActions); })
        .catch(() => {});
    }
    window.addEventListener('focus', onFocus);

    // Periodic sync every 15s
    const interval = setInterval(() => {
      if (!connectedRef.current || !mounted) return;
      fetch(`${HR_TOOL_URL}/api/actions`)
        .then(r => r.json())
        .then((serverActions: ActionItem[]) => { if (mounted) setActions(serverActions); })
        .catch(() => {});
    }, 15000);

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const addAction = useCallback((item: NewAction): ActionItem => {
    const newItem: ActionItem = {
      ...item,
      id: generateId(),
      status: item.status ?? 'open',
      createdAt: now(),
      updatedAt: now(),
    };
    setActions(prev => [newItem, ...prev]);
    if (connectedRef.current) {
      fetch(`${HR_TOOL_URL}/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      }).catch(console.warn);
    }
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
    if (connectedRef.current) {
      fetch(`${HR_TOOL_URL}/api/actions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions: newItems }),
      }).catch(console.warn);
    }
    return newItems;
  }, []);

  const updateAction = useCallback((id: string, patch: Partial<ActionItem>) => {
    setActions(prev =>
      prev.map(a => a.id === id ? { ...a, ...patch, updatedAt: now() } : a)
    );
    if (connectedRef.current) {
      fetch(`${HR_TOOL_URL}/api/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch(console.warn);
    }
  }, []);

  const cycleStatus = useCallback((id: string) => {
    let nextStatus: Status = 'open';
    setActions(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const next: Status = a.status === 'open' ? 'in-progress'
          : a.status === 'in-progress' ? 'done' : 'open';
        nextStatus = next;
        return { ...a, status: next, updatedAt: now() };
      })
    );
    if (connectedRef.current) {
      fetch(`${HR_TOOL_URL}/api/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      }).catch(console.warn);
    }
  }, []);

  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
    if (connectedRef.current) {
      fetch(`${HR_TOOL_URL}/api/actions/${id}`, { method: 'DELETE' }).catch(console.warn);
    }
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
        if (connectedRef.current && newOnes.length > 0) {
          fetch(`${HR_TOOL_URL}/api/actions/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actions: newOnes }),
          }).catch(console.warn);
        }
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
    serverConnected,
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
