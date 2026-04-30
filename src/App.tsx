import { useState, useMemo } from 'react';
import type { AreaTag, SyncType, Priority, Status, ActionItem } from './actionSchema';
import { AREA_META } from './actionSchema';
import { useStudioActions } from './useStudioActions';
import type { NewAction } from './useStudioActions';
import ActionCard from './components/ActionCard';
import AddEditModal from './components/AddEditModal';

type Filters = {
  sourceSync: SyncType | '';
  areaTag: AreaTag | '';
  priority: Priority | '';
  status: Status | '';
};

const EMPTY_FILTERS: Filters = { sourceSync: '', areaTag: '', priority: '', status: '' };

export default function App() {
  const {
    actions,
    summary,
    addAction,
    updateAction,
    cycleStatus,
    removeAction,
    downloadJSON,
    importJSON,
  } = useStudioActions();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showModal, setShowModal] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);

  const filtered = useMemo(() => {
    return actions.filter(a => {
      if (filters.sourceSync && a.sourceSync !== filters.sourceSync) return false;
      if (filters.areaTag && a.areaTag !== filters.areaTag) return false;
      if (filters.priority && a.priority !== filters.priority) return false;
      if (filters.status && a.status !== filters.status) return false;
      return true;
    });
  }, [actions, filters]);

  const hasFilters = Object.values(filters).some(v => v !== '');

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => importJSON(ev.target?.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  const handleEdit = (action: ActionItem) => {
    setEditingAction(action);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAction(null);
  };

  const handleModalSubmit = (data: NewAction) => {
    if (editingAction) {
      updateAction(editingAction.id, { ...data, status: data.status ?? 'open' });
    } else {
      addAction(data);
    }
    handleModalClose();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">EA</span>
          <span className="header-title">Studio Tracker</span>
        </div>

        <div className="summary-pills">
          <span className="pill pill-open">{summary.open} open</span>
          {summary.urgent > 0 && (
            <span className="pill pill-urgent">{summary.urgent} urgent</span>
          )}
          {summary.inProgress > 0 && (
            <span className="pill pill-progress">{summary.inProgress} in progress</span>
          )}
          <span className="pill pill-done">{summary.done} done</span>
        </div>

        <div className="header-actions">
          <button className="btn btn-ghost" onClick={handleImport}>Import</button>
          <button className="btn btn-ghost" onClick={downloadJSON} disabled={actions.length === 0}>Export</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add</button>
        </div>
      </header>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={filters.sourceSync}
          onChange={e => setFilters(f => ({ ...f, sourceSync: e.target.value as SyncType | '' }))}
        >
          <option value="">All Sources</option>
          <option value="Studio Sync">Studio Sync</option>
          <option value="Lead Sync">Lead Sync</option>
        </select>

        <select
          className="filter-select"
          value={filters.areaTag}
          onChange={e => setFilters(f => ({ ...f, areaTag: e.target.value as AreaTag | '' }))}
        >
          <option value="">All Areas</option>
          {(Object.keys(AREA_META) as AreaTag[]).map(tag => (
            <option key={tag} value={tag}>{AREA_META[tag].label}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value as Priority | '' }))}
        >
          <option value="">All Priorities</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="decision">Decision</option>
        </select>

        <select
          className="filter-select"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value as Status | '' }))}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </button>
        )}

        <span className="filter-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <main className="action-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            {actions.length === 0 ? (
              <>
                <p>No action items yet.</p>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  Add your first item
                </button>
              </>
            ) : (
              <p>No items match the current filters.</p>
            )}
          </div>
        ) : (
          filtered.map(a => (
            <ActionCard
              key={a.id}
              action={a}
              onCycleStatus={() => cycleStatus(a.id)}
              onEdit={() => handleEdit(a)}
              onRemove={() => removeAction(a.id)}
            />
          ))
        )}
      </main>

      {showModal && (
        <AddEditModal
          action={editingAction}
          onSubmit={handleModalSubmit}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
