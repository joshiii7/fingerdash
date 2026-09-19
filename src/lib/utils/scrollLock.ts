let locks = 0;

/**
 * Stops the page behind a modal from scrolling. Counted, so nested or
 * overlapping modals only release the lock when the last one closes. The
 * matching CSS (html.scroll-locked) keeps the scrollbar gutter so the layout
 * doesn't jump.
 */
export function lockScroll(): void {
  if (locks++ === 0) document.documentElement.classList.add('scroll-locked');
}

export function unlockScroll(): void {
  if (locks > 0 && --locks === 0) document.documentElement.classList.remove('scroll-locked');
}
