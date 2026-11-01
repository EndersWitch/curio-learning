import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Expose only CF_BEACON_TOKEN to the client (not every CF_* variable), so the
  // name matches the other apps without needing Vite's VITE_ prefix.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [sveltekit()],
    define: {
      'import.meta.env.CF_BEACON_TOKEN': JSON.stringify(env.CF_BEACON_TOKEN ?? ''),
    },
  }
})
