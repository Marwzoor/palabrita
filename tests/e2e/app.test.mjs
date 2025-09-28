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
