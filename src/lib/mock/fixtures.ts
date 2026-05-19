import type { AwardAvailability, Cabin, Program, SearchRequest } from '$lib/types';

const CABIN_BASE_MILES: Record<Cabin, number> = {
	Y: 30_000,
	W: 55_000,
	J: 85_000,
	F: 140_000
};

const PROGRAM_MULTIPLIER: Record<Program, number> = {
	aeroplan: 0.95,
	united: 1.0,
	aa: 0.9,
	delta: 1.4,
	alaska: 0.85,
	flyingblue: 1.05,
	virgin: 0.8,
	lifemiles: 0.95,
	etihad: 1.1,
	ba: 1.2
};

const AIRLINES_BY_PROGRAM: Record<Program, string[]> = {
	aeroplan: ['AC', 'LH', 'UA'],
	united: ['UA', 'LH', 'NH'],
	aa: ['AA', 'BA', 'QR'],
	delta: ['DL', 'AF', 'KL'],
	alaska: ['AS', 'AA', 'CX'],
	flyingblue: ['AF', 'KL', 'DL'],
	virgin: ['VS', 'DL'],
	lifemiles: ['AV', 'UA', 'LH'],
	etihad: ['EY'],
	ba: ['BA', 'AA', 'QR']
};

function hash(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return Math.abs(h);
}

function dateRange(center: string, flex: number): string[] {
	const out: string[] = [];
	const base = new Date(center + 'T00:00:00Z');
	for (let d = -flex; d <= flex; d++) {
		const day = new Date(base);
		day.setUTCDate(day.getUTCDate() + d);
		out.push(day.toISOString().slice(0, 10));
	}
	return out;
}

export function generateMockResults(req: SearchRequest): AwardAvailability[] {
	const dates = dateRange(req.departDate, req.flexDays);
	const results: AwardAvailability[] = [];

	for (const date of dates) {
		for (const program of req.programs) {
			const seed = hash(`${req.origin}${req.destination}${date}${program}`);
			if (seed % 10 < 3) continue;

			const cabinsOut: AwardAvailability['cabins'] = {};
			for (const cabin of req.cabins) {
				const cabinSeed = hash(`${seed}${cabin}`);
				if (cabinSeed % 10 >= 6) continue;

				const base = CABIN_BASE_MILES[cabin];
				const mult = PROGRAM_MULTIPLIER[program];
				const sweet = cabinSeed % 13 === 0 ? 0.7 : 1.0;
				const jitter = 0.85 + (cabinSeed % 30) / 100;

				const miles = Math.round((base * mult * sweet * jitter) / 500) * 500;
				const seats = (cabinSeed % 6) + 1;
				const direct = cabinSeed % 3 !== 0;
				const airlines = AIRLINES_BY_PROGRAM[program];

				cabinsOut[cabin] = {
					available: true,
					mileageCost: miles,
					direct,
					remainingSeats: seats,
					airlines: direct ? airlines.slice(0, 1) : airlines.slice(0, 2)
				};
			}

			if (Object.keys(cabinsOut).length === 0) continue;

			results.push({
				id: `${req.origin}-${req.destination}-${date}-${program}`,
				origin: req.origin,
				destination: req.destination,
				date,
				program,
				cabins: cabinsOut,
				taxesUSD: 50 + (seed % 350),
				updatedAt: Date.now()
			});
		}
	}

	if (req.maxMiles != null) {
		const cap = req.maxMiles;
		return results.filter((r) =>
			Object.values(r.cabins).some((c) => c && c.mileageCost <= cap)
		);
	}

	return results;
}
