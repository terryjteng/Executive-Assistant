import { useState } from 'react';
import type { ActionItem, AreaTag, SyncType, Priority, Status } from '../actionSchema';
import { AREA_META } from '../actionSchema';
import type { NewAction } from '../useStudioActions';

type Props = {
  action: ActionItem | null;
  onSubmit: (data: NewAction) => void;
  onClose: () => void;
};

export default function AddEditModal({ action, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<NewAction>({
    task: action?.task ?? '',
    owner: action?.owner ?? '',
    dueDate: action?.dueDate ?? '',
    sourceSync: action?.sourceSync ?? 'Studio Sync',
    areaTag: action?.areaTag ?? 'overall',
    priority: action?.priority ?? 'normal',
    status: action?.status ?? 'open',
    sessionDate: action?.sessionDate ?? '',
    notes: action?.notes ?? '',
  });

  const set = <K extends keyof NewAction>(key: K, value: NewAction[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.task.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{action ? 'Edit Action' : 'New Action'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label className="form-group">
            <span>Task *</span>
            <textarea
              className="form-input form-textarea"
              value={form.task}
              onChange={e => set('task', e.target.value)}
              placeholder="Describe the action item..."
              autoFocus
              required
            />
          </label>

          <div className="form-row">
            <label className="form-group">
              <span>Owner</span>
              <input
                className="form-input"
                value={form.owner}
                onChange={e => set('owner', e.target.value)}
                placeholder="Who's responsible?"
              />
            </label>
            <label className="form-group">
              <span>Due Date</span>
              <input
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-group">
              <span>Source</span>
              <select
                className="form-input"
                value={form.sourceSync}
                onChange={e => set('sourceSync', e.target.value as SyncType)}
              >
                <option value="Studio Sync">Studio Sync</option>
                <option value="Lead Sync">Lead Sync</option>
              </select>
            </label>
            <label className="form-group">
              <span>Area</span>
              <select
                className="form-input"
                value={form.areaTag}
                onChange={e => set('areaTag', e.target.value as AreaTag)}
              >
                {(Object.keys(AREA_META) as AreaTag[]).map(tag => (
                  <option key={tag} value={tag}>{AREA_META[tag].label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-group">
              <span>Priority</span>
              <select
                className="form-input"
                value={form.priority}
                onChange={e => set('priority', e.target.value as Priority)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="decision">Decision</option>
              </select>
            </label>
            <label className="form-group">
              <span>Status</span>
              <select
                className="form-input"
                value={form.status}
                onChange={e => set('status', e.target.value as Status)}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>

          <label className="form-group">
            <span>Notes</span>
            <textarea
              className="form-input form-textarea"
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional context or links..."
              rows={2}
            />
          </label>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {action ? 'Save Changes' : 'Add Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
