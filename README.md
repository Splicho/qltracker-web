# QLTracker Web

Marketing, downloads, and notification backend site for [QLTracker](https://github.com/Splicho/QLTracker), built with Next.js 16 and HeroUI 3.

## Overview

This app currently includes:

- a video-backed landing page
- OS-aware download CTA selection from GitHub releases
- a `/downloads` page that lists release assets for Windows and Linux
- Discord notification backend routes for the desktop app
- a Discord OAuth callback surface and join bridge for notification DMs
- a Prisma/Postgres data model for linked Discord users and notification rules
- HeroUI 3 styling with project-level theme tokens in [app/globals.css](/c:/Users/stupi/Documents/Repos/qltracker-web/app/globals.css)

Release data is fetched from the GitHub Releases API for `Splicho/QLTracker` and revalidated on the server.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- HeroUI 3 RC
- Tailwind CSS 4
- Prisma
- PostgreSQL

## Project Structure

```text
app/
  api/                    Notification API routes
  auth/discord/callback   Discord OAuth completion route
  health/route.ts         Service health probe
  join/[deliveryId]/      HTTPS Steam join bridge
  downloads/page.tsx     Downloads page
  layout.tsx             Root layout and metadata
  page.tsx               Home page entry
components/
  download-button-group.tsx
  home-footer.tsx
  home-header.tsx
  home-hero.tsx
  icon.tsx
lib/
  download-target.ts     GitHub release fetching and OS detection
  server/                Notification backend modules
prisma/
  schema.prisma          Notification service data model
scripts/
  notifications-worker.ts
public/
  images/                Logo assets
  video/                 Background video assets
```

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run notifications:worker
```

The Prisma scripts load environment variables from `.env.local`, so `DATABASE_URL` does not need to live in a separate `.env` file for local development.

## Download Logic

The download CTA is driven by [lib/download-target.ts](/c:/Users/stupi/Documents/Repos/qltracker-web/lib/download-target.ts).

It currently:

- fetches releases from `https://api.github.com/repos/Splicho/QLTracker/releases`
- detects visitor platform from the request user agent
- selects the best matching asset when possible
- falls back to the release page when no direct match is available

The site uses the releases list endpoint instead of GitHub's `latest` release endpoint so prereleases are still available when needed.

## Notification Backend

This repo now hosts the web-side notification service used by the desktop app.

Implemented API surface:

- `POST /api/auth/discord/link-sessions`
- `GET /api/auth/discord/link-sessions/:id`
- `GET /api/me`
- `POST /api/auth/logout`
- `GET /api/notification-rules`
- `POST /api/notification-rules`
- `PATCH /api/notification-rules/:id`
- `DELETE /api/notification-rules/:id`
- `GET /auth/discord/callback`
- `GET /join/:deliveryId`
- `GET /health`

The worker process polls the Steam server list, evaluates enabled rules, and sends Discord DMs only on a false-to-true threshold crossing.

Required environment variables are documented in [\.env.example](/c:/Users/stupi/Documents/Repos/qltracker-web/.env.example):

- `PUBLIC_BASE_URL`
- `DATABASE_URL`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_BOT_TOKEN`
- `STEAM_API_KEY`
- `SESSION_SECRET`
- `WORKER_POLL_INTERVAL_MS`

## Notes

- Social links in the footer are still placeholder `#` links unless you wire real URLs.
- The homepage video expects an asset at `public/video/video.webm`.
- The downloads page currently focuses on Windows and Linux assets.
- Notification rule management still belongs in the desktop app. This web repo provides the hosted API, OAuth callback, and join bridge.
