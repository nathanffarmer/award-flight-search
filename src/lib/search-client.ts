import type { SearchRequest, SearchResponse } from '$lib/types';

export async function postSearch(req: SearchRequest, fetchFn: typeof fetch = fetch): Promise<SearchResponse> {
	const res = await fetchFn('/api/search', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(req)
	});
	if (!res.ok) {
		throw new Error(`Search failed (${res.status})`);
	}
	return res.json();
}
