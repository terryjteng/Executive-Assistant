import { useState } from 'react';
import type { MeetingNote, MeetingType, TeamKey } from '../actionSchema';
import { TEAM_META, MEETING_META } from '../actionSchema';
import { useMeetingNotes } from '../useMeetingNotes';
import MicButton from './MicButton';

const TABS: { key: MeetingType; label: string }[] = [
  { key: 'studio-sync', label: 'Studio Sync' },
  { key: 'lead-sync',   label: 'Lead Sync' },
  { key: 'team-sync',   label: 'Team Syncs' },
];

const TEAMS = Object.entries(TEAM_META).map(([key, meta]) => ({
  key: key as TeamKey,
  ...meta,
}));

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Session card (inline-editable) ───────────────────────────────────────────

function SessionCard({
  note,
  onUpdate,
  onRemove,
}: {
  note: MeetingNote;
  onUpdate: (content: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(note.content);
  const [expanded, setExpanded] = useState(note.content === '');

  const dirty = draft !== note.content;

  const save = () => { if (dirty) onUpdate(draft); };

  const handleTranscript = (text: string) => {
    setDraft(d => d ? `${d} ${text}` : text);
    setExpanded(true);
  };

  return (
    <div className="session-card">
      <div className="session-header">
        <button
          className="session-toggle"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          <svg
            className={`session-chevron${expanded ? ' session-chevron-open' : ''}`}
            width="14" height="14" viewBox="0 0 14 14" fill="none"
          >
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="session-date">{formatDate(note.date)}</span>
          {note.content && !expanded && (
            <span className="session-preview">{note.content.slice(0, 60)}{note.content.length > 60 ? '…' : ''}</span>
          )}
        </button>
        <div className="session-header-actions">
          <MicButton onTranscript={handleTranscript} title="Speak notes" />
          <button
            className="icon-btn icon-btn-danger"
            onClick={onRemove}
            title="Delete session"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.5 7.5h7L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="session-body">
          <textarea
            className="form-input session-textarea"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={save}
            placeholder="Add meeting notes here… or use the mic button to dictate."
            rows={7}
          />
          {dirty && (
            <div className="session-save-row">
              <button className="btn btn-primary btn-sm" onClick={save}>Save notes</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Meeting column (one meeting type) ────────────────────────────────────────

function MeetingColumn({
  type,
  team,
  label,
}: {
  type: MeetingType;
  team?: TeamKey;
  label: string;
}) {
  const { addNote, updateNote, removeNote, notesFor } = useMeetingNotes();
  const sessions = notesFor(type, team);

  const handleAdd = () => addNote(type, today(), team);

  return (
    <div className="meeting-column">
      <div className="meeting-column-header">
        <h3 className="meeting-column-title">{label}</h3>
        <button className="btn btn-primary btn-sm" onClick={handleAdd}>
          + New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="sessions-empty">
          <p>No sessions yet.</p>
          <button className="btn btn-ghost btn-sm" onClick={handleAdd}>Add first session</button>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map(note => (
            <SessionCard
              key={note.id}
              note={note}
              onUpdate={content => updateNote(note.id, content)}
              onRemove={() => removeNote(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main meetings section ─────────────────────────────────────────────────────

export default function MeetingsSection() {
  const [activeTab, setActiveTab] = useState<MeetingType>('studio-sync');
  const [activeTeam, setActiveTeam] = useState<TeamKey>('last-light');

  return (
    <div className="meetings-section">
      {/* Meeting type tabs */}
      <div className="meetings-tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`meetings-tab${activeTab === t.key ? ' meetings-tab-active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Team sub-tabs (only for Team Syncs) */}
      {activeTab === 'team-sync' && (
        <div className="team-tab-bar">
          {TEAMS.map(t => (
            <button
              key={t.key}
              className={`team-tab${activeTeam === t.key ? ' team-tab-active' : ''}`}
              style={activeTeam === t.key
                ? { color: t.color, background: t.bg, borderColor: t.color }
                : {}}
              onClick={() => setActiveTeam(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="meetings-content">
        {activeTab === 'team-sync' ? (
          <MeetingColumn
            key={activeTeam}
            type="team-sync"
            team={activeTeam}
            label={TEAM_META[activeTeam].label}
          />
        ) : (
          <MeetingColumn
            key={activeTab}
            type={activeTab}
            label={MEETING_META[activeTab].label}
          />
        )}
      </div>
    </div>
  );
}
