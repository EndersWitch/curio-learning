import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: true,
		port: 8000,
		allowedHosts: ['.exe.xyz', '.edtechathon.com']
	},
	preview: {
		host: true,
		port: 8000,
		allowedHosts: ['.exe.xyz', '.edtechathon.com']
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// The site is published on Vercel by the teacher.dev Sites scripts.
			adapter: adapter()
		})
	]
});
