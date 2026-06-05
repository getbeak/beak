import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
	integrations: [
		react({
			babel: {
				plugins: [['babel-plugin-react-compiler', { target: '19' }]],
			},
		}),
	],
	vite: {
		resolve: {
			alias: {
				'@beak/apps-web-marketing': new URL('./src', import.meta.url).pathname,
			},
		},
	},
});
