import { expect, test } from '@playwright/test';

/**
 * Smoke check: the web host boot screen loads without throwing in the
 * renderer. We don't yet have untitled-project support (phase 3 deferred
 * that), so the boot lands on the existing web welcome screen. The
 * assertion is intentionally lenient — we want to catch hard crashes
 * during module init, not pin the welcome copy.
 */

test('web host: renderer boots without a hard error', async ({ page }) => {
	const renderErrors: string[] = [];
	page.on('pageerror', err => renderErrors.push(err.message));
	page.on('console', msg => {
		if (msg.type() === 'error') renderErrors.push(msg.text());
	});

	await page.goto('/');
	// Wait for the React tree to mount something — anything that isn't a blank body.
	await expect(page.locator('body')).not.toBeEmpty({ timeout: 30_000 });

	// We tolerate console.warn / info / etc., but a thrown error at module init
	// is a regression.
	const hard = renderErrors.filter(e => !/favicon|HMR|mkcert|service worker|fetch.*localhost:5173\/?$/i.test(e));
	expect(hard, hard.join('\n')).toEqual([]);
});

test('web host: page title contains "Beak"', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/beak/i, { timeout: 15_000 });
});
