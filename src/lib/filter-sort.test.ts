// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { bestMilesIn, hasDirectIn, filterAndSort } from './filter-sort';
import type { AwardAvailability, CabinAvailability } from './types';

function cabin(opts: Partial<CabinAvailability> = {}): CabinAvailability {
	return {
		available: true,
		mileageCost: 50_000,
		direct: false,
		remainingSeats: 4,
		airlines: ['AA'],
		...opts
	};
}

function row(
	overrides: Partial<AwardAvailability> & {
		cabins: AwardAvailability['cabins'];
	}
): AwardAvailability {
	return {
		id: 'r',
		origin: 'JFK',
		destination: 'NRT',
		date: '2026-08-15',
		program: 'aeroplan',
		taxesUSD: 100,
		updatedAt: 0,
		...overrides
	};
}

describe('bestMilesIn', () => {
	it('returns Infinity for a row with no cabins matching the restriction', () => {
		const r = row({ cabins: { J: cabin({ mileageCost: 60_000 }) } });
		expect(bestMilesIn(r, 'Y')).toBe(Infinity);
	});

	it('returns the min across all cabins when unrestricted', () => {
		const r = row({
			cabins: { J: cabin({ mileageCost: 60_000 }), F: cabin({ mileageCost: 120_000 }) }
		});
		expect(bestMilesIn(r, 'all')).toBe(60_000);
	});

	it('restricts to the requested cabin', () => {
		const r = row({
			cabins: { J: cabin({ mileageCost: 60_000 }), F: cabin({ mileageCost: 120_000 }) }
		});
		expect(bestMilesIn(r, 'F')).toBe(120_000);
	});

	it('ignores undefined cabin entries', () => {
		const r = row({ cabins: { J: cabin({ mileageCost: 60_000 }), F: undefined } });
		expect(bestMilesIn(r, 'all')).toBe(60_000);
	});
});

describe('hasDirectIn', () => {
	it('is true when the restricted cabin is direct', () => {
		const r = row({ cabins: { J: cabin({ direct: true }) } });
		expect(hasDirectIn(r, 'J')).toBe(true);
	});

	it('is false when the restricted cabin is not direct', () => {
		const r = row({ cabins: { J: cabin({ direct: false }) } });
		expect(hasDirectIn(r, 'J')).toBe(false);
	});

	it('is false when the restricted cabin is absent', () => {
		const r = row({ cabins: { J: cabin({ direct: true }) } });
		expect(hasDirectIn(r, 'F')).toBe(false);
	});

	it('is true under "all" when any cabin is direct', () => {
		const r = row({
			cabins: { J: cabin({ direct: false }), F: cabin({ direct: true }) }
		});
		expect(hasDirectIn(r, 'all')).toBe(true);
	});

	it('is false under "all" when no cabin is direct', () => {
		const r = row({
			cabins: { J: cabin({ direct: false }), F: cabin({ direct: false }) }
		});
		expect(hasDirectIn(r, 'all')).toBe(false);
	});
});

describe('filterAndSort', () => {
	const rows: AwardAvailability[] = [
		row({
			id: 'a',
			date: '2026-08-16',
			taxesUSD: 200,
			cabins: { J: cabin({ mileageCost: 70_000, direct: true }) }
		}),
		row({
			id: 'b',
			date: '2026-08-14',
			taxesUSD: 50,
			cabins: { Y: cabin({ mileageCost: 25_000, direct: false }) }
		}),
		row({
			id: 'c',
			date: '2026-08-15',
			taxesUSD: 300,
			cabins: { J: cabin({ mileageCost: 60_000, direct: false }) }
		})
	];

	it('returns empty for empty input', () => {
		expect(filterAndSort([], { cabin: 'all', sort: 'miles', directOnly: false })).toEqual([]);
	});

	it('sorts by miles ascending under "all"', () => {
		const out = filterAndSort(rows, { cabin: 'all', sort: 'miles', directOnly: false });
		expect(out.map((r) => r.id)).toEqual(['b', 'c', 'a']);
	});

	it('sorts by date ascending', () => {
		const out = filterAndSort(rows, { cabin: 'all', sort: 'date', directOnly: false });
		expect(out.map((r) => r.id)).toEqual(['b', 'c', 'a']);
	});

	it('sorts by taxes ascending', () => {
		const out = filterAndSort(rows, { cabin: 'all', sort: 'taxes', directOnly: false });
		expect(out.map((r) => r.id)).toEqual(['b', 'a', 'c']);
	});

	it('filters to a specific cabin and sorts by that cabin\'s miles', () => {
		const out = filterAndSort(rows, { cabin: 'J', sort: 'miles', directOnly: false });
		expect(out.map((r) => r.id)).toEqual(['c', 'a']);
	});

	it('filters directOnly under "all" — keeps rows with any direct cabin', () => {
		const out = filterAndSort(rows, { cabin: 'all', sort: 'date', directOnly: true });
		expect(out.map((r) => r.id)).toEqual(['a']);
	});

	it('filters directOnly under a specific cabin — keeps only that cabin being direct', () => {
		const out = filterAndSort(rows, { cabin: 'J', sort: 'miles', directOnly: true });
		expect(out.map((r) => r.id)).toEqual(['a']);
	});

	it('does not mutate the input array', () => {
		const input = [...rows];
		filterAndSort(input, { cabin: 'all', sort: 'miles', directOnly: false });
		expect(input.map((r) => r.id)).toEqual(['a', 'b', 'c']);
	});
});
