/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { configDefaults } from 'vitest/config'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/tools/fraction-fun/',
  plugins: [svelte()],
  // Agent worktrees live under .claude/ and carry their own copies of the tests.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
})
