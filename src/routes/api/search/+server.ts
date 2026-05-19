import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SearchRequest } from '$lib/types';
import { searchAvailability } from '$lib/server/seats-aero';

export const POST: RequestHandler = async ({ request }) => {
	let body: SearchRequest;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid json');
	}

	if (!body.origin || !body.destination || !body.departDate) {
		throw error(400, 'origin, destination, and departDate are required');
	}
	if (!Array.isArray(body.cabins) || body.cabins.length === 0) {
		throw error(400, 'at least one cabin must be selected');
	}
	if (!Array.isArray(body.programs) || body.programs.length === 0) {
		throw error(400, 'at least one program must be selected');
	}

	const res = await searchAvailability({
		...body,
		flexDays: body.flexDays ?? 0
	});
	return json(res);
};
