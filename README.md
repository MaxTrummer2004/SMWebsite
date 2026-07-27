# SMKnowers

A tiny **8-bit social club** for friends — write posts, sling GIFs, react. Built to
match the retro pixel look of the `beispiel/` template: Next.js 16, React 19,
Tailwind CSS v4, TypeScript, `motion`, `next-themes`, `lenis`, and a heavy dose of
**React Bits Pro** components on every text/post box.

Local-first: your feed lives in the browser (`localStorage`). No accounts, no server.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with CSS-variable design tokens (orange accent, dark "panel" hero)
- **Press Start 2P** pixel font for headings/labels, **Geist** for body
- **React Bits Pro** (Ultimate license) animated components

## React Bits components in use

| Component | Where | What it does |
|---|---|---|
| `dither-cursor` | global overlay | pixelated orange dither trail following the cursor |
| `blinking-squares` | hero backdrop | quietly twinkling pixel grid |
| `parallax-pills` | hero | cursor-parallax topic pills (#gifs, #memes, …) |
| `staggered-text` | hero + About headings | word/char reveal, animated |
| `cursor-wave` | composer banner | grid reacting to cursor **and clicks** |
| `blur-highlight` | every post body | blur-in text with auto-highlighted hashtags |
| `pixel-reveal` | About showcase | pixel-sweep image reveal of the pixel art |
| `animated-list` | "Live" sidebar | auto-cycling activity ticker |

Plus the reused pixel primitives from the template: `pixel-button`, `pixel-icon`,
`pixel-field`, notched `pixel-clip` corners, and hard pixel shadows.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## GIF search (Giphy) — needs a free API key

Giphy retired its shared public demo key, so **live GIF search needs your own free
key** (takes ~2 minutes):

1. Get a key at <https://developers.giphy.com/dashboard/> (create an app → "API").
2. Add it to `.env.local`:

   ```bash
   NEXT_PUBLIC_GIPHY_KEY=your_key_here
   ```

3. Restart `npm run dev`.

Until then, the GIF picker still works: use the **"paste a GIF link"** field to drop
any GIF URL (e.g. a `media.giphy.com/…/giphy.gif` link). Seed posts already show GIFs.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Notes

- `beispiel/` is the reference template and is excluded from the build/typecheck.
- The `.env.local` holds the React Bits license key (`REACTBITS_LICENSE_KEY`) and,
  optionally, `NEXT_PUBLIC_GIPHY_KEY`. It is git-ignored.

## Planned / TODO

- **Posting via reply or a dedicated button:** compose should happen either from a
  per-post **Reply** button (opens a composer under that post) or from the dedicated
  **New post** / **Write a post** buttons — not only the always-open top composer.
