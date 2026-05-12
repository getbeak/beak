import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
	integrations: [react()],
	vite: {
		resolve: {
			alias: {
				'@beak/apps-web-marketing': new URL('./src', import.meta.url).pathname,
			},
		},
	},
});
