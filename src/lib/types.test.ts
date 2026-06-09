// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { tripToSearchRequest, tripToReturnSearchRequest, type WatchedTrip } from './types';

const trip: WatchedTrip = {
	id: 'abc123',
	origin: 'JFK',
	destination: 'NRT',
	departDate: '2026-08-15',
	returnDate: '2026-08-29',
	flexDays: 3,
	cabins: ['J', 'F'],
	programs: ['aeroplan', 'aa'],
	maxMiles: 80_000,
	createdAt: 1000,
	updatedAt: 2000
};

describe('tripToSearchRequest', () => {
	it('copies the search fields and drops id, timestamps, and returnDate', () => {
		expect(tripToSearchRequest(trip)).toEqual({
			origin: 'JFK',
			destination: 'NRT',
			departDate: '2026-08-15',
			flexDays: 3,
			cabins: ['J', 'F'],
			programs: ['aeroplan', 'aa'],
			maxMiles: 80_000
		});
	});
});

describe('tripToReturnSearchRequest', () => {
	it('swaps origin and destination and uses returnDate as the departure date', () => {
		const req = tripToReturnSearchRequest(trip);
		expect(req.origin).toBe('NRT');
		expect(req.destination).toBe('JFK');
		expect(req.departDate).toBe('2026-08-29');
	});

	it('carries cabins, programs, flex, and the miles cap through unchanged', () => {
		const req = tripToReturnSearchRequest(trip);
		expect(req.cabins).toEqual(['J', 'F']);
		expect(req.programs).toEqual(['aeroplan', 'aa']);
		expect(req.flexDays).toBe(3);
		expect(req.maxMiles).toBe(80_000);
	});
});
