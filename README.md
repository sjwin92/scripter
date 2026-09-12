# Scripter

Web MVP for writing **movie features** and **TV episodes**. You write the pages. AI assists from the margin and never takes over. Industry formatting is automatic. Characters are tracked as you type.

## Positioning

- **Assist, don’t replace** — there is no full-script generation from a one-liner.
- **Format is non-negotiable** — slugline, action, character, dialogue, parenthetical, transition.
- **Privacy** — *Your scripts are not used to train models.*

## Phone preview

Public GitHub Pages build (no API keys; demo AI mode):

**https://sjwin92.github.io/scripter/**

Projects are stored in `localStorage` on **this browser only**. A phone and a laptop are different stores — nothing syncs. Clearing site data deletes scripts on that device.

This is a write-first desktop MVP with a usable phone layout (stacked chrome, scene/AI/character drawers). It is not a full mobile writing app.

After merging to `main`, Pages deploys from `.github/workflows/deploy-pages.yml`. In the repo: **Settings → Pages → Source: GitHub Actions**.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Local dev is served at `/`.

```bash
npm test
npm run build
```

A production **GitHub Pages** build uses the `/scripter/` base. The deploy workflow sets `GITHUB_PAGES=true`. To reproduce that locally:

```bash
GITHUB_PAGES=true npm run build
npx vite preview
```

Without `GITHUB_PAGES`, `npm run build` stays at `/` so local preview matches `npm run dev`.

## Write

1. Create a **Feature** (film title page, three-act hints) or a **TV episode** (show name, episode title, hour / half-hour act-break presets).
2. Type on the center paper page. **Tab** / **Shift+Tab** cycles element type. **Enter** moves like Final Draft (character → dialogue → action). `INT.` / `EXT.` locks a slugline. ALL CAPS cues become characters.
3. Left rail: collapsible scene list. Status bar: page count and autosave. On a narrow screen, use the bottom **Scenes / AI / Characters** dock.
4. Right rail:
   - **AI** — next dialogue, rewrite tone, tighten, more visual, logline, synopsis, structure notes, deepen a character beat. Accept / edit / reject only. Uses a live OpenAI-compatible API when a key is present; otherwise a polished on-device demo.
   - **Characters** — auto-detected cues, appearance counts, jump-to-scene, a soft flat-arc insight.
   - **Title** — title page fields.
5. Import Fountain, plain text, or FDX. Export **PDF**, **Fountain**, or **Final Draft (FDX)**.
6. Projects live in `localStorage` on this browser.

Focus mode hides chrome. Dark mode is available from the header.

## Live AI (optional)

Copy `.env.example` to `.env` and set:

```bash
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4o-mini
# optional OpenAI-compatible base
# VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

Without a key, Scripter stays in demo mode. Suggestions still use the current scene and characters. Your scripts are not used to train models. The public Pages preview does not ship a key.

## Out of scope

Series bible / multi-episode tracker, collaboration, storyboards, production tools, mobile app, full-script generation.

## Stack

Vite, React, TypeScript. Fountain-compatible internal model. jsPDF for print-style export.
