# Widget Box

A personal dashboard of small, glanceable widgets — the time, the weather, a
focus timer, a note — arranged on a grid you rearrange yourself.

```bash
bun install
bun dev
```

Then open <http://localhost:3000>.

## How it works

A widget is a single client component that owns its own data:

```ts
export const clockWidget: WidgetDefinition = {
  meta: { id: "system.clock", name: "Clock", sizes: [...], ... },
  defaultConfig: { hour12: true },
  configFields: [{ kind: "toggle", key: "hour12", label: "12-hour time" }],
  View: ClockView,
};
```

- `meta` drives the widget library listing, the icon, and the allowed sizes.
- `configFields` are rendered into settings forms automatically — declare a
  field and the settings popover and the add-widget drawer both pick it up.
- `View` receives `{ instanceId, size, config }` and renders the tile's
  interior. The frame, padding, drag handling, and edit affordances are
  supplied around it.

Register new widgets in `lib/widgets/system/index.ts`.

Widgets that hold state across reloads — a running timer, a note, a pet — use
`useWidgetState(instanceId, key, initial)`, which is scoped per instance and
cleaned up when that instance is removed.

### Layout

Grid spans follow iOS proportions: `small` is 1×1, `medium` is 2×1, `large` is
2×2, on a six-column square grid. Below 720px the grid reflows to two columns
and drag is disabled, since coordinates stop meaning anything there.

The dashboard lives in `localStorage` under `widget-box:dashboard:v1`. It is
versioned and migrated on read, so changing the size model does not strand an
existing layout.

### Server routes

Only widgets that genuinely need a server have one:

| Route | Used by | Upstream |
| --- | --- | --- |
| `/api/weather?q=` | Weather, Sky | Open-Meteo forecast + geocoding, no key needed |
| `/api/markets?symbols=` | Markets | Yahoo Finance chart endpoint |

Both cache upstream responses and degrade to a readable message inside the tile
rather than to an empty box.

## Backdrop

The dashboard cycles through 18 curated landscapes from [Lorem Picsum](https://picsum.photos),
with a four-second crossfade every minute by default. No API key is needed. Stable image URLs
allow browser/CDN caching, and the next photo is preloaded and decoded before it appears.
Failed loads preserve the current image and retry with the next landscape on the next tick.
Rotation pauses while the tab is hidden; reduced-motion preferences disable the fade and drift.
The background is always on. The photo icon opens timing settings: change photos every
30 seconds, 1 minute, 2 minutes, or 5 minutes, with a 1, 2, 4, or 8-second crossfade.
Timing preferences persist per browser; there is no photo picker or off switch.

## Appearance

Light and dark are both first-class. Colours are semantic tokens (`--label`,
`--fill`, `--separator`, …) defined in `app/globals.css` rather than
per-component overrides, so a component almost never needs a `dark:` variant.
The appearance follows the OS unless overridden, and resolves before first
paint.

The interface is set in Inter on a 4px grid with small radii and 1px borders.
Shared primitives live in `app/components/ui` (`Button`, `Badge`, `Field`,
`PageHeader`, `FilterPills`, `Segmented`, `ConfirmDialog`), backed by plain
classes in `globals.css` (`.btn`, `.badge`, `.input`, `.card`, `.data-table`,
`.drawer`, …). Pages inside `app/(app)` share the sidebar shell; setup and
sign-in are focused pages without it.

## Accounts

Sign-in is optional and unused by the dashboard — the layout is local to the
browser. Auth.js v5 (`next-auth@beta`) with a credentials provider and a
SQLite/Prisma user table sits behind `/login` if you want it. Set `AUTH_SECRET`
in `.env` (`bunx auth secret` generates one), then:

```bash
bunx prisma migrate dev
bun seed   # demo@widget.box / password123
```

Prisma 7 reads its settings from `prisma.config.ts` and talks to SQLite through
the libSQL driver adapter. `DATABASE_URL` is resolved relative to the project
root, so `file:./prisma/dev.db` puts the database at `prisma/dev.db`. The client
is generated into `lib/generated/prisma` on install.
