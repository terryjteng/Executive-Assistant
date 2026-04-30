# Studio Sync Hub — React Integration

Three files to drop into your VS Code tracker project.

---

## Files

| File | Purpose |
|------|---------|
| `actionSchema.ts` | TypeScript types + display metadata (colors, labels) |
| `useStudioActions.ts` | React hook — full CRUD, filtering, import/export |
| `actions-export-sample.json` | Sample data matching the schema — use to seed or test |

---

## Quick start

```tsx
// 1. Drop all three files into your project (e.g. /src/sync/)

// 2. Use the hook in any component
import { useStudioActions } from './sync/useStudioActions';
import { AREA_META, SYNC_META } from './sync/actionSchema';

function TrackerPage() {
  const {
    actions,
    summary,
    addAction,
    addActions,
    updateAction,
    cycleStatus,
    removeAction,
    filterBy,
    downloadJSON,
    importJSON,
  } = useStudioActions();

  return (
    <div>
      <p>{summary.open} open · {summary.urgent} urgent</p>
      {actions.map(a => (
        <div key={a.id}>
          <span>{a.task}</span>
          <span style={{ background: AREA_META[a.areaTag].bg, color: AREA_META[a.areaTag].color }}>
            {AREA_META[a.areaTag].label}
          </span>
          <span style={{ background: SYNC_META[a.sourceSync].bg, color: SYNC_META[a.sourceSync].color }}>
            {SYNC_META[a.sourceSync].short}
          </span>
          <button onClick={() => cycleStatus(a.id)}>{a.status}</button>
        </div>
      ))}
      <button onClick={downloadJSON}>Export JSON</button>
    </div>
  );
}
```

---

## ActionItem shape

```ts
{
  id: string;           // auto-generated
  task: string;         // action item text
  owner: string;        // person responsible
  dueDate: string;      // "YYYY-MM-DD" or ""
  sourceSync: "Studio Sync" | "Lead Sync";
  areaTag: "overall" | "web" | "social" | "last-light" | "corebound" | "big-boss-cleanup";
  priority: "normal" | "urgent" | "decision";
  status: "open" | "in-progress" | "done";
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  sessionDate?: string; // "YYYY-MM-DD" — which sync session it came from
  notes?: string;       // optional context
}
```

---

## Importing from the Sync Hub

When you're ready to bridge the two tools, the Sync Hub can export a JSON file matching this schema exactly. In your tracker:

```ts
// From a file input
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => importJSON(ev.target?.result as string);
  reader.readAsText(file);
};

// Or from a fetch if you expose an endpoint
const handleSync = async () => {
  const res = await fetch('/api/sync-hub/actions');
  const json = await res.text();
  importJSON(json);
};
```

---

## Filtering examples

```ts
// All urgent open Last Light items from Lead Sync
const criticalLL = filterBy({
  areaTag: 'last-light',
  sourceSync: 'Lead Sync',
  priority: 'urgent',
  status: 'open',
});

// Everything due this week
const dueThisWeek = filterBy({
  dueAfter: '2026-04-30',
  dueBefore: '2026-05-07',
});

// All your personal items
const mine = filterBy({ owner: 'You' });
```

---

## Persistence

Actions auto-persist to `localStorage` under the key `studio_sync_actions`. When you're ready to move to a real backend (Supabase, Firebase, your own API), replace the `useEffect` in `useStudioActions.ts` with your preferred persistence layer.
