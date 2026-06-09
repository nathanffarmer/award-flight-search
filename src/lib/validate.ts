import type { Cabin, Program, TripInput } from './types';

export interface TripDraft {
	origin: string;
	destination: string;
	departDate: string;
	returnDate: string;
	flexDays: number;
	maxMiles: number | null;
	cabins: Cabin[];
	programs: Program[];
}

export type ValidationResult =
	| { ok: true; trip: TripInput }
	| { ok: false; error: string };

export function validateTripDraft(draft: TripDraft): ValidationResult {
	const origin = draft.origin.trim().toUpperCase();
	const destination = draft.destination.trim().toUpperCase();

	if (origin.length !== 3 || destination.length !== 3) {
		return { ok: false, error: 'Origin and destination must be 3-letter IATA codes.' };
	}
	if (!draft.departDate) {
		return { ok: false, error: 'Pick a departure date.' };
	}
	if (draft.returnDate && draft.returnDate <= draft.departDate) {
		return { ok: false, error: 'Return date must be after the departure date.' };
	}
	if (draft.cabins.length === 0) {
		return { ok: false, error: 'Pick at least one cabin.' };
	}
	if (draft.programs.length === 0) {
		return { ok: false, error: 'Pick at least one program.' };
	}

	return {
		ok: true,
		trip: {
			origin,
			destination,
			departDate: draft.departDate,
			returnDate: draft.returnDate || undefined,
			flexDays: draft.flexDays,
			cabins: draft.cabins,
			programs: draft.programs,
			maxMiles: draft.maxMiles ?? undefined
		}
	};
}
