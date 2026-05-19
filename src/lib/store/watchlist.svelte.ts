import type { WatchedTrip } from '$lib/types';
import { browser } from '$app/environment';

const KEY = 'award-watchlist-v1';

function load(): WatchedTrip[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function save(trips: WatchedTrip[]) {
	if (!browser) return;
	localStorage.setItem(KEY, JSON.stringify(trips));
}

function makeId() {
	return Math.random().toString(36).slice(2, 10);
}

function createWatchlist() {
	let trips = $state<WatchedTrip[]>(load());

	return {
		get all() {
			return trips;
		},
		get(id: string) {
			return trips.find((t) => t.id === id);
		},
		add(trip: Omit<WatchedTrip, 'id' | 'createdAt' | 'updatedAt'>): WatchedTrip {
			const now = Date.now();
			const full: WatchedTrip = { ...trip, id: makeId(), createdAt: now, updatedAt: now };
			trips = [full, ...trips];
			save(trips);
			return full;
		},
		update(id: string, changes: Partial<Omit<WatchedTrip, 'id' | 'createdAt'>>): void {
			trips = trips.map((t) =>
				t.id === id ? { ...t, ...changes, updatedAt: Date.now() } : t
			);
			save(trips);
		},
		remove(id: string) {
			trips = trips.filter((t) => t.id !== id);
			save(trips);
		}
	};
}

export const watchlist = createWatchlist();
