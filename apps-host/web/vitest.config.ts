import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// __dirname shim — this config is ESM (`"type": "module"` in package.json).
const Dirname = path.dirname(fileURLToPath(import.meta.url));

// Mirror the alias map from `vite.config.js` so cross-package imports
// (`@beak/common/...`, `@getbeak/...`) resolve in tests. Vitest reuses Vite's
// module resolution but only when these aliases are explicit.
const alias = {
	'@beak/apps-host-web': path.join(Dirname, './src'),
	'@beak/ui': path.join(Dirname, '../../packages/ui/src'),
	'@beak/common': path.join(Dirname, '../../packages/common/src'),
	'@beak/runtime-shared': path.join(Dirname, '../../packages/runtime-shared/src'),
	'@beak/state': path.join(Dirname, '../../packages/state/src'),
	'@beak/design-system': path.join(Dirname, '../../packages/design-system/src'),
	'@beak/ksuid': path.join(Dirname, '../../packages/ksuid/src'),
	'@beak/squawk': path.join(Dirname, '../../packages/squawk/src'),
	'@getbeak/extension-sdk': path.join(Dirname, '../../packages/extension-sdk/src'),
	'@getbeak/types': path.join(Dirname, '../../packages/types/src'),
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
