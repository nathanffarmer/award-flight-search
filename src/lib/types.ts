// Types mirror seats.aero's /search response so mock and live paths share a shape.

export type Cabin = 'Y' | 'W' | 'J' | 'F';

export const CABIN_ORDER: Cabin[] = ['Y', 'W', 'J', 'F'];

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
	departDate: string;
	flexDays: number;
	cabins: Cabin[];
	programs: Program[];
	maxMiles?: number;
	createdAt: number;
}

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
	airlines: string[];
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

export function tripToSearchRequest(trip: WatchedTrip): SearchRequest {
	return {
		origin: trip.origin,
		destination: trip.destination,
		departDate: trip.departDate,
		flexDays: trip.flexDays,
		cabins: trip.cabins,
		programs: trip.programs,
		maxMiles: trip.maxMiles
	};
}
