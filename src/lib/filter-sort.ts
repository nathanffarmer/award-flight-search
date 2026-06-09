import type { AwardAvailability, Cabin, CabinAvailability } from './types';

export type SortKey = 'miles' | 'date' | 'taxes';

export interface FilterSortOptions {
	cabin: Cabin | 'all';
	sort: SortKey;
	directOnly: boolean;
}

export function bestMilesIn(r: AwardAvailability, restrictTo: Cabin | 'all'): number {
	let min = Infinity;
	for (const [c, info] of Object.entries(r.cabins) as [
		Cabin,
		CabinAvailability | undefined
	][]) {
		if (!info) continue;
		if (restrictTo !== 'all' && c !== restrictTo) continue;
		if (info.mileageCost < min) min = info.mileageCost;
	}
	return min;
}

export function hasDirectIn(r: AwardAvailability, restrictTo: Cabin | 'all'): boolean {
	if (restrictTo !== 'all') return r.cabins[restrictTo]?.direct ?? false;
	for (const info of Object.values(r.cabins) as (CabinAvailability | undefined)[]) {
		if (info?.direct) return true;
	}
	return false;
}

export function filterAndSort(
	data: AwardAvailability[],
	{ cabin, sort, directOnly }: FilterSortOptions
): AwardAvailability[] {
	let rows = cabin === 'all' ? [...data] : data.filter((r) => r.cabins[cabin]?.available);
	if (directOnly) rows = rows.filter((r) => hasDirectIn(r, cabin));
	if (sort === 'date') {
		rows.sort((a, b) => a.date.localeCompare(b.date));
	} else if (sort === 'taxes') {
		rows.sort((a, b) => a.taxesUSD - b.taxesUSD);
	} else {
		const keyed = rows.map((r) => ({ r, key: bestMilesIn(r, cabin) }));
		keyed.sort((a, b) => a.key - b.key);
		return keyed.map((k) => k.r);
	}
	return rows;
}
