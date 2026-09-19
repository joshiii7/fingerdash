// Builds every image the site serves from the high-resolution originals in `assets-src/`.
//
//   npm run images
//
// Output goes to `src/assets/` (Vite hashes and serves it under the base path) and a manifest,
// `src/assets/images.json`, records each file's real dimensions so components never hard-code
// them. Run it again whenever an original changes; the output is repeatable.
//
// Each image gets desktop sizes (for `srcset`) and, unless it is already small, a mobile version
// that is cropped to the subject, not just shrunk. Screenshots are skipped until
// `npm run screenshots` has captured them.

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'assets-src');
const OUT = join(root, 'src', 'assets');

const KB = 1024;

/**
 * Encodes `pipeline` as WebP at the highest quality that fits `maxBytes`, so an image is never
 * compressed harder than its budget needs.
 */
async function encode(pipeline, maxBytes, start = 85) {
  let best;
  for (let quality = start; quality >= 40; quality -= 5) {
    best = await pipeline
      .clone()
      .webp({ quality, effort: 6 })
      .toBuffer({ resolveWithObject: true });
    if (best.data.length <= maxBytes) break;
  }
  return best;
}

const manifest = {};
const report = [];

async function write(group, kind, file, pipeline, maxKb) {
  mkdirSync(join(OUT, group), { recursive: true });
  const { data, info } = await encode(pipeline, maxKb * KB);
  writeFileSync(join(OUT, group, file), data);
  const entry = {
    file: `${group}/${file}`,
    width: info.width,
    height: info.height,
    bytes: data.length,
  };
  report.push({ ...entry, kind, budgetKb: maxKb });
  return entry;
}

function sourceSize(path) {
  return existsSync(path) ? statSync(path).size : 0;
}

// --- Banners -------------------------------------------------------------------------------
// Both are 1584x672 landscapes. On a 390px phone the home banner renders about 390x502 and the
// inner-page banners about 390x180 to 390x270, so the mobile crops are taller and framed on
// the subject: the hands on the keyboard (home) and the beam of light (inner pages).
const banners = [
  {
    name: 'banner-home',
    source: 'banners/banner-home.jpg',
    // ~0.92 aspect: keeps the hands and keyboard, which sit right of centre.
    mobileCrop: { left: 880, top: 0, width: 620, height: 672 },
    mobileWidth: 620,
  },
  {
    name: 'banner-page',
    source: 'banners/banner-page.jpg',
    // ~1.45 aspect: keeps the beam of light and the river below it.
    mobileCrop: { left: 606, top: 0, width: 978, height: 672 },
    mobileWidth: 800,
  },
];

for (const banner of banners) {
  const input = join(SRC, banner.source);
  const entry = { desktop: [], mobile: null, originalBytes: sourceSize(input) };
  entry.desktop.push(
    await write('banners', 'desktop', `${banner.name}-1584.webp`, sharp(input), 150),
  );
  entry.desktop.push(
    await write(
      'banners',
      'desktop',
      `${banner.name}-1024.webp`,
      sharp(input).resize({ width: 1024 }),
      90,
    ),
  );
  entry.mobile = await write(
    'banners',
    'mobile',
    `${banner.name}-mobile.webp`,
    sharp(input).extract(banner.mobileCrop).resize({ width: banner.mobileWidth }),
    80,
  );
  manifest[banner.name] = entry;
}

// --- Logo ----------------------------------------------------------------------------------
// Small (well under 30 KB), so it stays one file with explicit dimensions and needs no mobile
// version. 512px covers the largest place it is drawn at 2x.
{
  const input = join(SRC, 'logo/fingerdash-logo.png');
  const file = await write(
    'logo',
    'small',
    'fingerdash-logo.webp',
    sharp(input).resize({ width: 512 }),
    30,
  );
  manifest['fingerdash-logo'] = { desktop: [file], mobile: null, originalBytes: sourceSize(input) };
}

// --- Screenshots ---------------------------------------------------------------------------
// Captured by `npm run screenshots` into assets-src/screenshots/. Desktop is 1440x900 and
// mobile is the real 390x844 mobile layout, captured at 2x, so neither is a resized copy of
// the other.
const screenshots = ['test', 'tutorial', 'tutorial-intro'];
for (const shot of screenshots) {
  const desktop = join(SRC, 'screenshots', `${shot}-desktop.png`);
  const mobile = join(SRC, 'screenshots', `${shot}-mobile.png`);
  if (!existsSync(desktop) || !existsSync(mobile)) {
    report.push({ file: `screenshots/${shot}`, kind: 'skipped', note: 'not captured yet' });
    continue;
  }
  const entry = {
    desktop: [],
    mobile: null,
    originalBytes: sourceSize(desktop) + sourceSize(mobile),
  };
  entry.desktop.push(
    await write(
      'screenshots',
      'desktop',
      `${shot}-1440.webp`,
      sharp(desktop).resize({ width: 1440 }),
      140,
    ),
  );
  entry.desktop.push(
    await write(
      'screenshots',
      'desktop',
      `${shot}-960.webp`,
      sharp(desktop).resize({ width: 960 }),
      90,
    ),
  );
  entry.mobile = await write('screenshots', 'mobile', `${shot}-mobile.webp`, sharp(mobile), 100);
  manifest[`screenshot-${shot}`] = entry;
}

// Anything from an earlier run that is no longer produced would only add weight to the build.
const known = new Set(
  Object.values(manifest).flatMap((m) =>
    [...m.desktop, m.mobile].filter(Boolean).map((f) => f.file),
  ),
);
for (const stale of ['banners/banner-home.webp', 'banners/banner-page.webp']) {
  if (!known.has(stale) && existsSync(join(OUT, stale))) rmSync(join(OUT, stale));
}

writeFileSync(join(OUT, 'images.json'), JSON.stringify(manifest, null, 2) + '\n');

const size = (bytes) => `${(bytes / KB).toFixed(1)} KB`;
console.log('\nImages written to src/assets/:\n');
for (const row of report) {
  if (row.kind === 'skipped') console.log(`  ${row.file.padEnd(46)} skipped (${row.note})`);
  else {
    const flag = row.bytes > row.budgetKb * KB ? '  OVER BUDGET' : '';
    console.log(
      `  ${row.file.padEnd(46)} ${`${row.width}x${row.height}`.padEnd(10)} ${size(row.bytes).padStart(10)}  (${row.kind}, budget ${row.budgetKb} KB)${flag}`,
    );
  }
}
if (existsSync(join(OUT, 'images.json'))) {
  const written = JSON.parse(readFileSync(join(OUT, 'images.json'), 'utf8'));
  console.log(`\nManifest lists ${Object.keys(written).length} images.`);
}
