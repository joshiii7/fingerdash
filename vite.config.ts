import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { prerender } from './plugins/prerender.ts';

// Single source of truth for the GitHub Pages base path. Override with
// VITE_BASE_PATH at build time (e.g. for a custom domain, set it to '/').
const BASE_PATH = process.env.VITE_BASE_PATH ?? '/fingerdash/';

// https://vite.dev/config/
export default defineConfig({
  base: BASE_PATH,
  plugins: [svelte(), prerender()],
});
