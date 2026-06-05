import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests for Beak's web host. We start the web dev server (`pnpm
 * start:apps-host-web`) and exercise the renderer in a real browser. Build
 * issues with monaco / electron-only code are out of scope here — the dev
 * server is the supported smoke target.
 *
 * The web dev server runs on https://localhost:5173 with a self-signed cert
 * from `vite-plugin-mkcert`. We accept the cert via `ignoreHTTPSErrors`.
 */
export default defineConfig({
	testDir: './tests/e2e',
	testMatch: '**/*.spec.ts',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	// On CI the dev server boots fresh per run and can be slow on the first
	// module compile — one retry covers the rare flake without masking real
	// regressions. Locally we keep retries off so failures fire immediately.
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? [['list'], ['github']] : 'list',
	use: {
		baseURL: 'https://localhost:5173',
		ignoreHTTPSErrors: true,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'pnpm start:apps-host-web',
		url: 'https://localhost:5173',
		reuseExistingServer: !process.env.CI,
		ignoreHTTPSErrors: true,
		timeout: 120_000,
	},
});
