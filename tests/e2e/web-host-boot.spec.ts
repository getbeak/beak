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

test('web host: Cancel from create-local returns to the welcome view', async ({ page }) => {
	await page.goto('/');
	await page.getByText('Create a new project').click({ timeout: 30_000 });
	await expect(page.getByText('Give your project a name')).toBeVisible();
	await page.getByRole('button', { name: 'Cancel' }).click();
	// Back at the welcome entry points.
	await expect(page.getByText('Create a new project')).toBeVisible();
	await expect(page.getByText('Open an existing project')).toBeVisible();
});

test('web host: project name input drives the Select folder button', async ({ page }) => {
	await page.goto('/');
	await page.getByText('Create a new project').click({ timeout: 30_000 });
	const selectFolder = page.getByRole('button', { name: 'Select folder' });
	// The input has no accessible label (it's a styled-component <Label> div, not
	// a real <label for=…>), so target by role. CreateView has one textbox.
	const nameInput = page.getByRole('textbox');
	// Empty name → button disabled.
	await expect(selectFolder).toBeDisabled();
	// Type a valid name → button enables.
	await nameInput.fill('hello-project');
	await expect(selectFolder).toBeEnabled();
	// Clear → disabled again.
	await nameInput.fill('');
	await expect(selectFolder).toBeDisabled();
});

test('web host: reload re-mounts the welcome screen cleanly', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Create a new project')).toBeVisible({ timeout: 30_000 });
	// Reload exercises the full module + state reinit path — anything that
	// installs a side effect at module top-level and breaks on second-init
	// would manifest here.
	await page.reload();
	await expect(page.getByText('Create a new project')).toBeVisible({ timeout: 30_000 });
});

test('web host: welcome screen has a mesh-gradient backdrop', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Create a new project')).toBeVisible({ timeout: 30_000 });
	// The MeshGradient component renders a Box with a `data-testid` we can
	// assert against. The actual gradient stops are baked into a Chakra
	// style class so we don't read them back here — just confirm the
	// component is mounted and visible.
	const gradient = page.getByTestId('mesh-gradient');
	await expect(gradient).toBeVisible();
});
