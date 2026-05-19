import type { SearchRequest, SearchResponse } from '$lib/types';
import { generateMockResults } from '$lib/mock/fixtures';
import { env } from '$env/dynamic/private';

export async function searchAvailability(req: SearchRequest): Promise<SearchResponse> {
	const apiKey = env.SEATS_AERO_API_KEY;

	if (!apiKey) {
		return {
			results: generateMockResults(req),
			source: 'mock',
			queriedAt: Date.now()
		};
	}

	throw new Error('Live seats.aero integration not wired up yet');
}
