# QLTracker Web

Marketing and downloads site for [QLTracker](https://github.com/Splicho/QLTracker), built with Next.js 16 and HeroUI 3.

## Overview

This app currently includes:

- a video-backed landing page
- OS-aware download CTA selection from GitHub releases
- a `/downloads` page that lists release assets for Windows and Linux
- HeroUI 3 styling with project-level theme tokens in [app/globals.css](/c:/Users/stupi/Documents/Repos/qltracker-web/app/globals.css)

Release data is fetched from the GitHub Releases API for `Splicho/QLTracker` and revalidated on the server.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- HeroUI 3 RC
- Tailwind CSS 4

## Project Structure

```text
app/
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
```

## Download Logic

The download CTA is driven by [lib/download-target.ts](/c:/Users/stupi/Documents/Repos/qltracker-web/lib/download-target.ts).

It currently:

- fetches releases from `https://api.github.com/repos/Splicho/QLTracker/releases`
- detects visitor platform from the request user agent
- selects the best matching asset when possible
- falls back to the release page when no direct match is available

The site uses the releases list endpoint instead of GitHub's `latest` release endpoint so prereleases are still available when needed.

## Notes

- Social links in the footer are still placeholder `#` links unless you wire real URLs.
- The homepage video expects an asset at `public/video/video.webm`.
- The downloads page currently focuses on Windows and Linux assets.
