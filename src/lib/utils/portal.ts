/**
 * Svelte action that moves an element to <body>. Modal dialogs use it so they
 * sit outside the app shell, which is made inert while a modal is open.
 */
export function portal(node: HTMLElement): { destroy(): void } {
  document.body.appendChild(node);
  return {
    destroy() {
      node.remove();
    },
  };
}
