// Domain types. The `AwardAvailability` shape mirrors seats.aero's /search
// response so the mock fixtures and a real API call return the same thing.

export type Cabin = 'Y' | 'W' | 'J' | 'F';

export const CABIN_LABELS: Record<Cabin, string> = {
	Y: 'Economy',
	W: 'Premium',
	J: 'Business',
	F: 'First'
};

export type Program =
	| 'aeroplan'
	| 'united'
	| 'aa'
	| 'delta'
	| 'alaska'
	| 'flyingblue'
	| 'virgin'
	| 'lifemiles'
	| 'etihad'
	| 'ba';

export const PROGRAM_LABELS: Record<Program, string> = {
	aeroplan: 'Aeroplan',
	united: 'United MileagePlus',
	aa: 'AAdvantage',
	delta: 'SkyMiles',
	alaska: 'Alaska Mileage Plan',
	flyingblue: 'Flying Blue',
	virgin: 'Virgin Atlantic',
	lifemiles: 'LifeMiles',
	etihad: 'Etihad Guest',
	ba: 'British Airways'
};

export interface WatchedTrip {
	id: string;
	origin: string;
	destination: string;
	departDate: string; // YYYY-MM-DD
	flexDays: number; // ±N days around departDate
	cabins: Cabin[];
	programs: Program[];
	maxMiles?: number;
	createdAt: number;
}

// One availability record from seats.aero — one (route, date, program) row
// with per-cabin booleans, costs, direct flags, and remaining seats.
export interface AwardAvailability {
	id: string;
	origin: string;
	destination: string;
	date: string;
	program: Program;
	cabins: {
		[K in Cabin]?: CabinAvailability;
	};
	taxesUSD: number;
	updatedAt: number;
}

export interface CabinAvailability {
	available: boolean;
	mileageCost: number;
	direct: boolean;
	remainingSeats: number;
	airlines: string[]; // e.g. ["AC", "LH"]
}

export interface SearchRequest {
	origin: string;
	destination: string;
	departDate: string;
	flexDays: number;
	cabins: Cabin[];
	programs: Program[];
	maxMiles?: number;
}

export interface SearchResponse {
	results: AwardAvailability[];
	source: 'live' | 'mock';
	queriedAt: number;
}
