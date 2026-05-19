// Capture PNG screenshots of key UI states in light + dark mode.
//
// Spawns `vite dev` on a free port, drives the UI with Playwright, then
// shuts everything down. Run with `npm run screenshots`.

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const PORT = 5179;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = 'docs/screenshots';

const NOW = Date.now();
const SAMPLE_TRIPS = [
	{
		id: 'sample1',
		origin: 'JFK',
		destination: 'NRT',
		departDate: '2026-08-15',
		flexDays: 3,
		cabins: ['J', 'F'],
		programs: ['aeroplan', 'aa', 'united', 'flyingblue'],
		createdAt: NOW,
		updatedAt: NOW
	},
	{
		id: 'sample2',
		origin: 'SFO',
		destination: 'LHR',
		departDate: '2026-10-04',
		returnDate: '2026-10-18',
		flexDays: 2,
		cabins: ['Y', 'W', 'J'],
		programs: ['virgin', 'aa', 'flyingblue', 'ba'],
		maxMiles: 90000,
		createdAt: NOW,
		updatedAt: NOW
	},
	{
		id: 'sample3',
		origin: 'LAX',
		destination: 'SYD',
		departDate: '2027-01-12',
		flexDays: 4,
		cabins: ['J'],
		programs: ['aeroplan', 'united', 'alaska'],
		maxMiles: 100000,
		createdAt: NOW,
		updatedAt: NOW
	}
];

async function startDevServer() {
	// detached so we can SIGTERM the whole process group on shutdown — npm
	// spawns sh spawns vite, and a non-group kill would leave vite orphaned.
	const proc = spawn(
		'npm',
		['run', 'dev', '--', '--port', String(PORT), '--host', '127.0.0.1'],
		{ stdio: ['ignore', 'pipe', 'pipe'], detached: true }
	);
	proc.on('error', (err) => console.error('[dev]', err));
	const ready = new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('dev server did not start within 30s')), 30_000);
		proc.stdout.on('data', (chunk) => {
			if (chunk.toString().includes('ready')) {
				clearTimeout(timer);
				resolve();
			}
		});
		proc.stderr.on('data', (chunk) => process.stderr.write(chunk));
	});
	await ready;
	return proc;
}

function stopDevServer(proc) {
	try {
		process.kill(-proc.pid, 'SIGTERM');
	} catch {
		proc.kill('SIGTERM');
	}
}

async function shot(browser, name, scheme, fn) {
	const ctx = await browser.newContext({
		viewport: { width: 1200, height: 900 },
		colorScheme: scheme,
		deviceScaleFactor: 2
	});
	const page = await ctx.newPage();
	await fn(page);
	const path = `${OUT}/${name}-${scheme}.png`;
	await page.screenshot({ path, fullPage: true });
	console.log('wrote', path);
	await ctx.close();
}

async function seedWatchlist(page) {
	await page.goto(BASE + '/');
	await page.evaluate((trips) => {
		localStorage.setItem('award-watchlist-v1', JSON.stringify(trips));
	}, SAMPLE_TRIPS);
}

async function settle(page) {
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(400);
}

await mkdir(OUT, { recursive: true });
const dev = await startDevServer();
const browser = await chromium.launch();

try {
	for (const scheme of ['light', 'dark']) {
		await shot(browser, 'home-empty', scheme, async (page) => {
			await page.goto(BASE + '/');
			await page.evaluate(() => localStorage.removeItem('award-watchlist-v1'));
			await page.goto(BASE + '/');
			await settle(page);
		});

		await shot(browser, 'home-watchlist', scheme, async (page) => {
			await seedWatchlist(page);
			await page.goto(BASE + '/');
			await settle(page);
		});

		await shot(browser, 'add-trip', scheme, async (page) => {
			await page.goto(BASE + '/trips/new');
			await settle(page);
			const dateInputs = page.locator('input[type="date"]');
			await page.fill('input[placeholder="JFK"]', 'JFK');
			await page.fill('input[placeholder="NRT"]', 'NRT');
			await dateInputs.nth(0).fill('2026-08-15');
			await dateInputs.nth(1).fill('2026-08-22');
			await page.waitForTimeout(200);
		});

		await shot(browser, 'trip-detail', scheme, async (page) => {
			await seedWatchlist(page);
			await page.goto(BASE + '/trips/sample1');
			await settle(page);
		});

		await shot(browser, 'trip-detail-roundtrip', scheme, async (page) => {
			await seedWatchlist(page);
			await page.goto(BASE + '/trips/sample2');
			await settle(page);
		});

		await shot(browser, 'trip-edit', scheme, async (page) => {
			await seedWatchlist(page);
			await page.goto(BASE + '/trips/sample2/edit');
			await settle(page);
		});
	}
} finally {
	await browser.close();
	stopDevServer(dev);
}
