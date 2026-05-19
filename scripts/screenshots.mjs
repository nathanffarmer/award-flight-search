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

const SAMPLE_TRIPS = [
	{
		id: 'sample1',
		origin: 'JFK',
		destination: 'NRT',
		departDate: '2026-08-15',
		flexDays: 3,
		cabins: ['J', 'F'],
		programs: ['aeroplan', 'aa', 'united', 'flyingblue'],
		createdAt: Date.now()
	},
	{
		id: 'sample2',
		origin: 'SFO',
		destination: 'LHR',
		departDate: '2026-10-04',
		flexDays: 2,
		cabins: ['Y', 'W', 'J'],
		programs: ['virgin', 'aa', 'flyingblue', 'ba'],
		maxMiles: 90000,
		createdAt: Date.now()
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
		createdAt: Date.now()
	}
];

async function startDevServer() {
	const proc = spawn(
		'npm',
		['run', 'dev', '--', '--port', String(PORT), '--host', '127.0.0.1'],
		{ stdio: ['ignore', 'pipe', 'pipe'] }
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

async function shot(name, scheme, fn) {
	const browser = await chromium.launch();
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
	await browser.close();
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

try {
	for (const scheme of ['light', 'dark']) {
		await shot('home-empty', scheme, async (page) => {
			await page.goto(BASE + '/');
			await page.evaluate(() => localStorage.removeItem('award-watchlist-v1'));
			await page.goto(BASE + '/');
			await settle(page);
		});

		await shot('home-watchlist', scheme, async (page) => {
			await seedWatchlist(page);
			await page.goto(BASE + '/');
			await settle(page);
		});

		await shot('add-trip', scheme, async (page) => {
			await page.goto(BASE + '/trips/new');
			await settle(page);
			await page.fill('input[placeholder="JFK"]', 'JFK');
			await page.fill('input[placeholder="NRT"]', 'NRT');
			await page.fill('input[type="date"]', '2026-08-15');
			await page.waitForTimeout(200);
		});

		await shot('trip-detail', scheme, async (page) => {
			await seedWatchlist(page);
			await page.goto(BASE + '/trips/sample1');
			await settle(page);
		});
	}
} finally {
	dev.kill('SIGTERM');
}
