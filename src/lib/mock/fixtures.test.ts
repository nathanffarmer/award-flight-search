// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateMockResults } from './fixtures';
import type { AwardAvailability, SearchRequest } from '$lib/types';

const baseReq: SearchRequest = {
	origin: 'JFK',
	destination: 'NRT',
	departDate: '2026-08-15',
	flexDays: 3,
	cabins: ['J', 'F'],
	programs: ['aeroplan', 'aa', 'united']
};

// generateMockResults is deterministic for a given request, so the read-only
// tests below share one result set.
const baseResults = generateMockResults(baseReq);

// updatedAt is Date.now() per row, so it's the one non-deterministic field.
function pinTimestamps(rows: AwardAvailability[]): AwardAvailability[] {
	return rows.map((r) => ({ ...r, updatedAt: 0 }));
}

describe('generateMockResults', () => {
	it('is deterministic for the same request', () => {
		const a = generateMockResults(baseReq);
		const b = generateMockResults(baseReq);
		expect(pinTimestamps(a)).toEqual(pinTimestamps(b));
	});

	it('only produces dates within the flex window', () => {
		const allowed = new Set([
			'2026-08-12',
			'2026-08-13',
			'2026-08-14',
			'2026-08-15',
			'2026-08-16',
			'2026-08-17',
			'2026-08-18'
		]);
		for (const r of baseResults) {
			expect(allowed.has(r.date)).toBe(true);
		}
		// The base request is dense enough that most of the 7-day window
		// should be hit. Threshold is lenient (≥5 of 7) because the
		// per-(date, program) skip rate is real; a tighter assertion would
		// be seed-fragile. Catches dateRange silently narrowing the window.
		const produced = new Set(baseResults.map((r) => r.date));
		expect(produced.size).toBeGreaterThanOrEqual(5);
	});

	it('with flexDays 0 produces only the departure date', () => {
		for (const r of generateMockResults({ ...baseReq, flexDays: 0 })) {
			expect(r.date).toBe('2026-08-15');
		}
	});

	it('only includes requested programs', () => {
		for (const r of baseResults) {
			expect(baseReq.programs).toContain(r.program);
		}
	});

	it('only includes requested cabins on each row', () => {
		for (const r of baseResults) {
			for (const cabin of Object.keys(r.cabins)) {
				expect(baseReq.cabins).toContain(cabin);
			}
		}
	});

	it('never emits a row with zero cabins', () => {
		for (const r of baseResults) {
			expect(Object.keys(r.cabins).length).toBeGreaterThan(0);
		}
	});

	it('respects the maxMiles cap', () => {
		const cap = 70_000;
		const results = generateMockResults({ ...baseReq, maxMiles: cap });
		for (const r of results) {
			const cheapest = Math.min(
				...Object.values(r.cabins).map((c) => c!.mileageCost)
			);
			expect(cheapest).toBeLessThanOrEqual(cap);
		}
	});

	it('produces well-formed rows', () => {
		expect(baseResults.length).toBeGreaterThan(0);
		const r = baseResults[0];
		expect(r.id).toBe(`${r.origin}-${r.destination}-${r.date}-${r.program}`);
		expect(r.origin).toBe('JFK');
		expect(r.destination).toBe('NRT');
		expect(typeof r.taxesUSD).toBe('number');

		const cabin = Object.values(r.cabins)[0]!;
		expect(cabin.available).toBe(true);
		expect(typeof cabin.mileageCost).toBe('number');
		expect(typeof cabin.direct).toBe('boolean');
		expect(cabin.remainingSeats).toBeGreaterThan(0);
		expect(cabin.airlines.length).toBeGreaterThan(0);
	});
});
