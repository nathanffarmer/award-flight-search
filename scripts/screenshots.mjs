// Capture PNG screenshots of key UI states in light + dark mode.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5173';
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
		maxMiles: undefined,
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

async function waitForLoad(page) {
	// Wait for any "Searching…" indicators to clear
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(400);
}

for (const scheme of ['light', 'dark']) {
	// 1. Empty home
	await shot('home-empty', scheme, async (page) => {
		await page.goto(BASE + '/');
		await page.evaluate(() => localStorage.removeItem('award-watchlist-v1'));
		await page.goto(BASE + '/');
		await waitForLoad(page);
	});

	// 2. Home with trips
	await shot('home-watchlist', scheme, async (page) => {
		await seedWatchlist(page);
		await page.goto(BASE + '/');
		await waitForLoad(page);
	});

	// 3. Add trip form
	await shot('add-trip', scheme, async (page) => {
		await page.goto(BASE + '/trips/new');
		await waitForLoad(page);
		await page.fill('input[placeholder="JFK"]', 'JFK');
		await page.fill('input[placeholder="NRT"]', 'NRT');
		await page.fill('input[type="date"]', '2026-08-15');
		await page.waitForTimeout(200);
	});

	// 4. Drill-down
	await shot('trip-detail', scheme, async (page) => {
		await seedWatchlist(page);
		await page.goto(BASE + '/trips/sample1');
		await waitForLoad(page);
	});
}
