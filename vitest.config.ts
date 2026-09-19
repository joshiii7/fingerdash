import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The Svelte plugin lets component tests import .svelte files. The browser condition makes
  // Svelte load its client build (mount, flushSync) instead of the server one.
  plugins: [svelte({ hot: false })],
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
