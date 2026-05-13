/**
 * Visual driver — opens the web host in a real Chromium browser via
 * Playwright, walks through every key surface, and writes screenshots
 * to /tmp/beak-shots/.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SHOT_DIR = '/tmp/beak-shots';
const URL = 'https://localhost:5173';
const VIEWPORT = { width: 1400, height: 900 };

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
	// Fresh slate each run.
	await fs.rm(SHOT_DIR, { recursive: true, force: true });
	await fs.mkdir(SHOT_DIR, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const ctx = await browser.newContext({
		ignoreHTTPSErrors: true,
		viewport: VIEWPORT,
		deviceScaleFactor: 2,
	});
	const page = await ctx.newPage();

	page.on('pageerror', err => console.error('🔥', err.message.slice(0, 200)));

	console.log('→ Booting…');
	await page.goto(URL).catch(() => {});
	await page
		.waitForURL(/\/project\/[A-Za-z0-9_-]{15,}/, { timeout: 60_000 })
		.catch(() => console.warn('… root redirect did not settle'));
	await page
		.locator('button:has-text("Send")')
		.first()
		.waitFor({ timeout: 30_000 })
		.catch(() => console.warn('→ Send button did not appear'));
	await gentle(1500);

	// ─── Welcome / Getting started tab ─────────────────────────────
	await setMode(page, 'dark');
	await shot(page, '01-welcome-dark');

	await setMode(page, 'light');
	await shot(page, '02-welcome-light');

	// Hover the primary CTA so we can see the hover state.
	const ctaBtn = page.getByRole('button', { name: /Send your first request/i }).first();
	if ((await ctaBtn.count()) > 0) {
		await ctaBtn.hover();
		await gentle(400);
		await shot(page, '03-welcome-light-cta-hover');
	}

	await setMode(page, 'dark');

	// ─── Request editor ─────────────────────────────────────────────
	const requestNode = page.getByText('Request', { exact: true }).first();
	if ((await requestNode.count()) > 0) {
		await requestNode.click();
		await gentle(800);
		await shot(page, '04-request-editor');
	}

	// Hover the Send button (request header).
	const send = page.getByRole('button', { name: /^Send$/i }).first();
	if ((await send.count()) > 0) {
		await send.hover();
		await gentle(300);
		await shot(page, '05-request-send-hover');
	}

	// Click the URL query tab.
	const urlQueryTab = page.getByText('URL query', { exact: true }).first();
	if ((await urlQueryTab.count()) > 0) {
		await urlQueryTab.click();
		await gentle(300);
		await shot(page, '06-request-url-query');
	}

	// Body tab.
	const bodyTab = page.getByText('Body', { exact: true }).first();
	if ((await bodyTab.count()) > 0) {
		await bodyTab.click();
		await gentle(300);
		await shot(page, '07-request-body');
	}

	// Options tab.
	const optionsTab = page.getByText('Options', { exact: true }).first();
	if ((await optionsTab.count()) > 0) {
		await optionsTab.click();
		await gentle(300);
		await shot(page, '08-request-options');
	}

	// Back to Headers + send a request.
	const headersTab = page.getByText('Headers', { exact: true }).first();
	if ((await headersTab.count()) > 0) {
		await headersTab.click();
		await gentle(200);
	}

	if ((await send.count()) > 0) {
		await send.click();
		await gentle(600);
		await shot(page, '09-flight-in-progress');
		await gentle(3000);
		await shot(page, '10-response-pretty');
	}

	// Click the Headers tab in the response (Inspector).
	const respHeadersTab = page.locator('[role=tab]').filter({ hasText: /^Headers$/ }).nth(1);
	if ((await respHeadersTab.count()) > 0) {
		await respHeadersTab.click();
		await gentle(400);
		await shot(page, '11-response-headers');
	}

	// Switch back to Response panel pretty (json viewer)
	const overviewTab = page.locator('[role=tab]').filter({ hasText: /^Overview$/ }).first();
	if ((await overviewTab.count()) > 0) {
		await overviewTab.click();
		await gentle(400);
		await shot(page, '12-response-overview');
	}

	// ─── Omni-bar ───────────────────────────────────────────────────
	await page.keyboard.press('Control+P').catch(() => {});
	await gentle(900);
	await shot(page, '13-omni-finder-empty');
	await page.keyboard.type('Req', { delay: 40 });
	await gentle(1200);
	await shot(page, '14-omni-finder-query');
	await page.keyboard.press('Escape');
	await gentle(400);

	await page.keyboard.press('Control+Shift+P').catch(() => {});
	await gentle(1100);
	await shot(page, '15-omni-commands');
	await page.keyboard.press('Escape');
	await gentle(300);

	// ─── Light mode of the same shell ───────────────────────────────
	await setMode(page, 'light');
	await shot(page, '16-shell-light-final');

	await browser.close();
	console.log('✅ done — screenshots in', SHOT_DIR);
}

main().catch(err => {
	console.error('💥 visual driver crashed:', err);
	process.exit(1);
});
