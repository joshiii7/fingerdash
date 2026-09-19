// Captures the Test and Tutorial pages for the About page.
//
//   npm run screenshots
//
// It builds the site, serves the build with `vite preview` under the base path, drives it in
// Chromium the way a person would (settings through localStorage, then real keystrokes), saves
// the originals to `assets-src/screenshots/`, and shuts down. Then it runs the image script, which
// turns them into the optimized WebP files. Nothing here adds hooks to the site itself.
//
// Needs Chromium once:  npx playwright install chromium

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { build, preview } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'assets-src', 'screenshots');
mkdirSync(OUT, { recursive: true });

// Fixed text, so the mistakes below land on the words they are meant to.
const CUSTOM_TEXT =
  'It was a small but steady climb, and the group kept a calm pace up the hill until the sun was high over the whole valley and the river below.';

// What is typed: "but" becomes "buy", "climb" becomes "clumb", "group" becomes "gtoup". The rest
// is right, and it stops in the middle of the sentence, like a test in progress. The typing area
// shows four lines and scrolls to keep the current one second, so on a narrow phone it stops
// earlier, keeping all three mistakes on screen.
const TYPED = {
  desktop: 'It was a small buy steady clumb, and the gtoup kept a calm pace up the',
  mobile: 'It was a small buy steady clumb, and the gtoup kept',
};

// About 65 words a minute, so the speed on screen looks like a real person.
const KEY_DELAY_MS = 180;

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  // The real mobile layout at 390x844, captured at 2x so text stays sharp on phones.
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

const STORAGE = {
  // Only settings the app already saves: dark theme, custom text, mistakes shown.
  test: {
    'fingerdash:settings': {
      theme: 'dark',
      mode: 'custom',
      customText: CUSTOM_TEXT,
      showMistakes: true,
    },
  },
  // Tutorial: earlier lessons done and their intros seen, so it opens on a practice screen.
  tutorial: {
    'fingerdash:tutorial-progress': {
      lessons: {
        'setup-1': {
          completed: true,
          bestWpm: 0,
          bestAccuracy: 0,
          date: '2026-01-01T00:00:00.000Z',
        },
        'home-row-1': {
          completed: true,
          bestWpm: 24,
          bestAccuracy: 98,
          date: '2026-01-01T00:00:00.000Z',
        },
      },
    },
    'fingerdash:tutorial-intros-seen': { seen: ['setup-1', 'home-row-1', 'home-row-2'] },
  },
  // Tutorial intro: only the reading lesson is done, so Home Row: F and J opens with its intro.
  'tutorial-intro': {
    'fingerdash:tutorial-progress': {
      lessons: {
        'setup-1': {
          completed: true,
          bestWpm: 0,
          bestAccuracy: 0,
          date: '2026-01-01T00:00:00.000Z',
        },
      },
    },
    'fingerdash:tutorial-intros-seen': { seen: ['setup-1'] },
  },
};

const PATHS = { test: 'test/', tutorial: 'tutorial/', 'tutorial-intro': 'tutorial/' };

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  // Nothing personal in frame: the footer holds the contact address, and the back-to-top
  // button and focus rings would only add noise.
  await page.addStyleTag({
    content:
      '.site-footer { visibility: hidden !important; } [aria-label="Back to top"], .back-to-top { display: none !important; } :focus { outline: none !important; }',
  });
  await page.mouse.move(0, 0);
}

/** Where the content ends, so the picture stops there instead of showing empty space. */
async function contentBottom(page) {
  return page.evaluate(() => {
    let bottom = 0;
    for (const el of document.querySelectorAll('main *')) {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0)
        bottom = Math.max(bottom, rect.bottom + window.scrollY);
    }
    return bottom;
  });
}

async function capture(page, name, size) {
  const file = join(OUT, `${name}-${size}.png`);
  const height = VIEWPORTS[size].viewport.height;
  const width = VIEWPORTS[size].viewport.width;
  if (name === 'test') {
    const bottom = Math.ceil(await contentBottom(page)) + 32;
    await page.screenshot({
      path: file,
      clip: { x: 0, y: 0, width, height: Math.min(height, bottom) },
    });
  } else {
    // Scroll so the lesson panel sits below the sticky header, then take one screen.
    await page.evaluate(() => {
      const panel = document.querySelector('.lesson-main');
      if (panel) window.scrollTo(0, panel.getBoundingClientRect().top + window.scrollY - 96);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: file });
  }
  console.log(`  ${name}-${size}.png`);
}

async function typeIn(page, text) {
  // Real keystrokes, the same way a person types, with a small delay between them.
  await page.keyboard.type(text, { delay: KEY_DELAY_MS });
  await page.waitForTimeout(400); // the typing area refreshes on a short timer
}

async function run() {
  console.log('Building...');
  await build({ root, logLevel: 'warn' });
  const server = await preview({
    root,
    preview: { port: 4180, strictPort: true, host: '127.0.0.1' },
  });
  const base = `${server.resolvedUrls.local[0]}`;
  console.log(`Serving ${base}`);

  const browser = await chromium.launch();
  try {
    for (const [size, options] of Object.entries(VIEWPORTS)) {
      for (const name of ['test', 'tutorial', 'tutorial-intro']) {
        const context = await browser.newContext({
          ...options,
          reducedMotion: 'reduce',
          colorScheme: 'dark',
        });
        await context.addInitScript((entries) => {
          for (const [key, value] of Object.entries(entries)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        }, STORAGE[name]);
        const page = await context.newPage();
        await page.goto(base + PATHS[name], { waitUntil: 'networkidle' });

        if (name === 'test') {
          await page.waitForSelector('.typing-area .char');
          await typeIn(page, TYPED[size]);
        } else if (name === 'tutorial') {
          await page.waitForSelector('.typing-area .char');
          // Type the first few letters of whatever this lesson asked for, correctly.
          const text = await page.evaluate(() =>
            document.querySelector('.typing-area').textContent.replace(/[ ]+/g, ' ').trim(),
          );
          // Stop just before a letter, not a space, so the picture shows one key and one finger.
          let count = 8;
          while (text[count] === ' ') count += 1;
          await typeIn(page, text.slice(0, count));
        } else {
          await page.waitForSelector('.intro');
        }

        await settle(page);
        await capture(page, name, size);
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((done) => server.httpServer.close(done));
  }

  console.log('Optimizing...');
  const result = spawnSync(process.execPath, [join(root, 'scripts', 'optimize-images.mjs')], {
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run().catch((error) => {
  console.error('\nScreenshots failed:', error.message);
  process.exit(1);
});
