# Widget Box

A Chrome new tab page: an Unsplash photo, a big clock, a search box, and a grid
of small, glanceable widgets — the weather, markets, a focus timer, a note —
that you rearrange yourself.

```bash
bun install
echo "VITE_UNSPLASH_ACCESS_KEY=<your access key>" > .env.local
bun run build
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load
unpacked**, and pick the `dist` folder. It works the same in Edge, Brave, and Arc.

While working on it, `bun run watch` rebuilds `dist` on save; press reload on
the extension's card and open a new tab. `bun dev` serves the page at
<http://localhost:5173> for quick layout work, though search falls back to
Google there and Markets cannot reach Yahoo without the extension's host
permission.

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

### Data

Widgets fetch straight from the page, through `useRemote(key, fetcher)`:

| Module | Used by | Upstream | Cached for |
| --- | --- | --- | --- |
| `lib/api/weather.ts` | Weather, Sky | Open-Meteo forecast + geocoding, no key needed | 15 min (places: 1 day) |
| `lib/api/markets.ts` | Markets | Yahoo Finance chart endpoint | 1 min |

Responses are cached in `localStorage`, so opening a tab does not refetch
anything still fresh. Yahoo sends no CORS headers; the manifest's host
permission is what lets the extension page read it. Failures degrade to a
readable message inside the tile rather than to an empty box.

## Backdrop

Photos come from [Unsplash](https://unsplash.com) using the access key in
`.env.local`, which is compiled into the bundle — fine for your own install,
not for publishing. Without a key the page falls back to the plain gradient.

`lib/api/unsplash.ts` asks for 30 random landscape photos from one curated
topic at a time and keeps them as a queue in `localStorage`. Each tab takes the
next photo, which the previous tab already preloaded, so it appears instantly;
the queue refills in the background when it runs low. The settings drawer picks
the topic (Wallpapers, Nature, Travel, Architecture, Textures, Film) and whether
the photo changes on every new tab, hourly, or daily. The ↻ button by the credit
skips to the next photo.

Per Unsplash's guidelines, images are hotlinked from their CDN, the credit names
and links the photographer and Unsplash, and the download endpoint is pinged
whenever a photo is shown.

## Appearance

Light and dark are both first-class. Colours are semantic tokens (`--label`,
`--fill`, `--separator`, …) defined in `app/globals.css` rather than
per-component overrides, so a component almost never needs a `dark:` variant.
The appearance follows the OS unless overridden, and resolves before first
paint.

The interface is set in Inter (bundled, not fetched) on a 4px grid with small
radii and 1px borders.
Shared primitives live in `app/components/ui` (`Button`, `Badge`, `Field`,
`PageHeader`, `FilterPills`, `Segmented`, `ConfirmDialog`), backed by plain
classes in `globals.css` (`.btn`, `.badge`, `.input`, `.card`, `.data-table`,
`.drawer`, …).

## Structure

There is one page, `newtab.html`, rendered by `app/NewTab.tsx`. The widget
library (`Library`), settings drawer (`Settings`), and onboarding (`Setup`)
open over it as overlays rather than routes; setup opens by itself the first
time. Extension pages allow only same-origin scripts, so the appearance
bootstrap is `public/appearance.js` rather than an inline script.
`public/manifest.json` and the icons are copied into `dist` as-is.
