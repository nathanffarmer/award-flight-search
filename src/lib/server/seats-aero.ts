import type { SearchRequest, SearchResponse } from '$lib/types';
import { generateMockResults } from '$lib/mock/fixtures';
import { env } from '$env/dynamic/private';

// Server-side seats.aero client. If SEATS_AERO_API_KEY is set, hit the
// live API; otherwise return generated mock data that matches the same
// response shape so the UI doesn't care which mode it's in.
export async function searchAvailability(req: SearchRequest): Promise<SearchResponse> {
	const apiKey = env.SEATS_AERO_API_KEY;

	if (!apiKey) {
		return {
			results: generateMockResults(req),
			source: 'mock',
			queriedAt: Date.now()
		};
	}

	// Live call — kept minimal; we only need this to be a one-liner swap
	// when a key is provided. The real seats.aero /search endpoint accepts
	// origin_airport, destination_airport, start_date, end_date, cabin, source.
	throw new Error('Live seats.aero integration not wired up yet — set up adapter when a key is available.');
}
