// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateTripDraft, type TripDraft } from './validate';

const validDraft: TripDraft = {
	origin: 'jfk',
	destination: ' nrt ',
	departDate: '2026-08-15',
	returnDate: '',
	flexDays: 3,
	maxMiles: null,
	cabins: ['J'],
	programs: ['aeroplan']
};

describe('validateTripDraft', () => {
	it('trims and uppercases origin and destination on the happy path', () => {
		const r = validateTripDraft(validDraft);
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.trip.origin).toBe('JFK');
			expect(r.trip.destination).toBe('NRT');
		}
	});

	it('coerces empty returnDate and null maxMiles to undefined', () => {
		const r = validateTripDraft({ ...validDraft, returnDate: '', maxMiles: null });
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.trip.returnDate).toBeUndefined();
			expect(r.trip.maxMiles).toBeUndefined();
		}
	});

	it('preserves returnDate and maxMiles when set', () => {
		const r = validateTripDraft({ ...validDraft, returnDate: '2026-08-22', maxMiles: 80_000 });
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.trip.returnDate).toBe('2026-08-22');
			expect(r.trip.maxMiles).toBe(80_000);
		}
	});

	it('rejects non-3-letter origin', () => {
		expect(validateTripDraft({ ...validDraft, origin: 'JF' })).toEqual({
			ok: false,
			error: 'Origin and destination must be 3-letter IATA codes.'
		});
	});

	it('rejects non-3-letter destination', () => {
		expect(validateTripDraft({ ...validDraft, destination: 'TOKYO' })).toEqual({
			ok: false,
			error: 'Origin and destination must be 3-letter IATA codes.'
		});
	});

	it('rejects a missing departure date', () => {
		expect(validateTripDraft({ ...validDraft, departDate: '' })).toEqual({
			ok: false,
			error: 'Pick a departure date.'
		});
	});

	it('rejects a return date on the departure date', () => {
		const r = validateTripDraft({ ...validDraft, returnDate: '2026-08-15' });
		expect(r).toEqual({
			ok: false,
			error: 'Return date must be after the departure date.'
		});
	});

	it('rejects a return date before the departure date', () => {
		const r = validateTripDraft({ ...validDraft, returnDate: '2026-08-14' });
		expect(r.ok).toBe(false);
	});

	it('accepts a return date after the departure date', () => {
		const r = validateTripDraft({ ...validDraft, returnDate: '2026-08-16' });
		expect(r.ok).toBe(true);
	});

	it('rejects an empty cabins array', () => {
		expect(validateTripDraft({ ...validDraft, cabins: [] })).toEqual({
			ok: false,
			error: 'Pick at least one cabin.'
		});
	});

	it('rejects an empty programs array', () => {
		expect(validateTripDraft({ ...validDraft, programs: [] })).toEqual({
			ok: false,
			error: 'Pick at least one program.'
		});
	});
});
