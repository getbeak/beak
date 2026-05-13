import { expect, test } from '@playwright/test';

/**
 * Smoke checks for the web host. These run the renderer in a real browser
 * against `pnpm start:apps-host-web`'s Vite dev server.
 *
 * The welcome screen was removed in May 2026 — the app now boots straight
 * into a project window (most-recent or untitled). These tests assert the
 * boot pipeline is healthy without depending on any welcome-screen DOM.
 */

test('web host: dev server responds at the root', async ({ page, baseURL }) => {
	const response = await page.goto(baseURL ?? '/');
	expect(response, 'no response received from dev server').not.toBeNull();
	expect(response?.status()).toBeGreaterThanOrEqual(200);
	expect(response?.status()).toBeLessThan(400);
});

test('web host: index.html mentions the renderer entry script', async ({ page }) => {
	await page.goto('/');
	const html = await page.content();
	expect(html).toMatch(/<script[^>]+type="module"/);
});

test('web host: document title is Beak', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/beak/i);
});

test('web host: renderer mounts something into <body>', async ({ page }) => {
	await page.goto('/');
	// Vite's dev server compiles modules lazily; give the renderer a moment
	// to fetch, transform, and execute. We're not pinning a specific
	// component — just verifying React mounted *something*.
	await expect
		.poll(
			async () => {
				const text = (await page.locator('body').textContent({ timeout: 1_000 }).catch(() => '')) ?? '';
				return text.length;
			},
			{ timeout: 30_000, intervals: [500, 1_000, 2_000] },
		)
		.toBeGreaterThan(0);
});

test('web host: root redirects into a /project/ route', async ({ page }) => {
	await page.goto('/');
	// The web entrypoint Navigate-replaces `/` to `/project/default` so the
	// renderer always boots inside ProjectMain rather than the deleted
	// welcome screen. Allow time for the redirect to land.
	await expect.poll(() => page.url(), { timeout: 30_000 }).toMatch(/\/project\//);
});

test('web host: reload re-mounts the renderer cleanly', async ({ page }) => {
	await page.goto('/');
	await expect.poll(() => page.url(), { timeout: 30_000 }).toMatch(/\/project\//);
	await page.reload();
	await expect.poll(() => page.url(), { timeout: 30_000 }).toMatch(/\/project\//);
});

test('web host: mesh-gradient backdrop is present during boot', async ({ page }) => {
	await page.goto('/');
	// MeshGradient mounts inside ProjectLoading while the project state is
	// resolving. The component carries a data-testid we can assert against.
	const gradient = page.getByTestId('mesh-gradient');
	await expect(gradient.first()).toBeVisible({ timeout: 30_000 });
});
