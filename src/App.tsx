import { useState, useMemo } from 'react';
import type { AreaTag, Priority, Status, ActionItem } from './actionSchema';
import { AREA_META } from './actionSchema';
import { useStudioActions } from './useStudioActions';
import type { NewAction } from './useStudioActions';
import { useAgent } from './useAgent';
import ActionCard from './components/ActionCard';
import AddEditModal from './components/AddEditModal';
import MeetingsSection from './components/MeetingsSection';
import AgentPanel from './components/AgentPanel';

type Tab = 'actions' | 'meetings';

type Filters = {
  areaTag: AreaTag | '';
  priority: Priority | '';
  status: Status | '';
};

const EMPTY_FILTERS: Filters = { areaTag: '', priority: '', status: '' };

export default function App() {
  const studio = useStudioActions();
  const { actions, summary, addAction, updateAction, cycleStatus, removeAction, downloadJSON, importJSON, serverConnected } = studio;

  const agent = useAgent({
    actions: studio.actions,
    addAction: studio.addAction,
    addActions: studio.addActions,
    updateAction: studio.updateAction,
    removeAction: studio.removeAction,
    filterBy: studio.filterBy,
  });

  const [tab, setTab] = useState<Tab>('actions');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showModal, setShowModal] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);

  const filtered = useMemo(() => {
    return actions.filter(a => {
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
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-brand">
            <span className="header-logo">EA</span>
            <span className="header-title">Studio Tracker</span>
          </div>
          <nav className="header-nav">
            <button
              className={`nav-tab${tab === 'actions' ? ' nav-tab-active' : ''}`}
              onClick={() => setTab('actions')}
            >
              Actions
            </button>
            <button
              className={`nav-tab${tab === 'meetings' ? ' nav-tab-active' : ''}`}
              onClick={() => setTab('meetings')}
            >
              Meetings
            </button>
          </nav>
        </div>

        <div className="header-right">
          {tab === 'actions' && (
            <div className="summary-pills">
              <span className="pill pill-open">{summary.open} open</span>
              {summary.urgent > 0 && (
                <span className="pill pill-urgent">{summary.urgent} urgent</span>
              )}
              {summary.inProgress > 0 && (
                <span className="pill pill-progress">{summary.inProgress} in·progress</span>
              )}
              <span className="pill pill-done">{summary.done} done</span>
            </div>
          )}
          {tab === 'actions' && (
            <div className="header-actions">
              <button className="btn btn-ghost" onClick={handleImport}>Import</button>
              <button className="btn btn-ghost" onClick={downloadJSON} disabled={actions.length === 0}>Export</button>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Action</button>
            </div>
          )}
          <span
            className={`hr-sync-badge${serverConnected ? ' hr-sync-badge-on' : ''}`}
            title={serverConnected ? 'Synced with HR Tool (localhost:3001)' : 'HR Tool server offline — using local storage'}
          >
            {serverConnected ? '● HR Tool' : '○ Local'}
          </span>

          <button
            className={`agent-toggle-btn${agentOpen ? ' agent-toggle-btn-active' : ''}`}
            onClick={() => setAgentOpen(o => !o)}
            title="Open AI assistant"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="3" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4 7h7M4 9.5h4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>Agent</span>
            {agent.messages.length > 0 && (
              <span className="agent-badge">{agent.messages.filter(m => m.role === 'assistant').length}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Actions tab ── */}
      {tab === 'actions' && (
        <>
          <div className="filter-bar">
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

            <span className="filter-count">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </span>
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
        </>
      )}

      {/* ── Meetings tab ── */}
      {tab === 'meetings' && <MeetingsSection />}

      {/* ── Agent panel ── */}
      <AgentPanel
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        apiKey={agent.apiKey}
        onSaveApiKey={agent.saveApiKey}
        messages={agent.messages}
        isLoading={agent.isLoading}
        onSend={agent.sendMessage}
        onClear={agent.clearChat}
      />

      {/* ── Modal ── */}
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
