# Contributing to Widget Box

Thanks for helping out. Bug reports, widget ideas, and pull requests are all
welcome.

## Reporting a bug or idea

Open an [issue](https://github.com/benz206/widget-box/issues/new/choose) and
pick **Bug report** or **Feature or widget idea**. For a bug, say which widget,
which browser, and whether you installed from the Chrome Web Store or an
unpacked build. Leave API keys out of screenshots.

## Setup

You need [Bun](https://bun.sh).

```bash
bun install
bun run watch
```

Open `chrome://extensions`, turn on **Developer mode**, choose **Load
unpacked**, and pick `dist`. `bun run watch` rebuilds on save; press reload on
the extension's card, then open a new tab. `bun dev` serves the page at
<http://localhost:5173> for quick layout work, but extension APIs (search,
Spotify sign-in, Markets) only work in the loaded extension.

For photos, paste an Unsplash access key into **Settings → Background**, or put
`VITE_UNSPLASH_ACCESS_KEY` in `.env.local`. Never commit `.env` files.

## Making a change

1. Branch off `main`.
2. Before pushing, run the same checks as CI:

   ```bash
   bun run lint
   bun run build
   ```

3. Open a pull request and fill in the template. Add a screenshot if the UI
   changed.

`main` is protected: every change goes through a pull request, and the `check`
job in CI must pass before it can merge.

## Adding a widget

1. Create `lib/widgets/system/<name>.tsx` exporting a `WidgetDefinition`;
   `notes.tsx` is a small example to copy.
2. Register it in `WIDGETS` in `lib/widgets/system/index.ts`.
3. Use `configFields` for settings. They render into the settings forms
   automatically.
4. Keep state that should survive a reload in `useWidgetState`, and fetch
   remote data through `useRemote` so it is cached.

The README's [How it works](README.md#how-it-works) section covers the widget
model, layout, and data layer in more detail.

## Guidelines

- **Check light and dark.** Use the semantic colour tokens in
  `app/globals.css` rather than hard-coded colours.
- **Check every size** the widget declares in `meta.sizes`.
- **Avoid new permissions.** A new permission in `public/manifest.json`
  disables the extension for existing users until they accept it, so open an
  issue first.
- **No servers or tracking.** Data stays in the browser and goes straight to
  the service that provides it. If a widget sends anything new anywhere,
  `docs/privacy.md` and `CHROMEWEBSTORE.md` need to say so.
- **Fail gracefully.** A failed fetch shows a readable message inside the
  tile, never an empty box.
