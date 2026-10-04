import manifest from '../../assets/images.json';

/**
 * Every image the site serves comes from `src/assets/` through Vite, so its URL is hashed and
 * is served from the site root. Nothing here is a hard-coded path.
 * The files and their real sizes come from `npm run images`, recorded in `images.json`.
 */
const urls = import.meta.glob('../../assets/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

interface ManifestFile {
  file: string;
  width: number;
  height: number;
}

interface ManifestEntry {
  desktop: ManifestFile[];
  mobile: ManifestFile | null;
}

export type ImageName = keyof typeof manifest;

export interface ImageFile {
  src: string;
  width: number;
  height: number;
}

export interface ImageSet {
  /** The desktop image: the fallback `<img>`, the largest one. */
  fallback: ImageFile;
  /** `srcset` for the desktop sizes, or undefined when there is only one. */
  srcset: string | undefined;
  /** Shown at or below 48rem. Undefined for images that are already small. */
  mobile: ImageFile | undefined;
}

function urlOf(file: string): string {
  const url = urls[`../../assets/${file}`];
  if (!url) throw new Error(`Image not built: ${file}. Run "npm run images".`);
  return url;
}

function toFile(entry: ManifestFile): ImageFile {
  return { src: urlOf(entry.file), width: entry.width, height: entry.height };
}

/** The desktop and mobile files for one image, ready for a `<picture>`. */
export function imageSet(name: ImageName): ImageSet {
  const entry = manifest[name] as ManifestEntry;
  const desktop = [...entry.desktop].sort((a, b) => b.width - a.width);
  return {
    fallback: toFile(desktop[0]),
    srcset:
      desktop.length > 1
        ? desktop.map((file) => `${urlOf(file.file)} ${file.width}w`).join(', ')
        : undefined,
    mobile: entry.mobile ? toFile(entry.mobile) : undefined,
  };
}

/** The media query at which the mobile image takes over. */
export const MOBILE_MEDIA = '(max-width: 48rem)';
