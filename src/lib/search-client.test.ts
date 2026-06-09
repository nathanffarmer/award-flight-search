// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { postSearch } from './search-client';
import type { SearchRequest, SearchResponse } from './types';

const sampleReq: SearchRequest = {
	origin: 'JFK',
	destination: 'NRT',
	departDate: '2026-08-15',
	flexDays: 3,
	cabins: ['J'],
	programs: ['aeroplan']
};

const sampleRes: SearchResponse = { results: [], source: 'mock', queriedAt: 1000 };

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
	return vi.fn<typeof fetch>(impl as unknown as typeof fetch);
}

describe('postSearch', () => {
	it('POSTs JSON to /api/search and returns the parsed body', async () => {
		const fetchFn = mockFetch(async () =>
			new Response(JSON.stringify(sampleRes), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
		const result = await postSearch(sampleReq, fetchFn);
		expect(result).toEqual(sampleRes);
		expect(fetchFn).toHaveBeenCalledOnce();
		const [url, init] = fetchFn.mock.calls[0]!;
		expect(url).toBe('/api/search');
		expect(init?.method).toBe('POST');
		expect((init?.headers as Record<string, string>)['content-type']).toBe('application/json');
		expect(JSON.parse(init?.body as string)).toEqual(sampleReq);
	});

	it('throws with the status code on a non-2xx response', async () => {
		const fetchFn = mockFetch(async () => new Response('boom', { status: 500 }));
		await expect(postSearch(sampleReq, fetchFn)).rejects.toThrow('Search failed (500)');
	});

	it('throws on a 400 response', async () => {
		const fetchFn = mockFetch(async () => new Response('bad', { status: 400 }));
		await expect(postSearch(sampleReq, fetchFn)).rejects.toThrow('Search failed (400)');
	});
});
