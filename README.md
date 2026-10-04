# Fingerdash

A free, fully client-side touch-typing tutorial and Monkeytype-style typing test. No backend, no accounts — everything (settings, personal bests, tutorial progress) is saved to `localStorage` in your browser.

## Features

- **Typing test**: five modes.
  - **time** (15/30/60/120s) and **words** (10/25/50/100), with number and punctuation toggles. Punctuation mode builds sentence-shaped random text: capitalized starts, a comma in every sentence, and occasional apostrophes, quotes, hyphens, spaced dashes, and `@` handles.
  - **quote**: about 50 public-domain or original quotes in short, medium, and long groups, with the source shown after the test.
  - **custom**: your own text (up to 5,000 characters), tidied so it can be typed on a US keyboard.
  - **code**: PHP, JavaScript, Python, Java, HTML, CSS, C++, C, and C# snippets typed across multiple lines with Enter. Indentation can be skipped automatically or typed.
  - The results screen shows WPM, raw WPM, accuracy, consistency, a WPM-over-time chart, and the language or source where relevant. Personal bests are tracked per mode and option (custom text records none).
- **Tutorial**: guided lessons progressing from the home row through the top row, bottom row, numbers, and punctuation. An on-screen keyboard highlights the next key and which finger to use. Lessons are defined as JSON data with configurable pass thresholds (accuracy + WPM), so new lessons can be added without touching code.
- **Themes**: dark (default, GitHub-dark style), light (GitHub-light style), Nord, and Solarized — switchable from the command palette (`Ctrl+K`) and remembered across visits. The palette also switches test modes, code language, and other test settings.
- **Gun Mode** (off by default, Test page only): every typed character fires a loud, synthesised gunshot, and a wrong key adds a ricochet. The gun never runs dry or needs reloading, so the fire sounds just keep going. Pick a weapon: Rak-Rak rifle (default), SMG, Shotgun, Pistol, or Revolver. Toggle with `Ctrl+G` (`Cmd+G` on a Mac) or the crosshair button under the test settings. The volume slider goes from 0 to 200% (default 200%), with a mute button; `Ctrl+Shift+V` focuses it. The palette (`Ctrl+K`) also has Gun Mode commands. All sounds are generated with the Web Audio API (no audio files), and weapon, volume, mute, and the on/off state are saved. Source: `src/lib/gun/` and `src/lib/components/GunHud.svelte`; the sounds are tuned in `src/lib/gun/weapons.ts` and `src/lib/gun/gunAudio.ts`.
- Keyboard-first, accessible UI with visible focus states and `prefers-reduced-motion` support.

## Setup

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm run test      # run the Vitest unit test suite
npm run lint      # ESLint + Prettier check
npm run check     # svelte-check + TypeScript
```

## Architecture

- **`src/lib/engine/`** — the typing engine itself: a framework-independent TypeScript module (`typingEngine.ts`) with no DOM or Svelte dependency. It's driven purely by `handleKey(key, timestamp)` calls and a cheap `getSnapshot()` read, and is covered by unit tests (`typingEngine.test.ts`). `challenge.ts` defines the single `Challenge` shape (target text + word boundaries) that both the typing test and the tutorial generate and feed into the same engine — the engine has no notion of "test" vs "lesson." `useTypingSession.ts` wires the engine to a throttled (~150ms) poll loop and a document-level `keydown` listener, exposing a Svelte store for the UI, so the hot path (every keystroke) never touches Svelte reactivity directly.
- **`src/lib/components/`** — shared presentational components: `TypingArea` (renders per-character spans and an animated caret), `Keyboard`, `WpmChart` (inline SVG), `ResultsScreen`, `ModeSelector`, `CustomTextDialog`, `CommandPalette`.
- **Text generation** — `src/lib/engine/punctuation.ts` is a pure, seedable sentence generator (unit-tested); `src/lib/text/customText.ts` normalizes custom text to typeable ASCII; `src/lib/engine/pick.ts` picks a random quote or snippet without repeating the last one. The engine's `text` challenge kind types multi-line code character by character, with Enter as a newline and optional indentation skipping.
- **Code snippets** — `src/data/code/<language>.json`, one file per language, fetched lazily (`import.meta.glob`) so a visitor only downloads the language they pick. Quotes live in `src/data/quotes/quotes.json`.
- **`src/lib/views/`** — `TestView` and `TutorialView` each own a `TypingSession` and translate user settings / lesson data into `Challenge`s, but reuse the same engine, renderer, and results UI.
- **`src/lib/stores/`** — `localStorage`-backed Svelte stores for settings, test personal bests, and tutorial progress.
- **`src/data/`** — JSON content: word lists, quotes, and lesson definitions (one file per key-row group, aggregated in `src/data/lessons/index.ts`).
- **Routing and SEO** — pages have real URLs (`/tutorial/`, `/about/`, ...). `src/lib/router/router.ts` is a small History API router that also turns ordinary link clicks into in-app navigation and migrates old `#/about` bookmarks. Every page is declared once in `src/lib/config/pages.ts` (URL, title, description, schema type). At build time `plugins/prerender.ts` writes a static `index.html` per page with its own `<head>` (title, description, canonical, Open Graph, Twitter, JSON-LD), plus `sitemap.xml`, `robots.txt`, and a plain `404.html` page, and fails the build if a page's head is wrong or two pages share a canonical. The page _body_ is still rendered in the browser. `src/lib/seo/head.ts` holds the pure, unit-tested builders.
- **Dialogs** — every modal (command palette, custom text, "Clear my data") uses `Modal.svelte`: backdrop press-and-release to close, Esc, focus trap and focus return, scroll lock, and a pause on the typing listener while open.

