import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

import { createWatchlist, KEY } from './watchlist.svelte';
import type { WatchedTrip } from '$lib/types';

const sampleInput: Omit<WatchedTrip, 'id' | 'createdAt' | 'updatedAt'> = {
	origin: 'JFK',
	destination: 'NRT',
	departDate: '2026-08-15',
	flexDays: 3,
	cabins: ['J'],
	programs: ['aeroplan']
};

function readStored(): WatchedTrip[] {
	return JSON.parse(localStorage.getItem(KEY) ?? '[]');
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
	localStorage.clear();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('createWatchlist', () => {
	it('starts empty when localStorage has nothing', () => {
		expect([...createWatchlist().all]).toEqual([]);
	});

	it('add() returns a trip stamped with an id and matching timestamps', () => {
		const wl = createWatchlist();
		const t = wl.add(sampleInput);
		expect(t.id).toBeTruthy();
		expect(t.createdAt).toBe(Date.now());
		expect(t.updatedAt).toBe(t.createdAt);
		expect(wl.all).toHaveLength(1);
	});

	it('add() prepends newest first', () => {
		const wl = createWatchlist();
		const a = wl.add(sampleInput);
		const b = wl.add({ ...sampleInput, origin: 'SFO' });
		expect([...wl.all].map((t) => t.id)).toEqual([b.id, a.id]);
	});

	it('add() persists to localStorage', () => {
		const wl = createWatchlist();
		const t = wl.add(sampleInput);
		const stored = readStored();
		expect(stored).toHaveLength(1);
		expect(stored[0].id).toBe(t.id);
	});

	it('get() finds by id and returns undefined for a miss', () => {
		const wl = createWatchlist();
		const t = wl.add(sampleInput);
		expect(wl.get(t.id)).toEqual(t);
		expect(wl.get('missing')).toBeUndefined();
	});

	it('update() applies changes, bumps updatedAt, preserves id and createdAt', () => {
		const wl = createWatchlist();
		const t = wl.add(sampleInput);
		vi.advanceTimersByTime(5000);
		wl.update(t.id, { flexDays: 7, cabins: ['J', 'F'] });
		const u = wl.get(t.id)!;
		expect(u.flexDays).toBe(7);
		expect(u.cabins).toEqual(['J', 'F']);
		expect(u.id).toBe(t.id);
		expect(u.createdAt).toBe(t.createdAt);
		expect(u.updatedAt).toBe(t.createdAt + 5000);
	});

	it('update() persists the change', () => {
		const wl = createWatchlist();
		const t = wl.add(sampleInput);
		wl.update(t.id, { flexDays: 9 });
		expect(readStored()[0].flexDays).toBe(9);
	});

	it('update() with an unknown id is a no-op', () => {
		const wl = createWatchlist();
		const t = wl.add(sampleInput);
		wl.update('missing', { flexDays: 99 });
		expect(wl.get(t.id)!.flexDays).toBe(3);
	});

	it('remove() deletes by id and persists', () => {
		const wl = createWatchlist();
		const a = wl.add(sampleInput);
		const b = wl.add({ ...sampleInput, origin: 'LAX' });
		wl.remove(a.id);
		expect([...wl.all].map((t) => t.id)).toEqual([b.id]);
		expect(readStored()).toHaveLength(1);
	});

	it('loads existing trips from localStorage on construction', () => {
		const t = createWatchlist().add(sampleInput);
		const reopened = createWatchlist();
		expect(reopened.all).toHaveLength(1);
		expect(reopened.all[0].id).toBe(t.id);
	});

	it('falls back to empty on corrupt JSON', () => {
		localStorage.setItem(KEY, '{not json');
		expect([...createWatchlist().all]).toEqual([]);
	});

	it('falls back to empty when the stored value is not an array', () => {
		localStorage.setItem(KEY, '{"foo":1}');
		expect([...createWatchlist().all]).toEqual([]);
	});
});
