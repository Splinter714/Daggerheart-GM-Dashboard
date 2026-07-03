# Daggerheart GM Dashboard

The GM screen for running Daggerheart tabletop sessions — track adversaries, Fear & Hope, countdowns, and encounter budgets from your browser, online or off. Installable as a PWA on desktop, iOS, and Android.

**Live:** https://splinter714.github.io/Daggerheart/

## Features

- **Adversary tracking** — HP/stress management, damage input, threshold calculations, minion grouping
- **Adversary browser** — full database with search and tier/type filtering, custom adversary creator
- **Encounter receipt** — party size, battle point budget, line-item adversary counts with BP adjustments
- **Countdowns** — create and track countdowns up to 100 pips with 5-pip grouping
- **Environment tracking** — location effects and environmental aspects
- **Fear & Hope** — simple fear/hope counters
- **Persistent state** — game state saves automatically across sessions
- **Drag & drop** — reorder cards with touch-friendly drag controls
- **Mobile support** — bottom NavRail on narrow screens, responsive layout
- **Installable PWA** — add to home screen / dock, works offline via service worker

## Dev

```bash
npm install
npm run dev       # localhost:5173
npm run build     # production build to ../dist
npm run deploy    # build + push to gh-pages manually (CI also deploys on push to main)
```

## Stack

React, Vite, dnd-kit, Lucide icons. No backend — all state in localStorage.

## License

Includes materials from the Daggerheart SRD 1.0 © Critical Role, LLC under the DPCGL License. Unofficial, not endorsed by Darrington Press or Critical Role.