- **Images** — every image is a `<picture>` (or a small `<img>` with explicit dimensions) built from `assets-src/` by `npm run images` into `src/assets/`, with a manifest (`src/assets/images.json`) that records the real file sizes. Components read it through `src/lib/config/images.ts`, so URLs come from Vite; nothing is hard-coded and no CSS `background-image` is used for content or banners. Banners and screenshots get a desktop `srcset` (1024 and 1584 wide, or 960 and 1440) plus a separate mobile file for `(max-width: 48rem)`. The mobile banners are cropped to the subject, not just shrunk.
- **Mistake labels** — the engine remembers the key typed at each wrong position (`RenderChar.typed`), and `TypingArea` draws it small above the character. The setting "Show typed mistakes" (on by default) is saved with the other settings and is in the command palette. Turning it off removes the labels and the extra line spacing.

## Images and screenshots

```
npm run images        # rebuild src/assets/ from assets-src/ (needs no browser)
npm run screenshots   # build, serve, capture the Test and Tutorial pages, then run "images"
```

`npm run screenshots` uses Playwright, which needs its Chromium once: `npx playwright install chromium`. The originals and raw captures live in `assets-src/` (about 2.7 MB) and are not part of the build.

## Before you publish: placeholders

These are marked `TODO` and the build prints a warning listing any that are still unset:

- **Site URL** (canonicals, Open Graph, JSON-LD, sitemap, `robots.txt`): defaults to `https://fingerdash.vercel.app/` (`DEFAULT_SITE_URL` in `src/lib/config/site.ts`). To build for another domain, set the `SITE_URL` environment variable (in Vercel: Project Settings > Environment Variables).
- **GitHub profile** (footer, About, structured data): `GITHUB_PROFILE_URL` in the same file. Author: [Joshi Angelo Z. Adlawan](https://github.com/joshiii7).
- **Author name** (`<meta name="author">`, the About page, structured data): `AUTHOR_NAME` in `src/lib/config/site.ts`.
- **Portfolio link** on the About page: `PORTFOLIO_URL` in the same file (leave empty to hide it).

## Deploying

Fingerdash is hosted on Vercel at https://fingerdash.vercel.app/, served from the domain root.

1. In Vercel, choose **Add New > Project** and import this GitHub repo.
2. Set the framework preset to **Vite**. The defaults are right: build command `npm run build`, output directory `dist`.
3. Deploy. After that, every push to `main` goes to production and every other branch or pull request gets its own preview URL.

`vercel.json` only sets `trailingSlash`, so `/about` redirects to `/about/` and matches the canonical URLs. It has no SPA rewrite on purpose: the build already writes a real `index.html` for every page, so deep links work, and unknown URLs get the real `404.html`.

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, tests, and a build on pushes to `main` and on pull requests. It doesn't deploy anything.
