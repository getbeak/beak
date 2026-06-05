/**
 * Targeted visual driver for the request pane. Captures every sub-surface
 * (header, tabs, table rows, body type selector, options) in both light
 * and dark mode at full resolution so we can audit each piece.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SHOT_DIR = '/tmp/beak-shots/request-pane';
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
	await page
		.locator('button:has-text("Send")')
		.first()
		.waitFor({ timeout: 30_000 })
		.catch(() => console.warn('Send not found'));
	await gentle(1500);
	await page.getByText('Request', { exact: true }).first().click();
	await gentle(1200);

	for (const mode of ['dark', 'light']) {
		await setMode(page, mode);

		await page.locator('button:has-text("Send")').first().scrollIntoViewIfNeeded().catch(() => {});

		// Whole request pane
		await shot(page, `00-${mode}-full`);

		// Top header (verb + url + send)
		await shot(page, `01-${mode}-header`, { x: 280, y: 60, width: 1400, height: 100 });

		// Tab bar
		await shot(page, `02-${mode}-tabbar`, { x: 280, y: 140, width: 1400, height: 70 });

		// Headers table
		await shot(page, `03-${mode}-headers`, { x: 280, y: 170, width: 1400, height: 250 });

		// URL query (empty state)
		await page.getByText('URL query', { exact: true }).first().click();
		await gentle(400);
		await shot(page, `04-${mode}-urlquery`, { x: 280, y: 170, width: 1400, height: 250 });

		// Body — Text
		await page.getByText('Body', { exact: true }).first().click();
		await gentle(400);
		await shot(page, `05-${mode}-body-text`, { x: 280, y: 170, width: 1400, height: 400 });

		// Body — JSON
		await page.getByText('JSON', { exact: true }).first().click();
		await gentle(500);
		// Confirm the "Change body type?" dialog if it appears
		const confirm = page.getByRole('button', { name: /^Change$/ });
		if ((await confirm.count()) > 0) {
			await confirm.click();
			await gentle(400);
		}
		await shot(page, `06-${mode}-body-json`, { x: 280, y: 170, width: 1400, height: 400 });

		// Options
		await page.getByText('Options', { exact: true }).first().click();
		await gentle(400);
		await shot(page, `07-${mode}-options`, { x: 280, y: 170, width: 1400, height: 250 });

		// Footer preview
		await shot(page, `08-${mode}-footer`, { x: 280, y: 700, width: 1400, height: 180 });

		// Back to Headers for next mode
		await page.getByText('Headers', { exact: true }).first().click();
		await gentle(300);
	}

	await browser.close();
	console.log('✅ done — screenshots in', SHOT_DIR);
}

main().catch(err => {
	console.error('💥', err);
	process.exit(1);
});
