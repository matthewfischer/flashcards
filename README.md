# H/W Flashcards

A local flashcard app for systems-hardware terminology — HPE servers plus the
technologies HPE integrates and buys: CXL, NVIDIA (NVLink, Grace/Blackwell,
Vera/Rubin), and Intel & AMD CPU/GPU roadmaps, interconnects, memory, cooling,
and the general industry terms you hear on calls.

Built for **short 5–10 minute study bursts** with Leitner-box spaced repetition.

## Desktop app (recommended)

This runs as a real macOS app — its own window and dock icon, no browser tab.

Build the installable app:

```bash
cd flashcards
npm install
npm run app:build
```

Output lands in `release/`:

- `H-W Flashcards-1.0.0-arm64.dmg` — open it and drag the app to Applications.
- `release/mac-arm64/H-W Flashcards.app` — the app bundle itself.

The app is not code-signed, so on first launch macOS Gatekeeper may warn:
right-click the app → **Open** once, then it launches normally forever after.

Develop the app with hot reload (Vite dev server inside the Electron window):

```bash
npm run app:dev
```

Regenerate the icon after editing `scripts/make-icon.mjs`:

```bash
npm run icon
```

> Heads-up (Node 26): Electron's postinstall can fail to extract its binary on
> very new Node versions. If `npx electron --version` errors after `npm install`,
> the downloaded zip is cached — extract it manually:
> ```bash
> Z=$(find ~/Library/Caches/electron -name 'electron-*.zip' | head -1)
> rm -rf node_modules/electron/dist && mkdir node_modules/electron/dist
> unzip -q "$Z" -d node_modules/electron/dist
> printf 'Electron.app/Contents/MacOS/Electron' > node_modules/electron/path.txt
> ```

## Run it in a browser instead

Development (hot reload):

```bash
cd flashcards
npm install
npm run dev
```

Then open the printed `http://localhost:5173` URL.

Single-file offline build (produces one self-contained `dist/index.html` you can
double-click and run in any browser — no server, works offline):

```bash
npm run build
open dist/index.html    # macOS
```

## How it works

- **Flip** a card to reveal the definition, then self-rate **Again / Hard /
  Good / Easy**. Ratings feed a Leitner-box scheduler so weak cards resurface
  sooner and mastered cards space out.
- **Filter** a session by **vendor** and/or **technology**, and pick a length
  (10 / 20 / 40 / all).
- **"Not useful — dismiss"** hides a card from all future sessions. Restore any
  time from **Manage dismissed**.
- Progress and dismissals persist in the browser's `localStorage`.

## Architecture: logic vs. data (kept separate)

- **Data** lives entirely in [src/data/](src/data/) as plain JSON — one file per
  category. Every `*.json` file is auto-discovered at build time
  (see [src/data/index.ts](src/data/index.ts)), so **adding or editing cards
  never requires touching code**.
- **Logic** lives in the rest of `src/`:
  - [src/leitner.ts](src/leitner.ts) — spaced-repetition scheduling
  - [src/storage.ts](src/storage.ts) — localStorage persistence
  - [src/useDeck.ts](src/useDeck.ts) — session/queue state
  - [src/App.tsx](src/App.tsx) + [src/components/](src/components/) — UI

## Adding cards

Create or edit a file in [src/data/](src/data/), e.g. `src/data/networking.json`:

```json
[
  {
    "id": "unique-stable-id",
    "term": "Term shown on the front",
    "definition": "Explanation shown on the back.",
    "vendor": "HPE",
    "category": "Networking",
    "tags": ["optional", "tags"],
    "difficulty": "intermediate",
    "roadmap": false
  }
]
```

`id` must be unique across all files. `vendor` and `category` automatically
populate the filter pills. Set `"roadmap": true` for forward-looking items so
they're flagged in the UI.

> Note: definitions are concise call-prep summaries. Verify specifics
> (dates, core counts, capacities) against vendor materials before quoting them.
