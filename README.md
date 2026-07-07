# boosted.

Minimalist time tracking with beautiful visuals — projects, tasks, one-click
timers, report charts, a GitHub-style activity heatmap, and AI-written
day/week recaps.

## Stack

- **Client**: Vite + React + TypeScript, TanStack React Query, Nivo charts,
  framer-motion, CSS Modules (light & dark themes)
- **Server**: Express + TypeScript, Mongoose (MongoDB Atlas), JWT auth in
  httpOnly cookies
- **AI**: Groq (llama-3.3-70b) generates the "In a glance" recaps from
  aggregate stats only

## Setup

1. Create `.env` at the repo root:

   ```
   MONGODB_URI=<your MongoDB connection string>
   AUTH_SECRET=<long random string>
   GROQ_API_KEY=<your Groq API key>
   ```

2. Install and run:

   ```
   npm install
   npm run dev
   ```

   Client: http://localhost:5173 · API: http://localhost:4000 (proxied at `/api`)

3. Optional — seed demo data (creates `demo@boosted.dev` / `password123`,
   or pass an existing account's email):

   ```
   npm run seed
   npm run seed -- you@example.com
   ```

## Production

```
npm run build
NODE_ENV=production npm start
```

Express serves the built client and the API from a single port.

## Features

- **Timeline** — records grouped by day, live tracking card, manual records
- **Projects** — color-coded projects with checkable tasks, per-task timers
- **Reports** — average daily / total stat tiles, stacked duration-per-day
  bar chart, project distribution donut, date-range presets
- **Activity** — 12-month heatmap with per-project filter and streaks
- **Glance** — day/week review with comparisons and an AI recap + tip
