# Chrome Web Store Listing — Widget Box

> Last Updated: 2026-11-13

## Store Listing

**Extension Name**
Widget Box

**Short Description** (≤132 chars)
A new tab with Unsplash backgrounds and a grid of live widgets.

**Detailed Description**

```
Widget Box replaces your new tab page with a full-screen photo, a large clock, a search box, and a grid of small widgets you arrange yourself.

WIDGETS
Weather, air quality, sunrise and sunset, and moon phase for any city
Market quotes and currency conversion
Focus timer, countdowns, world clocks, and a calendar
Notes and a daily note that stay on your device
Battery, CPU, memory, network, and open-tab counts for this computer
"On this day" history, a breathing guide, ambient sounds, and more
Spotify "now playing", if you connect your own Spotify account

MAKE IT YOURS
Drag widgets into place and pick a size for each one. Choose a centered, left-aligned, or split layout, light or dark appearance, and how often the background photo changes. Save photos you like to favorites and rotate through only those.

HOW TO USE
1. Install and open a new tab. A short setup lets you pick a starter layout.
2. Click the add button to browse widgets and drop them onto the grid.
3. Open Settings to add your Unsplash key for photos and adjust appearance.

PRIVACY
Your layout, notes, and settings are stored only in this browser. Widget Box has no account, no analytics, and no server of its own. Widgets request public data (weather, quotes, photos) directly from the services that provide it, and searches go to your default search engine.

SUPPORT
Report problems at https://github.com/benz206/widget-box/issues
```

**Category**
Make Chrome Yours → Functionality & UI

**Single Purpose**
Replaces the new tab page with a customizable dashboard of a background photo, search, and glanceable widgets.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | public/icons/128.png |
| Screenshot 1 | 1280×800 | ✅ Ready | store-assets/1-dashboard.png |
| Screenshot 2 | 1280×800 | ✅ Ready | store-assets/2-split-dark.png |
| Screenshot 3 | 1280×800 | ✅ Ready | store-assets/3-library.png |
| Screenshot 4 | 1280×800 | ✅ Ready | store-assets/4-setup.png |
| Small Promo Tile | 440×280 | ✅ Ready | store-assets/promo-440x280.png |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes
1. Centered layout, light: photo, clock, search, and weather, markets, calendar, focus timer, sky, and system widgets.
2. Split layout, dark, with a fuller grid.
3. Widget library open over the dashboard.
4. First-run setup.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `search` | permissions | The search box on the new tab sends the typed query to the user's own default search engine instead of a hardcoded one. |
| `identity` | permissions | The optional Spotify widget signs the user in to their Spotify account through Chrome's sign-in window so it can show the track currently playing. |
| `system.cpu` | permissions | The "System" and "This Device" widgets show current CPU usage and processor model. |
| `system.memory` | permissions | The "System" and "This Device" widgets show used and available memory. |
| `https://query1.finance.yahoo.com/*` | host_permissions | The Markets widget reads stock and index quotes from this public quote endpoint, which does not allow cross-origin requests without a host permission. |
| `chrome_url_overrides.newtab` | override | The extension's purpose is to provide the new tab page. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes — limited, and never sent to the developer.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | — | — | No |
| Health info | No | — | — | No |
| Financial info | No | — | — | No |
| Authentication info | Yes (optional) | Only to Spotify | Spotify sign-in token for the now-playing widget | Only with Spotify |
| Personal communications | No | — | — | No |
| Location | Yes (city name the user types) | To Open-Meteo | Weather, air quality, daylight | Only with Open-Meteo |
| Web history | No | — | — | No |
| User activity | No | — | — | No |
| Website content | No | — | — | No |

Notes, layout, favorites, API keys, and cached responses are kept in the browser's local storage and are never transmitted. The Tabs widget counts open tabs but does not read their URLs or titles.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**: https://benz206.github.io/widget-box/privacy (source: `docs/privacy.md`)

```
Privacy Policy for Widget Box
Last updated: 2026-11-12

What data is stored
Widget Box stores your dashboard layout, widget settings, notes, favorite photos, the API keys you enter, and cached widget data in your browser's local storage. Nothing is sent to the developer; Widget Box has no server, account system, or analytics.

What is sent to third-party services
Widgets request data directly from the services that provide it:
- Open-Meteo (weather, air quality, geocoding): the city names you enter.
- Unsplash (background photos): your access key and any photo search term you choose.
- Yahoo Finance (Markets widget): the ticker symbols you add.
- Frankfurter (Currency widget): the currencies you choose.
- Wikipedia (On This Day widget): today's date.
- Spotify (optional): if you connect your account, a sign-in token is stored locally and used only to ask Spotify what is currently playing.
Searches typed into the search box are handled by your browser's default search engine.

Each service's own privacy policy applies to requests sent to it.

Data sharing
Widget Box does not sell or share your data with anyone beyond the requests listed above.

Retention and deletion
Data stays until you remove it. "Refresh widget data" in Settings clears cached responses; removing a widget deletes its stored state; uninstalling Widget Box deletes everything.

Changes
Changes to this policy will be posted at this URL with a new "Last updated" date.

Contact
Questions about privacy: https://github.com/benz206/widget-box/issues
```

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name**: Ben Zhou
**Contact Email**: _a dedicated address, not your personal one (shown on the listing; verified in the dashboard)_
**Support URL**: https://github.com/benz206/widget-box/issues
**Homepage URL**: https://github.com/benz206/widget-box

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.1.0 | 2026-11-12 | Initial release | Published |

## Review Notes

### Known Issues / Limitations
- Background photos need the user's own Unsplash access key unless one is built in; without it the page shows a plain gradient.
- The Spotify widget needs the user's own Spotify developer app, with the published extension ID's `chromiumapp.org` redirect URI.
- Upload `release/widget-box.zip` from `bun run package`; it has no `.env` keys and no manifest `key`, so the store assigns the published ID.

### Rejection History
| Date | Reason | Fix Applied | Resubmitted |
|------|--------|-------------|-------------|
