# Change tracking

> Status: deferred. The live seats.aero adapter takes priority now that an
> API key exists, and the client-side snapshot slice (originally Slice 1)
> has been dropped — see Slices for why. The diff-engine design below
> (flatten, event types, significance threshold) is storage-agnostic and
> carries forward unchanged into the eventual backend-based implementation.
> Read time ~7 min.

## Problem

The watchlist tells you what's bookable right now but not what *changed* since
you last looked. A daily user ends up doing the diff in their head against
yesterday's mental snapshot. End state: each card surfaces "+3 new since you
last viewed" or "best business dropped 80k → 65k since Tuesday," and the
detail page shows a "What's new" panel above the existing list. Done well,
this turns the watchlist from a search front-end into a monitoring tool.

## Slices

Originally three slices, with Slice 1 being a client-side IndexedDB
snapshot store. **Slice 1 is dropped.** Its value proposition was diffs
between the user's own visits — but with a metered API and refresh
cooldowns, those snapshots arrive at sparse, irregular intervals, so
"since you last looked" could mean 5 minutes or 5 days. Low-signal diffs
for real storage complexity. The actual value — "a deal appeared while
you weren't looking" — always required the backend, and the backend's
server-side snapshot store would have replaced the client-side one anyway.

Revised plan:

1. **Live seats.aero adapter** (separate PR, not part of this design) —
   prerequisite for everything below.
2. **Backend change tracking** — server-side snapshot store, scheduled
   refresh, diff on the server, change feed + notifications to clients.
   One epic, designed when the adapter has proven out real data volumes
   and rate limits.

The data model, diff engine, significance threshold, and UI sections
below remain the reference design for step 2 — only the storage location
moves (IndexedDB → server). Ignore the IndexedDB-specific `SnapshotStore`
plumbing (eviction cadence, transactions); those concerns transfer to the
server store in spirit but not in code.

## Data model

### Snapshot

A snapshot is per (trip, leg, queriedAt) and stores the rows the search
returned. `SearchResponse` already has `queriedAt`; the snapshot adds
tripId + leg + persists.

```ts
interface Snapshot {
  tripId: string;
  leg: 'outbound' | 'return';
  queriedAt: number;
  rows: AwardAvailability[];
}
```

Snapshot beats event-log here: simpler at this scale, survives schema drift,
trivial to GC.

### Diff inputs — explicit flatten

`AwardAvailability` is row-keyed by (origin, destination, date, program)
with `cabins` nested per row; `taxesUSD` is row-level, not per-cabin (see
`src/lib/types.ts`). The diff engine flattens each snapshot into a map
keyed by `(date, program, cabin)` so each (program, cabin) on each date is
independently comparable.

The serialization of the map key is an implementation choice. Conceptually:

```ts
type DealKey = readonly [date: string, program: Program, cabin: Cabin];
interface DealValue {
  mileageCost: number;
  taxesUSD: number;  // copied from the parent row; same value across cabins of that row
  direct: boolean;
  available: boolean;
}
```

### Storage

IndexedDB. `localStorage` is too small once we keep history. Wrap behind a
thin `SnapshotStore` that matches the existing watchlist store pattern
(factory + module singleton, `browser`-gated).

```ts
interface SnapshotStore {
  put(s: Snapshot): Promise<void>;
  latest(tripId: string, leg: Leg): Promise<Snapshot | undefined>;
  previous(tripId: string, leg: Leg): Promise<Snapshot | undefined>;
  history(tripId: string, leg: Leg, limit: number): Promise<Snapshot[]>;
  evictOlderThan(ms: number): Promise<void>;
}
```

**Eviction:** opportunistic, not scheduled. `put` triggers `evictOlderThan`
every 10th call per trip. Policy: keep last 20 snapshots per (tripId, leg)
OR last 14 days, whichever holds more history. A 20-trip watchlist × 20
snapshots × 2 legs × ~80 KB ≈ ~64 MB worst case — fits within IndexedDB
defaults (per-origin quotas are GB-scale).

**Transactions:** read `previous` + write the new snapshot in one read-write
transaction per (trip, leg) to avoid two round-trips.

## Diff engine

Three event types matter; the rest is noise (raises, seat counts, tax drift
— actionable to almost nobody, drowns out real signal):

```ts
type ChangeEvent =
  | { kind: 'new';     key: DealKey; deal: DealValue;                          queriedAt: number }
  | { kind: 'cheaper'; key: DealKey; deal: DealValue; before: number; delta: number; queriedAt: number }
  | { kind: 'gone';    key: DealKey; lastSeen: DealValue;                      queriedAt: number };
```

`queriedAt` on every event is the *current* snapshot's timestamp — the UI
needs it to filter "since you last viewed."

### Significance

`new` and `gone` are always significant. `cheaper` requires:

