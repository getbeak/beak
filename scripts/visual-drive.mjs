/**
 * Visual driver — opens the web host in a real Chromium browser via
 * Playwright, navigates through key surfaces, and writes screenshots
 * to /tmp/beak-shots/. Read those screenshots to evaluate the visual
 * state and iterate.
 *
 * Run: node scripts/visual-drive.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SHOT_DIR = '/tmp/beak-shots';
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
	await gentle(400);
}

async function main() {
	await fs.mkdir(SHOT_DIR, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const ctx = await browser.newContext({
		ignoreHTTPSErrors: true,
		viewport: { width: 1400, height: 900 },
		deviceScaleFactor: 2,
	});
	const page = await ctx.newPage();

	page.on('pageerror', err => console.error('🔥 page error:', err.message.slice(0, 200)));

	console.log('→ Booting root (waits through bootstrap + redirect)…');
	await page.goto(URL).catch(() => {});
	// Wait for the URL to settle on a /project/<ksuid>/ route after the
	// auto-create-on-boot redirect. KSUIDs are >20 chars; "default" is 7.
	await page
		.waitForURL(/\/project\/[A-Za-z0-9_-]{15,}/, { timeout: 60_000 })
		.catch(err => console.warn('… still on root after timeout:', err.message.slice(0, 120)));
	console.log('→ Settled on', page.url());
	// Wait for the request-pane "Send" button to appear — that means the
	// renderer has finished loading + mounting the project shell.
	await page
		.locator('button:has-text("Send")')
		.first()
		.waitFor({ timeout: 30_000 })
		.catch(() => console.warn('→ Send button did not appear within 30s'));
	await gentle(1500);

	console.log('→ Dark shell');
	await setMode(page, 'dark');
	await shot(page, '01-shell-dark');

	console.log('→ Light shell');
	await setMode(page, 'light');
	await shot(page, '02-shell-light');

	// Back to dark for the rest.
	await setMode(page, 'dark');

	// Click on a request in the tree, if any.
	const requestNodes = page.locator('[data-tooltip-id="tt-sidebar-menu-item"]');
	console.log('→ Sidebar tree nodes:', await requestNodes.count());

	// Open the omni-bar finder. The shortcut accepts ctrl-or-meta on darwin,
	// but Chromium intercepts Meta+P as system print on macOS even in
	// headless mode — use Control+P instead.
	console.log('→ Opening omni finder…');
	await page.keyboard.press('Control+P').catch(() => {});
	await gentle(700);
	await shot(page, '03-omni-finder');
	await page.keyboard.press('Escape');
	await gentle(200);

	console.log('→ Opening omni commands…');
	await page.keyboard.press('Control+Shift+P').catch(() => {});
	await gentle(800);
	await shot(page, '04-omni-commands');
	await page.keyboard.press('Escape');
	await gentle(300);

	// Click "Send your first request" in the welcome hero.
	const sendFirstBtn = page.getByRole('button', { name: /Send your first request/i }).first();
	if ((await sendFirstBtn.count()) > 0) {
		console.log('→ Clicking "Send your first request"…');
		await sendFirstBtn.click();
		await gentle(1200);
		await shot(page, '05-request-editor');
	}

	// Hover the Send button in the request header.
	const sendBtn = page.getByRole('button', { name: /^Send$/i }).first();
	if ((await sendBtn.count()) > 0) {
		console.log('→ Hovering send button…');
		await sendBtn.hover();
		await gentle(400);
		await shot(page, '05b-send-hover');
	}

	// Click the Request file in the explorer to open it directly.
	const requestNode = page.getByText('Request', { exact: true }).first();
	if ((await requestNode.count()) > 0) {
		console.log('→ Clicking Request in tree…');
		await requestNode.click();
		await gentle(800);
		await shot(page, '05c-request-tree-click');
	}

	console.log('→ Final shell capture (dark)');
	await shot(page, '06-shell-dark-final');

	console.log('→ Final shell capture (light)');
	await setMode(page, 'light');
	await shot(page, '07-shell-light-final');

	await browser.close();
	console.log('✅ done — screenshots in', SHOT_DIR);
}

main().catch(err => {
	console.error('💥 visual driver crashed:', err);
	process.exit(1);
});
