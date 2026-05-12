import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = path.resolve(__dirname, '../..');

function pkg(...segments: string[]) {
	return path.resolve(root, 'packages', ...segments);
}

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@beak/common': pkg('common/src'),
			'@beak/core': pkg('core/src'),
			'@beak/design-system': pkg('design-system/src'),
			'@beak/squawk': pkg('squawk/src/index.ts'),
			'@beak/ksuid': pkg('ksuid/src/index.ts'),
			'@beak/realtime-values': pkg('realtime-values/src'),
			'@beak/ui': path.resolve(__dirname, 'src'),
			'@getbeak/types': path.resolve(root, 'packages/types'),
		},
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		globals: true,
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules/**', 'dist/**', 'dist-ts/**', 'coverage/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', 'dist/', 'coverage/'],
		},
	},
});