```
delta_pct ≥ 5%  AND  delta_abs ≥ 1000 miles
```

Percentage scales across cabins (5% of 30k Y is meaningful; 5% of 140k F is
meaningful). Absolute floor blocks 200-mile rounding noise from
percentage-only thresholds at low totals.

### Algorithm

`O(n + m)` over the flattened maps:

```
diff(prev, curr): ChangeEvent[]
  prevMap = flatten(prev.rows)
  currMap = flatten(curr.rows)
  for [key, deal] in currMap:
    if not prevMap.has(key):
      emit 'new'
    else if (prevMap[key].mileageCost - deal.mileageCost) is significant:
      emit 'cheaper'
  for [key, deal] in prevMap:
    if not currMap.has(key): emit 'gone'
```

## Refresh and persistence flow

TanStack Query v5 removed `onSuccess`. We watch query results with a Svelte
`$effect` instead. The effect fires when `query.data` changes; inside it we
write the snapshot fire-and-forget — render is not gated on IndexedDB.

```ts
$effect(() => {
  const data = $query.data;
  if (!data) return;
  void snapshotStore.put({ tripId, leg, queriedAt: data.queriedAt, rows: data.results });
});
```

Existing `queryKey`s are `['search', trip.id, trip.updatedAt]` and
`[..., 'return']` (see `TripCardWithData.svelte`). Manual refresh:

```ts
queryClient.invalidateQueries({ queryKey: ['search', tripId] });
```

Prefix-matches both legs, no further wiring needed.

**Live-data caveat:** the Refresh button and the 60s `staleTime` were sized
for free mock data. Against the metered seats.aero API, manual refresh needs
a per-trip cooldown (propose 5 min, disabled-state on the button) and the
global `staleTime` likely rises. Decide exact numbers in the adapter PR once
real rate limits are known; Slice 2 must not ship a free-to-spam refresh.

### Event derivation

A small reactive `useChangeEvents(tripId, leg)` returns the diff against
the previous snapshot. Memoize on `(tripId, leg, queriedAt)` so the diff is
computed once per snapshot, not per render.

### Last viewed

Per-trip "last viewed" timestamp lives in a **separate** `viewedState`
store, not on `WatchedTrip`. Reasoning: viewing state is a cross-cutting UI
concern that will accrete fields (dismissed events, per-leg viewed, unread
counts); coupling it to the persisted watch record forces a migration the
first time it grows. Same factory + singleton pattern as `watchlist`. Bump
on detail-page mount.

Card badge:
```ts
events.filter(e => e.queriedAt > viewedState.lastViewedAt(tripId))
```

## UI

### Watchlist card

A change-summary line above the existing "View all options" footer link.
When there are events the user hasn't seen, render:

```
+2 new since you last viewed · 1 dropped · 1 cheaper
```

If no events since last view, hide the line. Add a small refresh icon
button in the card header next to delete.

### Detail page

A new `WhatsNew` panel above the Outbound / Return sections, hidden when
empty. Each event row: icon (`↓` cheaper, `+` new, `✕` gone), key (route /
date / program / cabin), and a click-to-scroll-to-row on `new` / `cheaper`.

### Last refreshed

Small muted timestamp on each card and at the top of the detail page —
"Refreshed 5 min ago" — using snapshot `queriedAt`.

## Out of scope

- **Scheduled refresh / cron** — Phase 3, needs backend.
- **Notifications** — Phase 3 (Push API needs HTTPS + service worker;
  email/SMS needs an account).
- **Multi-pax** — not built yet. When it lands, `DealKey` extends with
  a pax count; nothing else changes structurally.
- **Cross-device sync** — no accounts → no server → fresh start per
  browser. Acceptable for v1.

## Open questions

Two left to decide; everything else is locked in the body.

1. **`gone` events visibility.** A deal disappearing is informative but
   often demoralizing and hard to act on. Show them muted, hide them
   behind a "Show dropped" toggle, or omit entirely? Default proposal:
   show, visually subdued.
2. **Eviction beyond the 20/14-day cap.** With heavy refresh on a single
   trip, the 20-snapshot cap might evict useful long-term history. Worth
   downsampling (keep all from last 24h, then hourly, then daily) or is
   the simple cap fine? Default proposal: simple cap, revisit if anyone
   wants long-term trends.

## What carries forward

When the backend epic starts, lift directly from this doc:

- `src/lib/diff.ts` — the flatten + event types + significance threshold,
  implemented as a pure module so it runs identically server-side.
- The `viewedState` store design (client-side, separate from `WatchedTrip`).
- The UI section: card change-summary line, `WhatsNew` panel, last-refreshed
  indicator — all unchanged regardless of where snapshots live.

Superseded: the IndexedDB `SnapshotStore` interface, its eviction cadence
and transaction notes, and the client-side `$effect` snapshot-write flow.
