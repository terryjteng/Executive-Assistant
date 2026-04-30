import type { ActionItem } from '../actionSchema';
import { AREA_META, SYNC_META } from '../actionSchema';

type Props = {
  action: ActionItem;
  onCycleStatus: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: '#DC2626',
  decision: '#7C3AED',
  normal: '#E5E3DC',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  done: 'Done',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr: string, isDone: boolean): boolean {
  if (isDone || !dateStr) return false;
  return new Date(dateStr + 'T00:00:00') < new Date();
}

export default function ActionCard({ action, onCycleStatus, onEdit, onRemove }: Props) {
  const areaMeta = AREA_META[action.areaTag];
  const syncMeta = SYNC_META[action.sourceSync];
  const isDone = action.status === 'done';
  const overdue = isOverdue(action.dueDate, isDone);

  return (
    <div
      className={`action-card${isDone ? ' action-card-done' : ''}`}
      style={{ borderLeftColor: PRIORITY_BORDER[action.priority] }}
    >
      <div className="card-main">
        <p className={`card-task${isDone ? ' card-task-done' : ''}`}>{action.task}</p>
        <div className="card-meta">
          {action.owner && (
            <span className="meta-item">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M1.5 10.5c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {action.owner}
            </span>
          )}
          {action.dueDate && (
            <span className={`meta-item${overdue ? ' meta-overdue' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M1 5h10" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {overdue ? 'Overdue · ' : ''}{formatDate(action.dueDate)}
            </span>
          )}
          <span className="tag" style={{ color: areaMeta.color, background: areaMeta.bg }}>
            {areaMeta.label}
          </span>
          <span className="tag" style={{ color: syncMeta.color, background: syncMeta.bg }}>
            {syncMeta.short}
          </span>
          {action.priority !== 'normal' && (
            <span className={`priority-badge priority-${action.priority}`}>
              {action.priority}
            </span>
          )}
        </div>
        {action.notes && <p className="card-notes">{action.notes}</p>}
      </div>

      <div className="card-actions">
        <button
          className={`status-btn status-${action.status}`}
          onClick={onCycleStatus}
          title="Click to advance status"
        >
          {STATUS_LABELS[action.status]}
        </button>
        <button className="icon-btn" onClick={onEdit} title="Edit">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10 2l2 2-7.5 7.5L2 12l.5-2.5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="icon-btn icon-btn-danger" onClick={onRemove} title="Delete">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.5 7.5h7L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
