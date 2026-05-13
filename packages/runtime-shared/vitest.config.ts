import path from 'node:path';

import { defineConfig } from 'vitest/config';

const root = path.resolve(__dirname, '../..');

export default defineConfig({
	resolve: {
		alias: {
			'@beak/state': path.resolve(root, 'packages/state/src'),
			'@beak/common': path.resolve(root, 'packages/common/src'),
			'@beak/ksuid': path.resolve(root, 'packages/ksuid/src/index.ts'),
			'@beak/squawk': path.resolve(root, 'packages/squawk/src/index.ts'),
			'@getbeak/types': path.resolve(root, 'packages/types'),
			'@getbeak/extension-sdk': path.resolve(root, 'packages/extension-sdk/src'),
		},
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: ['node_modules', 'dist', '**/*.d.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/__tests__/**'],
		},
	},
});
