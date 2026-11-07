import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { build, preview } from 'vite';
import puppeteer from 'puppeteer';

const BASE_URL = process.env.PUPPETEER_BASE_URL ?? 'http://127.0.0.1:4173';
const PREVIEW_PORT = Number(new URL(BASE_URL).port || 4173);

const INSTALL_HELP_COMMAND = 'sudo ./scripts/install_puppeteer_deps.sh';

let browser;
let previewServer;
let launchError;

const ANSWER_BUTTON_TEXTS = ['Inte alls', 'Svårt', 'Ganska bra', 'Mycket bra'];

async function clickByText(page, selector, text) {
	await page.waitForFunction(
		(sel, targetText) =>
			Array.from(document.querySelectorAll(sel)).some((element) => {
				const value = element.textContent ?? '';
				return value.trim().includes(targetText);
			}),
		{},
		selector,
		text,
	);

	const handles = await page.$$(selector);
	for (const handle of handles) {
		const elementText = await page.evaluate((element) => element.textContent ?? '', handle);
		if (elementText.trim().includes(text)) {
			await handle.click();
			return;
		}
	}

	throw new Error(`Could not find element matching selector "${selector}" with text "${text}"`);
}

async function openDashboard(page) {
	await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
}

before(async () => {
	process.env.SKIP_WEBFONT_DOWNLOAD = 'true';
	await build({ logLevel: 'error' });
	previewServer = await preview({
		preview: {
			port: PREVIEW_PORT,
			host: '127.0.0.1',
			strictPort: true,
		},
	});

	try {
		browser = await puppeteer.launch({
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
	} catch (error) {
		launchError = error;
		const launchMessage = error instanceof Error ? error.message : String(error);
		console.warn(
			`[puppeteer] Skipping E2E tests: ${launchMessage}\n` +
			`Install the required Chromium dependencies with \`${INSTALL_HELP_COMMAND}\` and re-run the suite.`,
		);
	}
});

after(async () => {
	if (browser) {
		await browser.close();
	}

	if (previewServer) {
		await previewServer.close();
	}
});

test('dashboard overview is displayed after loading the app', { timeout: 60_000 }, async (t) => {
	if (launchError || !browser) {
		t.skip('Puppeteer browser could not be launched in this environment.');
		return;
	}
	const page = await browser.newPage();

	try {
		await openDashboard(page);

		const headingText = await page.waitForFunction(
			(expectedText) => {
				const headings = Array.from(document.querySelectorAll('main h2'));
				const heading = headings.find((element) => element.textContent?.includes(expectedText));
				return heading?.textContent?.trim() ?? null;
			},
			{},
			'Välkommen tillbaka!',
		);

		assert.ok((await headingText.jsonValue()).includes('Välkommen tillbaka!'));
	} finally {
		await page.close();
	}
});

test('bottom navigation can reach the settings view', { timeout: 60_000 }, async (t) => {
	if (launchError || !browser) {
		t.skip('Puppeteer browser could not be launched in this environment.');
		return;
	}
	const page = await browser.newPage();

	try {
		await openDashboard(page);
		await clickByText(page, 'button', 'Inställningar');

		const settingsHeading = await page.waitForFunction(() => {
			return Array.from(document.querySelectorAll('h2')).some((element) =>
				element.textContent?.includes('Utseende'),
			);
		});

		assert.ok(await settingsHeading.jsonValue());
	} finally {
		await page.close();
	}
});

test('a learning session reveals flashcard answer controls', { timeout: 60_000 }, async (t) => {
	if (launchError || !browser) {
		t.skip('Puppeteer browser could not be launched in this environment.');
		return;
	}
	const page = await browser.newPage();

	try {
		await openDashboard(page);
		await clickByText(page, 'button', 'Starta Lektion');

		await page.waitForFunction(() => document.body.textContent?.includes('Klicka för att vända'));
		await clickByText(page, 'span', 'Klicka för att vända');

		const buttonsPresent = await page.waitForFunction((expectedButtons) => {
			const available = Array.from(document.querySelectorAll('button')).map((element) => element.textContent?.trim());
			return expectedButtons.every((label) => available.includes(label));
		}, {}, ANSWER_BUTTON_TEXTS);

		assert.ok(await buttonsPresent.jsonValue());
	} finally {
		await page.close();
	}
});

async function freshPage() {
	const context = await browser.createBrowserContext();
	const page = await context.newPage();
	await openDashboard(page);
	return { context, page };
}

async function savedState(page) {
	return page.evaluate(() => ({
		words: JSON.parse(localStorage.getItem('palabrita_word_progress')).progress,
		progress: JSON.parse(localStorage.getItem('palabrita_progress')),
		activity: JSON.parse(localStorage.getItem('palabrita_activity') || '{}'),
	}));
}

test('keyboard answer persists before leaving or reloading the lesson', { timeout: 60_000 }, async (t) => {
	if (!browser) return t.skip('Browser unavailable');
	const { context, page } = await freshPage();
	try {
		await clickByText(page, 'button', 'Starta Lektion');
		await page.waitForSelector('button[aria-label^="Visa översättning"]:focus');
		assert.equal(await page.$eval('button[aria-label^="Visa översättning"]', el => el.tagName), 'BUTTON');
		assert.ok(await page.$eval('button', () => Array.from(document.querySelectorAll('button')).filter(el => ['Inte alls', 'Svårt', 'Ganska bra', 'Mycket bra'].includes(el.textContent.trim())).every(el => el.disabled)));
		await page.keyboard.press('Enter');
		await page.waitForFunction(() => document.activeElement?.textContent.trim() === 'Inte alls');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Enter');
		await page.waitForFunction(() => JSON.parse(localStorage.getItem('palabrita_progress')).points === 10);
		const before = await savedState(page);
		assert.equal(Object.keys(before.words).length, 1);
		assert.equal(before.words.de.repetitionCount, 1);
		await page.reload({ waitUntil: 'networkidle0' });
		assert.deepEqual(await savedState(page), before);
		await clickByText(page, 'button', 'Avsluta lektionen');
		assert.deepEqual(await savedState(page), before);
	} finally { await context.close(); }
});

test('last answer is saved on summary and overview does not award twice', { timeout: 60_000 }, async (t) => {
	if (!browser) return t.skip('Browser unavailable');
	const { context, page } = await freshPage();
	try {
		await clickByText(page, 'button', 'Starta Lektion');
		for (let index = 0; index < 10; index++) {
			await page.waitForSelector('button[aria-label^="Visa översättning"]:focus');
			await page.keyboard.press('Space');
			await page.waitForFunction(() => document.activeElement?.textContent.trim() === 'Inte alls');
			await clickByText(page, 'button', 'Ganska bra');
		}
		await page.waitForFunction(() => document.activeElement?.textContent === 'Bra jobbat!');
		const before = await savedState(page);
		assert.equal(Object.keys(before.words).length, 10);
		assert.equal(before.progress.points, 100);
		assert.equal(Object.values(before.activity).reduce((a, b) => a + b, 0), 10);
		await clickByText(page, 'button', 'Gå till översikt');
		const after = await savedState(page);
		assert.deepEqual(after.words, before.words);
		assert.equal(after.progress.points, 100);
		assert.deepEqual(after.activity, before.activity);
		await page.reload({ waitUntil: 'networkidle0' });
		assert.deepEqual(await savedState(page), after);
	} finally { await context.close(); }
});

test('v2 and legacy progress retain scheduling fields when content changes', { timeout: 60_000 }, async (t) => {
	if (!browser) return t.skip('Browser unavailable');
	for (const legacy of [false, true]) {
		const { context, page } = await freshPage();
		try {
			const snapshot = { masteryLevel: 3, nextReviewDate: '2099-01-01T12:00:00.000Z', easeFactor: 2.8, repetitionCount: 6, reviewInterval: 42, learnedDate: '2025-01-01T12:00:00.000Z' };
			await page.evaluate((snapshot, legacy) => {
				localStorage.removeItem('palabrita_word_progress');
				if (legacy) localStorage.setItem('palabrita_words', JSON.stringify([{ spanish: 'tenido', ...snapshot }]));
				else localStorage.setItem('palabrita_word_progress', JSON.stringify({ version: 2, progress: { tenido: snapshot } }));
			}, snapshot, legacy);
			await page.reload({ waitUntil: 'networkidle0' });
			assert.deepEqual((await savedState(page)).words.tenido, snapshot);
			if (legacy) assert.equal(await page.evaluate(() => localStorage.getItem('palabrita_words')), null);
		} finally { await context.close(); }
	}
});
