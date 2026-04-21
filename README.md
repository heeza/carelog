# CareLog — Interactive Prototype

Handoff bundle from Claude Design, implemented as a static React prototype (UMD React 18 + Babel standalone, no build step).

## Run

Serve the folder over HTTP and open `index.html`:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

(Opening `index.html` directly via `file://` won't load the `.jsx` scripts due to CORS.)

## Structure

- `index.html` — entry, loads React + Babel from CDN and the JSX modules
- `tokens.jsx` — design tokens (color, type, spacing)
- `store.jsx` — shared app state
- `frame.jsx` / `android-frame.jsx` — device frames
- `caregiver.jsx` — caregiver surface
- `guardian.jsx` — guardian surface
- `companion.jsx` — companion surface
- `settings.jsx` — settings surface
- `design-canvas.jsx` — design canvas view
- `app.jsx` — top-level app shell and routing
