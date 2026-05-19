<script lang="ts">
	import { untrack } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import type { WatchedTrip, SearchResponse } from '$lib/types';
	import { postSearch } from '$lib/search-client';
	import WatchlistCard from './WatchlistCard.svelte';

	let {
		trip,
		onDelete
	}: { trip: WatchedTrip; onDelete: (id: string) => void } = $props();

	// Parent keys cards by trip.id, so trip is stable for this card's life.
	const query = untrack(() =>
		createQuery<SearchResponse>({
			queryKey: [
				'search',
				trip.id,
				trip.origin,
				trip.destination,
				trip.departDate,
				trip.flexDays,
				trip.cabins,
				trip.programs,
				trip.maxMiles
			],
			queryFn: () =>
				postSearch({
					origin: trip.origin,
					destination: trip.destination,
					departDate: trip.departDate,
					flexDays: trip.flexDays,
					cabins: trip.cabins,
					programs: trip.programs,
					maxMiles: trip.maxMiles
				}),
			staleTime: 60_000
		})
	);
</script>

<WatchlistCard
	{trip}
	results={$query.data?.results}
	loading={$query.isLoading}
	{onDelete}
/>
