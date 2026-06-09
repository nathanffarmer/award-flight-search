// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { formatMiles, formatUSD, formatDate, formatDateLong } from './format';

describe('formatMiles', () => {
	it('renders round thousands without decimals', () => {
		expect(formatMiles(30_000)).toBe('30k');
		expect(formatMiles(82_000)).toBe('82k');
		expect(formatMiles(100_000)).toBe('100k');
	});

	it('renders partial thousands with one decimal', () => {
		expect(formatMiles(1_500)).toBe('1.5k');
		expect(formatMiles(30_500)).toBe('30.5k');
		expect(formatMiles(58_500)).toBe('58.5k');
	});

	it('renders sub-1000 values in full', () => {
		expect(formatMiles(0)).toBe('0');
		expect(formatMiles(999)).toBe('999');
	});
});

describe('formatUSD', () => {
	it('prefixes a dollar sign and drops cents', () => {
		expect(formatUSD(0)).toBe('$0');
		expect(formatUSD(383)).toBe('$383');
	});

	it('rounds to whole dollars', () => {
		expect(formatUSD(383.7)).toBe('$384');
		expect(formatUSD(12.2)).toBe('$12');
	});
});

describe('formatDate', () => {
	it('formats an ISO date as a short weekday/month/day', () => {
		expect(formatDate('2026-08-15')).toBe('Sat, Aug 15');
	});

	it('is timezone-safe (no off-by-one across the UTC boundary)', () => {
		expect(formatDate('2026-01-01')).toBe('Thu, Jan 1');
	});
});

describe('formatDateLong', () => {
	it('formats an ISO date with the full month and year', () => {
		expect(formatDateLong('2026-08-15')).toBe('Saturday, August 15, 2026');
	});
});
