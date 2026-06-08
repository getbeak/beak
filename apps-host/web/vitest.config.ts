import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// __dirname shim — this config is ESM (`"type": "module"` in package.json).
// biome-ignore lint/style/useNamingConvention: Node global `__dirname` naming.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mirror the alias map from `vite.config.js` so cross-package imports
// (`@beak/common/...`, `@getbeak/...`) resolve in tests. Vitest reuses Vite's
// module resolution but only when these aliases are explicit.
const alias = {
	'@beak/apps-host-web': path.join(__dirname, './src'),
	'@beak/ui': path.join(__dirname, '../../packages/ui/src'),
	'@beak/common': path.join(__dirname, '../../packages/common/src'),
	'@beak/runtime-shared': path.join(__dirname, '../../packages/runtime-shared/src'),
	'@beak/state': path.join(__dirname, '../../packages/state/src'),
	'@beak/design-system': path.join(__dirname, '../../packages/design-system/src'),
	'@beak/ksuid': path.join(__dirname, '../../packages/ksuid/src'),
	'@beak/squawk': path.join(__dirname, '../../packages/squawk/src'),
	'@getbeak/extension-sdk': path.join(__dirname, '../../packages/extension-sdk/src'),
	'@getbeak/types': path.join(__dirname, '../../packages/types/src'),
};

export default defineConfig({
	resolve: { alias },
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: ['node_modules', 'dist', '**/*.d.ts'],
		setupFiles: ['./src/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/__tests__/**', 'src/test-setup.ts'],
		},
	},
});
