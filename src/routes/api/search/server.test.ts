// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { POST } from './+server';
import type { SearchRequest, SearchResponse } from '$lib/types';

const validBody: SearchRequest = {
	origin: 'JFK',
	destination: 'NRT',
	departDate: '2026-08-15',
	flexDays: 3,
	cabins: ['J'],
	programs: ['aeroplan']
};

async function callPOST(body: unknown) {
	const request = new Request('http://test.local/api/search', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
	// Only `request` is read by the handler; the rest of RequestEvent isn't used.
	return await POST({ request } as unknown as Parameters<typeof POST>[0]);
}

describe('POST /api/search', () => {
	it('400s on invalid JSON', async () => {
		await expect(callPOST('not json')).rejects.toMatchObject({ status: 400 });
	});

	it('400s when origin is missing', async () => {
		await expect(callPOST({ ...validBody, origin: '' })).rejects.toMatchObject({ status: 400 });
	});

	it('400s when destination is missing', async () => {
		await expect(callPOST({ ...validBody, destination: '' })).rejects.toMatchObject({
			status: 400
		});
	});

	it('400s when departDate is missing', async () => {
		await expect(callPOST({ ...validBody, departDate: '' })).rejects.toMatchObject({
			status: 400
		});
	});

	it('400s when cabins is empty', async () => {
		await expect(callPOST({ ...validBody, cabins: [] })).rejects.toMatchObject({ status: 400 });
	});

	it('400s when cabins is not an array', async () => {
		await expect(callPOST({ ...validBody, cabins: 'J' })).rejects.toMatchObject({ status: 400 });
	});

	it('400s when programs is empty', async () => {
		await expect(callPOST({ ...validBody, programs: [] })).rejects.toMatchObject({ status: 400 });
	});

	it('returns 200 with mock results on a valid body', async () => {
		const res = await callPOST(validBody);
		expect(res.status).toBe(200);
		const data = (await res.json()) as SearchResponse;
		expect(data.source).toBe('mock');
		expect(Array.isArray(data.results)).toBe(true);
		expect(data.results.length).toBeGreaterThan(0);
	});

	it('defaults flexDays to 0 when omitted', async () => {
		const { flexDays: _omit, ...withoutFlex } = validBody;
		const res = await callPOST(withoutFlex);
		expect(res.status).toBe(200);
		const data = (await res.json()) as SearchResponse;
		for (const r of data.results) {
			expect(r.date).toBe(validBody.departDate);
		}
	});
});
