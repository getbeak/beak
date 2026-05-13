import { expect, test } from '@playwright/test';

/**
 * Smoke checks for the web host. These run the renderer in a real browser
 * against `pnpm start:apps-host-web`'s Vite dev server.
 *
 * Asserts:
 * 1. The dev server is alive at the root.
 * 2. Vite injects the entry script tag into index.html.
 * 3. The renderer mounts something into `<body>` (i.e. no module-load
 *    failures that prevent React's first render).
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

test('web host: welcome screen offers project entry points', async ({ page }) => {
	await page.goto('/');
	// Boots into WebWelcome → Welcome → GetStartedColumn, which surfaces
	// "Create a new project" and "Open an existing project". These strings
	// are stable and reflect the absence of a loaded project — a strong
	// smoke check that the entire renderer + IPC chain is wired.
	await expect(page.getByText('Create a new project')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText('Open an existing project')).toBeVisible();
});

test('web host: "Create a new project" transitions to the create-local view', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Create a new project')).toBeVisible({ timeout: 30_000 });
	await page.getByText('Create a new project').click();
	// CreateView shows a "Give your project a name" label and a "Select folder" button.
	await expect(page.getByText('Give your project a name')).toBeVisible();
	await expect(page.getByText('Select folder')).toBeVisible();
});
