<script lang="ts">
	import { untrack } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { tripToSearchRequest, type WatchedTrip, type SearchResponse } from '$lib/types';
	import { postSearch } from '$lib/search-client';
	import WatchlistCard from './WatchlistCard.svelte';

	let {
		trip,
		onDelete
	}: { trip: WatchedTrip; onDelete: (id: string) => void } = $props();

	// Parent keys cards by trip.id, so trip is stable for this card's life.
	const query = untrack(() =>
		createQuery<SearchResponse>({
			queryKey: ['search', trip.id],
			queryFn: () => postSearch(tripToSearchRequest(trip)),
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
