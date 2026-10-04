import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { prerender } from './plugins/prerender.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), prerender()],
});
