# Widget Box

A personal dashboard of small, glanceable widgets — the time, the weather, a
focus timer, a note — arranged on a grid you rearrange yourself.

```bash
pnpm install
pnpm dev
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
  field and the settings popover and the add-widget sheet both pick it up.
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

## Appearance

Light and dark are both first-class. Colours are semantic tokens (`--label`,
`--fill`, `--separator`, …) defined in `app/globals.css` rather than
per-component overrides, so a component almost never needs a `dark:` variant.
The appearance follows the OS unless overridden, and resolves before first
paint.

## Accounts

Sign-in is optional and unused by the dashboard — the layout is local to the
browser. NextAuth with a credentials provider and a SQLite/Prisma user table
sits behind `/login` if you want it:

```bash
pnpm exec prisma migrate dev
pnpm seed   # demo@widget.box / password123
```

`DATABASE_URL` is resolved relative to `prisma/schema.prisma`, so its current
value puts the database at `prisma/prisma/dev.db`.
