/**
 * Capture the omnibar in light + dark mode by triggering Cmd+P.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SHOT_DIR = '/tmp/beak-shots/omnibar';
const URL = 'https://localhost:5173';

async function shot(page, name) {
	await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: false });
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

		// Trigger finder
		await page.keyboard.press('Meta+P');
		await gentle(500);
		await shot(page, `${mode}-finder-empty`);

		await page.keyboard.type('req');
		await gentle(500);
		await shot(page, `${mode}-finder-search`);

		await page.keyboard.press('Escape');
		await gentle(400);

		// Trigger commands
		await page.keyboard.press('Meta+Shift+P');
		await gentle(500);
		await shot(page, `${mode}-commands`);

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
