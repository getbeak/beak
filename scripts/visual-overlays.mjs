/**
 * Probe tooltips and dialogs in both light & dark modes.
 *   1. Hover a known tooltip anchor and snapshot the tooltip surface.
 *   2. Trigger the OpenAPI import dialog (no actual import) and snap it.
 *   3. Tear down and switch modes.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SHOT_DIR = '/tmp/beak-shots/overlays';
const URL = 'https://localhost:5173';

async function shot(page, name, clip) {
	await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, clip, fullPage: false });
	console.log(`📸 ${name}.png`);
}

async function gentle(ms) {
	await new Promise(r => setTimeout(r, ms));
}

async function setMode(page, mode) {
	await page.evaluate(m => {
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(m);
	}, mode);
	await gentle(350);
}

async function main() {
	await fs.rm(SHOT_DIR, { recursive: true, force: true });
	await fs.mkdir(SHOT_DIR, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const ctx = await browser.newContext({
		ignoreHTTPSErrors: true,
		viewport: { width: 1400, height: 900 },
		deviceScaleFactor: 2,
	});
	const page = await ctx.newPage();
	page.on('pageerror', err => console.error('🔥', err.message.slice(0, 200)));

	await page.goto(URL).catch(() => {});
	await page.waitForURL(/\/project\/[A-Za-z0-9_-]{15,}/, { timeout: 60_000 }).catch(() => {});
	await page.locator('button:has-text("Send")').first().waitFor({ timeout: 30_000 }).catch(() => {});
	await gentle(1500);

	for (const mode of ['dark', 'light']) {
		await setMode(page, mode);

		// — Tooltip on the encryption (lock) button
		const lock = page.locator('#tt-action-bar-encryption-button').first();
		if ((await lock.count()) > 0) {
			await lock.hover();
			await gentle(800);
			await shot(page, `${mode}-tooltip-lock`, { x: 1100, y: 0, width: 600, height: 220 });
			await page.mouse.move(0, 0);
			await gentle(400);
		}

		// — Project encryption dialog
		await lock.click();
		await gentle(700);
		await shot(page, `${mode}-dialog-encryption`);
		await page.keyboard.press('Escape');
		await gentle(400);
	}

	await browser.close();
	console.log('✅ done — screenshots in', SHOT_DIR);
}

main().catch(err => {
	console.error('💥', err);
	process.exit(1);
});
